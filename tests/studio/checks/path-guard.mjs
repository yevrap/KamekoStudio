// path-guard.mjs — the studio may only write inside its own paths.
//
// Two checks share this file because they ask the same question of different
// ranges: `path-guard` asks it of the work in hand, `production-unchanged`
// asks it of what is about to be deployed against what was deployed last.

import path from 'node:path';
import { promises as fs } from 'node:fs';
import { git, gitRaw, attempt, gitPath, exists, commitsWithPaths, workingTreePaths, refExists, previousIterationTag, commitsSince } from '../lib/shell.mjs';
import { classifyPaths, PATH_EXCEPTIONS, WORKFLOW_EXCEPTION, PRODUCTION_FIXES, productionFixProblem, productionFixEntryProblems, ticketFileId, sortCommitsByKind } from '../lib/rules.mjs';

/**
 * The paths the guard judges, from the commits in `base..HEAD` sorted by kind
 * (SHS-055): what studio commits changed, plus — when `withTree` — everything
 * uncommitted, which the guard counts as studio work because it cannot tell.
 */
function studioChanges(root, base, { withTree }) {
  const sorted = sortCommitsByKind(commitsWithPaths(root, base));
  const paths = withTree ? [...new Set([...sorted.studioPaths, ...workingTreePaths(root)])] : sorted.studioPaths;
  const { studio, arcade, merge, exempt } = sorted.counts;
  const tally = `commits: ${studio} studio, ${arcade} arcade, ${merge} merge, ${exempt} exempt`;
  return { paths, problems: sorted.problems, notes: [tally, ...sorted.notes] };
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

/**
 * Every commit in `base..HEAD` that changed `file`, as `{ sha, subject, afterRelease }`.
 *
 * Merges are **not** excluded. Git's default history simplification already
 * leaves out a merge whose result matches one of its parents for this file — an
 * ordinary merge, whose change is in a commit below it — and keeps one that made
 * a change of its own. That second kind names no ticket, so the rule refuses it.
 * `--no-merges` used to drop both, and a change made inside a merge went through
 * with no subject checked at all.
 */
export function commitsTouching(root, base, file, releaseTag) {
  const log = git(root, 'log', '--format=%H%x1f%s', `${base}..HEAD`, '--', file);
  if (!log) return [];
  return log.split('\n').map(line => {
    const [sha, subject] = line.split('\x1f');
    const afterRelease = releaseTag
      ? !attempt(gitPath(), ['merge-base', '--is-ancestor', sha, releaseTag], { cwd: root }).ok
      : false;
    return { sha, subject, afterRelease };
  });
}

/** `+added −removed` for a file, from the base to the working tree. */
function lineCounts(root, base, file) {
  const r = attempt(gitPath(), ['diff', '--numstat', base, '--', file], { cwd: root });
  const [added, removed] = (r.out.split('\t') ?? []);
  return /^\d+$/.test(added ?? '') ? `+${added} −${removed}` : 'binary or unreadable';
}

async function evaluate(root, base, changes, { iteration, fixes = PRODUCTION_FIXES } = {}) {
  const entryProblems = productionFixEntryProblems(fixes);
  if (entryProblems.length) {
    return { status: 'fail', detail: `malformed production-fix entries:\n  ${entryProblems.join('\n  ')}` };
  }
  const { allowed, exceptions, workflow, fixes: fixed, violations } = classifyPaths(changes.paths, { iteration, fixes });
  violations.push(...changes.problems);
  const notes = [...changes.notes];

  // A production fix is admitted, and named, only for the ticket that owns it
  // (ADR-0008). Never silently: every admitted path is reported with its ticket.
  if (fixed.length) {
    const ticketIds = await ticketIdsIn(root, iteration);
    const releaseTag = refExists(root, `studio-iteration-${iteration}`) ? `studio-iteration-${iteration}` : null;
    const dirty = new Set(workingTreePaths(root));
    for (const p of fixed) {
      const commits = commitsTouching(root, base, p, releaseTag);
      const deleted = !(await exists(path.join(root, p)));
      const problem = productionFixProblem(p, { iteration, ticketIds, commits, deleted, fixes });
      if (problem) {
        violations.push(`${p} (not an admissible production fix: ${problem})`);
      } else {
        const tickets = [...new Set(fixes.filter(f => f.path === p && f.iteration === iteration).map(f => f.ticket))];
        const pending = dirty.has(p) ? (commits.length ? ' and uncommitted changes' : ', uncommitted') : '';
        notes.push(`production fix: ${p} — ${tickets.join(', ')}, ${commits.length} commit(s)${pending}, ${lineCounts(root, base, p)}`);
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

  // The studio's skills and conductor (ADR-0011 §6): whether each commit that
  // changed one named a ticket was decided in `sortCommitsByKind`; an uncommitted
  // change is admitted and said to be uncommitted, since its subject is unwritten.
  if (workflow.length) {
    const dirty = new Set(workingTreePaths(root));
    for (const p of workflow) {
      notes.push(`exception used: ${p} — ${WORKFLOW_EXCEPTION.reason}${dirty.has(p) ? ', uncommitted: commit it under its ticket' : ''}`);
    }
  }

  if (violations.length) {
    return { status: 'fail', detail: `outside the guard:\n  ${violations.join('\n  ')}` };
  }
  const summary = `${allowed.length} path(s) inside the guard`;
  return {
    status: 'pass',
    detail: notes.length ? `${summary}\n  ${notes.join('\n  ')}` : summary,
    admitted: exceptions.length + workflow.length + fixed.length
  };
}

export const pathGuard = {
  id: 'path-guard',
  stages: ['ticket', 'gate', 'push'],
  description: 'Every path a studio commit changed is inside the allowed list, a recorded exception, the studio\'s own skills and conductor in a ticketed commit, or a production fix its own ticket owns; nothing executive-only changed; no arcade commit changed a studio path',
  async run(ctx) {
    // A base that does not resolve is a failure, not a skip: an unverifiable
    // guard at the ticket stage is exactly where a stray write would slip out.
    if (!refExists(ctx.root, ctx.base)) {
      return { status: 'fail', detail: `base ref "${ctx.base}" does not exist, so nothing could be compared; pass --base=<ref>` };
    }
    // Nothing committed since the base and nothing in the tree: there is nothing
    // to compare, and a pass would say "0 path(s)" about work it never saw.
    if (commitsSince(ctx.root, ctx.base) === 0 && workingTreePaths(ctx.root).length === 0) {
      return { status: 'skip', detail: `no commits since ${ctx.base} and nothing uncommitted, so nothing was compared` };
    }
    return evaluate(ctx.root, ctx.base, studioChanges(ctx.root, ctx.base, { withTree: true }), { iteration: ctx.iteration, fixes: ctx.productionFixes });
  }
};

export const productionUnchanged = {
  id: 'production-unchanged',
  stages: ['postdeploy'],
  description: 'No studio commit since the previous release changed a file outside the allowed paths, except the production fixes this iteration owns',
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
    const result = await evaluate(ctx.root, tag, studioChanges(ctx.root, tag, { withTree: false }), { iteration: ctx.iteration, fixes: ctx.productionFixes });
    return result.status === 'pass'
      ? {
          status: 'pass',
          // "Nothing outside the guard changed" is only true when nothing was
          // admitted; a fix or an exception is a change outside it, reported as one.
          detail: result.admitted
            ? `in ${commits} commit(s) since ${tag}, the only studio changes outside the guard are the ${result.admitted} admitted below — ${result.detail}`
            : `no studio commit changed anything outside the guard in ${commits} commit(s) since ${tag} (${result.detail})`
        }
      : { status: 'fail', detail: `since ${tag}: ${result.detail}` };
  }
};
