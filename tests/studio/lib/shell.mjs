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
  return execFileSync(gitPath(), args, { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
}

/** Paths git reports as changed in the working tree, staged or not. */
export function workingTreePaths(root) {
  return gitRaw(root, 'status', '--porcelain=v1', '--untracked-files=all')
    .split('\n')
    .map(line => line.match(/^(..) (.*)$/))
    .filter(Boolean)
    .map(([, , rest]) => (rest.includes(' -> ') ? rest.split(' -> ')[1] : rest))
    .map(p => p.replace(/^"|"$/g, ''))
    .filter(Boolean);
}

/** Does this ref exist? */
export function refExists(root, ref) {
  return attempt(gitPath(), ['rev-parse', '--verify', '--quiet', ref + '^{commit}'], { cwd: root }).ok;
}

/** The most recent studio iteration tag, or null. */
export function latestIterationTag(root) {
  const out = attempt(gitPath(), ['tag', '--list', 'studio-iteration-*', '--sort=-v:refname'], { cwd: root });
  const first = out.out.split('\n').map(s => s.trim()).filter(Boolean)[0];
  return first || null;
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
