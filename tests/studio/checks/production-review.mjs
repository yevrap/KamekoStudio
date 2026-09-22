// production-review.mjs — a production fix is reviewed before it is pushed.
//
// Under trunk-based work a finished ticket goes to `main` straight away, and so to
// the live site. For studio work that is the trial (ADR-0007). For a production fix
// it put a change players see live before any independent review had seen it —
// which is what happened to the studio's first one. So a production fix is the one
// exception: it is pushed only once a review of exactly what is being pushed is
// recorded. See ADR-0008 for what this proves and what it cannot.
//
// **Decided from content, not from history.** The first version asked whether
// every commit that changed a fix's files was an ancestor of the reviewed commit,
// and looked only at files that still differed from the release. Both were
// defeated in its own review: putting one of the fix's files back to the release
// after the review — deleting its regression tests — dropped that file from what
// was checked, and a merge taking a file from its side parent changed it with no
// commit to examine. Content has neither hole: every file the ticket owns must be,
// at HEAD, exactly what the reviewers saw.

import path from 'node:path';
import { attempt, gitPath, readIfPresent, previousIterationTag, refExists } from '../lib/shell.mjs';
import { PRODUCTION_FIXES, readReviewRecord } from '../lib/rules.mjs';

const isAncestor = (root, ancestor, descendant) =>
  attempt(gitPath(), ['merge-base', '--is-ancestor', ancestor, descendant], { cwd: root }).ok;

/** Files among `files` whose content differs between two revisions. */
function differing(root, from, to, files) {
  return files.filter(f => !attempt(gitPath(), ['diff', '--quiet', from, to, '--', f], { cwd: root }).ok);
}

export const productionFixReviewed = {
  id: 'production-fix-reviewed',
  stages: ['gate', 'push'],
  description: 'Every production fix differing from the previous release is, at HEAD, exactly what its review saw',
  async run(ctx) {
    // Measured from the previous release, not from --base: whether a fix needs a
    // review depends on what goes live, and a narrow --base could leave an
    // unreviewed, unpushed fix out of view.
    const release = ctx.previousTag ?? previousIterationTag(ctx.root) ?? ctx.base;
    if (!refExists(ctx.root, release)) {
      return { status: 'fail', detail: `"${release}" names no commit, so no fix could be compared with the release` };
    }
    const fixes = ctx.productionFixes ?? PRODUCTION_FIXES;
    const byTicket = new Map();
    for (const f of fixes) {
      if (f.iteration !== ctx.iteration) continue;
      byTicket.set(f.ticket, [...(byTicket.get(f.ticket) ?? []), f.path]);
    }

    const problems = [];
    const notes = [];
    for (const [ticket, files] of byTicket) {
      // Every file equal to the release: nothing of this fix goes live, or the
      // whole fix has been reverted. Either way there is nothing to review.
      if (!differing(ctx.root, release, 'HEAD', files).length) continue;
      const recordPath = path.join('docs/studio/iterations', ctx.iteration, 'reviews', `${ticket}.md`);
      const record = readReviewRecord(ticket, await readIfPresent(path.join(ctx.root, recordPath)));
      if (record.problem) { problems.push(`${recordPath}: ${record.problem}`); continue; }
      // The reviewed commit must be one this branch actually has.
      if (!isAncestor(ctx.root, record.sha, 'HEAD')) {
        problems.push(`${recordPath}: the reviewed commit ${record.sha.slice(0, 7)} is not in HEAD's history`);
        continue;
      }
      const changed = differing(ctx.root, record.sha, 'HEAD', files);
      if (changed.length) {
        problems.push(`${recordPath}: ${changed.join(', ')} changed since the review at ${record.sha.slice(0, 7)} — review it again`);
        continue;
      }
      notes.push(`${ticket}: ${files.length} file(s) at HEAD exactly as reviewed at ${record.sha.slice(0, 7)}`);
    }
    if (problems.length) return { status: 'fail', detail: problems.join('\n  ') };
    return { status: 'pass', detail: notes.length ? notes.join('\n  ') : `no production fix of iteration ${ctx.iteration} differs from ${release}` };
  }
};
