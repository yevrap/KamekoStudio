// path-guard.mjs — the studio may only write inside its own paths.
//
// Two checks share this file because they ask the same question of different
// ranges: `path-guard` asks it of the work in hand, `production-unchanged`
// asks it of what is about to be deployed against what was deployed last.

import { git, workingTreePaths, refExists, latestIterationTag } from '../lib/shell.mjs';
import { classifyPaths, PATH_EXCEPTIONS } from '../lib/rules.mjs';

function changedPaths(root, base) {
  const committed = git(root, 'diff', '--name-only', `${base}...HEAD`).split('\n');
  return [...new Set([...committed, ...workingTreePaths(root)].map(s => s.trim()).filter(Boolean))];
}

function evaluate(root, paths) {
  const { allowed, exceptions, violations } = classifyPaths(paths);
  const notes = [];

  for (const p of exceptions) {
    const rule = PATH_EXCEPTIONS.find(e => e.path === p);
    const diff = git(root, 'diff', 'HEAD', '--', p) || git(root, 'diff', '--', p);
    const problem = rule.allow(diff);
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
  run(ctx) {
    if (!refExists(ctx.root, ctx.base)) {
      return { status: 'skip', detail: `base ref "${ctx.base}" does not exist; pass --base=<ref>` };
    }
    return evaluate(ctx.root, changedPaths(ctx.root, ctx.base));
  }
};

export const productionUnchanged = {
  id: 'production-unchanged',
  stages: ['postdeploy'],
  description: "No file outside the allowed paths differs from the previous iteration's tag",
  run(ctx) {
    const tag = ctx.previousTag ?? latestIterationTag(ctx.root);
    if (!tag) {
      return { status: 'skip', detail: 'no previous studio-iteration tag to compare against (expected for iteration 00)' };
    }
    const paths = git(ctx.root, 'diff', '--name-only', `${tag}..HEAD`).split('\n').map(s => s.trim()).filter(Boolean);
    const result = evaluate(ctx.root, paths);
    return result.status === 'pass'
      ? { status: 'pass', detail: `nothing outside the guard changed since ${tag} (${result.detail})` }
      : { status: 'fail', detail: `since ${tag}: ${result.detail}` };
  }
};
