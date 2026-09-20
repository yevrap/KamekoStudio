// path-guard.mjs — the studio may only write inside its own paths.
//
// Two checks share this file because they ask the same question of different
// ranges: `path-guard` asks it of the work in hand, `production-unchanged`
// asks it of what is about to be deployed against what was deployed last.

import path from 'node:path';
import { promises as fs } from 'node:fs';
import { gitRaw, committedPaths, workingTreePaths, refExists, latestIterationTag } from '../lib/shell.mjs';
import { classifyPaths, PATH_EXCEPTIONS } from '../lib/rules.mjs';

function changedPaths(root, base) {
  return [...new Set([...committedPaths(root, base), ...workingTreePaths(root)])];
}

/**
 * The file's text at `rev`, or '' when it did not exist there.
 *
 * Read raw, never through the trimming helper: an exception that compares a
 * file's content byte for byte is defeated by a stripped trailing newline, and
 * every source file has one. The package.json exception did not notice, because
 * it parses JSON before comparing; the first content-exact exception did, by
 * rejecting the very edit it was written to allow.
 */
export function textAt(root, rev, file) {
  try {
    return gitRaw(root, 'show', `${rev}:${file}`);
  } catch {
    return '';
  }
}

async function textNow(root, file) {
  try { return await fs.readFile(path.join(root, file), 'utf8'); } catch { return ''; }
}

async function evaluate(root, base, paths) {
  const { allowed, exceptions, violations } = classifyPaths(paths);
  const notes = [];

  for (const p of exceptions) {
    const rule = PATH_EXCEPTIONS.find(e => e.path === p);
    // Compare content at the base revision against content now, so the check
    // works the same whether the change is committed or still in the tree.
    const problem = rule.allow(textAt(root, base, p), await textNow(root, p));
    if (problem) violations.push(`${p} (exception exceeded: ${problem})`);
    else notes.push(`exception used: ${p} — ${rule.reason}`);
  }

  if (violations.length) {
    return { status: 'fail', detail: `outside the guard:\n  ${violations.join('\n  ')}` };
  }
  const summary = `${allowed.length} path(s) inside the guard`;
  return { status: 'pass', detail: notes.length ? `${summary}\n  ${notes.join('\n  ')}` : summary };
}

export const pathGuard = {
  id: 'path-guard',
  stages: ['ticket', 'gate'],
  description: 'Every changed path is inside the allowed list, or is a recorded exception',
  async run(ctx) {
    // A base that does not resolve is a failure, not a skip: an unverifiable
    // guard at the ticket stage is exactly where a stray write would slip out.
    if (!refExists(ctx.root, ctx.base)) {
      return { status: 'fail', detail: `base ref "${ctx.base}" does not exist, so nothing could be compared; pass --base=<ref>` };
    }
    return evaluate(ctx.root, ctx.base, changedPaths(ctx.root, ctx.base));
  }
};

export const productionUnchanged = {
  id: 'production-unchanged',
  stages: ['postdeploy'],
  description: "No file outside the allowed paths differs from the previous iteration's tag",
  async run(ctx) {
    const tag = ctx.previousTag ?? latestIterationTag(ctx.root);
    if (!tag) {
      return { status: 'skip', detail: 'no previous studio-iteration tag to compare against (expected for iteration 00)' };
    }
    const result = await evaluate(ctx.root, tag, committedPaths(ctx.root, tag));
    return result.status === 'pass'
      ? { status: 'pass', detail: `nothing outside the guard changed since ${tag} (${result.detail})` }
      : { status: 'fail', detail: `since ${tag}: ${result.detail}` };
  }
};
