// shell.mjs — the small amount of process and filesystem plumbing the checks need.

import { execFileSync, spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';

/** Run a command and return stdout, or throw with the combined output. */
export function run(cmd, args, opts = {}) {
  return execFileSync(cmd, args, {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
    ...opts
  }).trim();
}

/** Run a command for its exit code, capturing output. Never throws. */
export function attempt(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    ...opts
  });
  return {
    ok: r.status === 0,
    code: r.status,
    out: ((r.stdout || '') + (r.stderr || '')).trim(),
    error: r.error
  };
}

/**
 * Resolve a git binary that this Node build can actually spawn.
 *
 * On an Apple-silicon machine with an x86-only git earlier in PATH (a common
 * Homebrew-under-Rosetta leftover), posix_spawn fails with EBADARCH even though
 * the same command works from an interactive shell. Probe, then fall back to
 * the system git, which is universal. Override with STUDIO_GIT.
 */
let cachedGit = null;
export function gitPath() {
  if (cachedGit) return cachedGit;
  for (const candidate of [process.env.STUDIO_GIT, 'git', '/usr/bin/git'].filter(Boolean)) {
    if (attempt(candidate, ['--version']).ok) return (cachedGit = candidate);
  }
  return (cachedGit = 'git');
}

export const git = (root, ...args) => run(gitPath(), args, { cwd: root });

/**
 * Like `git`, but without trimming. Porcelain status lines begin with a space
 * for unstaged changes, and trimming the output would eat it and shift every
 * path by one character.
 */
export function gitRaw(root, ...args) {
  // stderr is piped, not inherited: callers that expect a command to fail (a
  // path absent at the base revision, say) would otherwise print git's error to
  // the console before catching it, which reads like a broken run.
  return execFileSync(gitPath(), args, {
    cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe']
  });
}

/** Does this ref exist? */
export function refExists(root, ref) {
  return attempt(gitPath(), ['rev-parse', '--verify', '--quiet', ref + '^{commit}'], { cwd: root }).ok;
}

/** Every studio iteration tag, newest first. */
function iterationTags(root) {
  const out = attempt(gitPath(), ['tag', '--list', 'studio-iteration-*', '--sort=-v:refname'], { cwd: root });
  return out.out.split('\n').map(s => s.trim()).filter(Boolean);
}

/** The commit a ref names, or null when it names none. */
function commitOf(root, ref) {
  const r = attempt(gitPath(), ['rev-parse', '--verify', '--quiet', ref + '^{commit}'], { cwd: root });
  return r.ok ? r.out : null;
}

/**
 * The newest studio iteration tag that does not point at HEAD, or null.
 *
 * This is what "the previous release" means to every check that compares
 * against one. The newest tag is right while an iteration is being built and
 * wrong the moment its own tag is pushed: HEAD then *is* the newest tag, the
 * comparison covers nothing, and a check built to prove production was not
 * touched passes having proved nothing (TD-011). Skipping every tag on HEAD —
 * there can be more than one — gives the release before this one.
 */
export function previousIterationTag(root) {
  const head = commitOf(root, 'HEAD');
  return iterationTags(root).find(tag => commitOf(root, tag) !== head) ?? null;
}

/**
 * The newest iteration with a tracked file under `docs/studio/iterations/`, as
 * `NN`, or null.
 *
 * Read from git's index, not the filesystem: an empty or untracked directory —
 * `mkdir iterations/05`, say — used to become "the iteration", and with it the
 * production fixes the guard admits and the files `hygiene` scans. An iteration
 * exists once something in it is staged or committed.
 */
export function newestTrackedIteration(root) {
  const r = attempt(gitPath(), ['ls-files', '-z', '--', 'docs/studio/iterations'], { cwd: root });
  if (!r.ok) return null;
  const found = new Set();
  for (const file of r.out.split('\0')) {
    const m = /^docs\/studio\/iterations\/(\d{2})\//.exec(file);
    if (m) found.add(m[1]);
  }
  return [...found].sort().at(-1) ?? null;
}

/** How many commits are reachable from HEAD and not from `ref`. */
export function commitsSince(root, ref) {
  const r = attempt(gitPath(), ['rev-list', '--count', `${ref}..HEAD`], { cwd: root });
  return r.ok ? Number(r.out) : null;
}

/**
 * Paths git reports as changed in the working tree, staged or not.
 *
 * NUL-separated, because with the default core.quotePath a path with non-ASCII
 * characters comes back quoted and escaped, which the guard would then read as
 * a different (and unrecognised) path.
 */
export function workingTreePaths(root) {
  const parts = gitRaw(root, 'status', '--porcelain=v1', '-z', '--untracked-files=all')
    .split('\0').filter(Boolean);
  const paths = [];
  for (let i = 0; i < parts.length; i++) {
    const status = parts[i].slice(0, 2);
    paths.push(parts[i].slice(3));
    // A rename or copy is followed by its other path in the next record.
    if (/[RC]/.test(status) && parts[i + 1] !== undefined) paths.push(parts[++i]);
  }
  return paths.filter(Boolean);
}

/**
 * Paths changed between `base` and HEAD, counting **both sides of a rename**.
 *
 * `git diff --name-only` prints only a rename's destination, so `git mv` from a
 * production directory into studio/ would have looked like a studio-only change
 * while deleting a production file. Found by review of iteration 00.
 */
export function committedPaths(root, base) {
  return nameStatusPaths(gitRaw(root, 'diff', '--name-status', '-M', '-z', `${base}...HEAD`));
}

/**
 * Every commit in `base..HEAD`, newest first, as `{ sha, parentCount, subject, paths }`.
 * `paths` is what the commit changes against its first parent (both sides of a
 * rename), so a merge carries everything it brings in.
 */
export function commitsWithPaths(root, base) {
  const log = git(root, 'log', '--format=%H%x1f%P%x1f%s', `${base}..HEAD`);
  if (!log) return [];
  return log.split('\n').map(line => {
    const [sha, parents, subject] = line.split('\x1f');
    const parentList = parents.trim() ? parents.trim().split(/\s+/) : [];
    const out = parentList.length
      ? gitRaw(root, 'diff', '--name-status', '-M', '-z', parentList[0], sha)
      : gitRaw(root, 'diff-tree', '--root', '-r', '--no-commit-id', '--name-status', '-M', '-z', sha);
    return { sha, parentCount: parentList.length, subject, paths: nameStatusPaths(out) };
  });
}

function nameStatusPaths(out) {
  const parts = out.split('\0').filter(Boolean);
  const paths = [];
  for (let i = 0; i < parts.length; ) {
    const status = parts[i++];
    if (/^[RC]/.test(status)) { paths.push(parts[i++], parts[i++]); }
    else { paths.push(parts[i++]); }
  }
  return paths.filter(Boolean);
}

/** Recursively list files under `dir` (absolute paths), skipping node_modules and .git. */
export async function walk(dir, out = []) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.DS_Store') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full, out);
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

export async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

export async function readIfPresent(p) {
  try { return await fs.readFile(p, 'utf8'); } catch { return null; }
}

/** GET a URL, following redirects. Returns { status, body } or { error }. */
export async function fetchUrl(url, timeoutMs = 15000) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ac.signal, redirect: 'follow' });
    return { status: res.status, body: await res.text() };
  } catch (err) {
    return { error: err.name === 'AbortError' ? `timed out after ${timeoutMs}ms` : String(err.message || err) };
  } finally {
    clearTimeout(timer);
  }
}
