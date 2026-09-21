// path-guard.mjs — the studio may only write inside its own paths.
//
// Two checks share this file because they ask the same question of different
// ranges: `path-guard` asks it of the work in hand, `production-unchanged`
// asks it of what is about to be deployed against what was deployed last.

import path from 'node:path';
import { promises as fs } from 'node:fs';
import { git, gitRaw, committedPaths, workingTreePaths, refExists, previousIterationTag, commitsSince } from '../lib/shell.mjs';
import { classifyPaths, PATH_EXCEPTIONS, PRODUCTION_FIXES, productionFixProblem, productionFixEntryProblems, ticketFileId } from '../lib/rules.mjs';

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

/** The ticket IDs the file names in one iteration's `tickets/` declare. */
async function ticketIdsIn(root, iteration) {
  try {
    const names = await fs.readdir(path.join(root, 'docs/studio/iterations', String(iteration), 'tickets'));
    return names.map(ticketFileId).filter(Boolean);
  } catch {
    return [];
  }
}

/** Every non-merge commit in `base..HEAD` that changed `file`, as `{ sha, subject }`. */
function commitsTouching(root, base, file) {
  const log = git(root, 'log', '--no-merges', '--format=%H%x1f%s', `${base}..HEAD`, '--', file);
  return log ? log.split('\n').map(line => { const [sha, subject] = line.split('\x1f'); return { sha, subject }; }) : [];
}

async function evaluate(root, base, paths, { iteration, fixes = PRODUCTION_FIXES } = {}) {
  const entryProblems = productionFixEntryProblems(fixes);
  if (entryProblems.length) {
    return { status: 'fail', detail: `malformed production-fix entries:\n  ${entryProblems.join('\n  ')}` };
  }
  const { allowed, exceptions, fixes: fixed, violations } = classifyPaths(paths, { iteration, fixes });
  const notes = [];

  // A production fix is admitted, and named, only for the ticket that owns it
  // (ADR-0008). Never silently: every admitted path is reported with its ticket.
  if (fixed.length) {
    const ticketIds = await ticketIdsIn(root, iteration);
    for (const p of fixed) {
      const commits = commitsTouching(root, base, p);
      const problem = productionFixProblem(p, { iteration, ticketIds, commits, fixes });
      if (problem) {
        violations.push(`${p} (not an admissible production fix: ${problem})`);
      } else {
        const tickets = [...new Set(fixes.filter(f => f.path === p && f.iteration === iteration).map(f => f.ticket))];
        notes.push(`production fix: ${p} — ${tickets.join(', ')}, ${commits.length} commit(s)${commits.length ? '' : ', uncommitted'}`);
      }
    }
  }

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
  stages: ['ticket', 'gate', 'push'],
  description: 'Every changed path is inside the allowed list, a recorded exception, or a production fix its own ticket owns',
  async run(ctx) {
    // A base that does not resolve is a failure, not a skip: an unverifiable
    // guard at the ticket stage is exactly where a stray write would slip out.
    if (!refExists(ctx.root, ctx.base)) {
      return { status: 'fail', detail: `base ref "${ctx.base}" does not exist, so nothing could be compared; pass --base=<ref>` };
    }
    return evaluate(ctx.root, ctx.base, changedPaths(ctx.root, ctx.base), { iteration: ctx.iteration, fixes: ctx.productionFixes });
  }
};

export const productionUnchanged = {
  id: 'production-unchanged',
  stages: ['postdeploy'],
  description: 'No file outside the allowed paths differs from the previous release, except the production fixes this iteration owns',
  async run(ctx) {
    const tag = ctx.previousTag ?? previousIterationTag(ctx.root);
    if (!tag) {
      return { status: 'skip', detail: 'no previous studio-iteration tag to compare against (expected for iteration 00)' };
    }
    if (!refExists(ctx.root, tag)) {
      return { status: 'fail', detail: `"${tag}" does not name a commit, so nothing could be compared` };
    }
    // A comparison that covers no commits proves nothing, and saying "pass"
    // about it is how TD-011 hid: the release compared with itself reported
    // "nothing outside the guard changed" with a zero nobody had to read.
    const commits = commitsSince(ctx.root, tag);
    if (commits === 0) {
      return { status: 'skip', detail: `${tag} is HEAD or ahead of it, so the comparison covers no commits — pass --previous-tag=<the release before this one>` };
    }
    const result = await evaluate(ctx.root, tag, committedPaths(ctx.root, tag), { iteration: ctx.iteration, fixes: ctx.productionFixes });
    return result.status === 'pass'
      ? { status: 'pass', detail: `nothing outside the guard changed in ${commits} commit(s) since ${tag} (${result.detail})` }
      : { status: 'fail', detail: `since ${tag}: ${result.detail}` };
  }
};
