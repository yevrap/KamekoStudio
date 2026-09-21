// production-review.mjs — a production fix is reviewed before it is pushed.
//
// Under trunk-based work a finished ticket goes to `main` straight away, and so to
// the live site. For studio work that is the trial (ADR-0007). For a production fix
// it put a change players see live before any independent review had seen it —
// which is what happened to the studio's first one. So a production fix is the one
// exception: it is pushed only once a review covering its latest commit is recorded.
// See ADR-0008 for what this proves and what it cannot.

import path from 'node:path';
import { attempt, gitPath, committedPaths, readIfPresent } from '../lib/shell.mjs';
import { PRODUCTION_FIXES, productionReviewProblem } from '../lib/rules.mjs';
import { commitsTouching } from './path-guard.mjs';

const contains = root => (ancestor, descendant) =>
  attempt(gitPath(), ['merge-base', '--is-ancestor', ancestor, descendant], { cwd: root }).ok;

export const productionFixReviewed = {
  id: 'production-fix-reviewed',
  stages: ['gate', 'push'],
  description: 'Every production fix in range was reviewed at a commit that contains all of its changes',
  async run(ctx) {
    const fixes = ctx.productionFixes ?? PRODUCTION_FIXES;
    const changed = new Set(committedPaths(ctx.root, ctx.base));
    const byTicket = new Map();
    for (const f of fixes) {
      if (f.iteration !== ctx.iteration || !changed.has(f.path)) continue;
      byTicket.set(f.ticket, [...(byTicket.get(f.ticket) ?? []), f.path]);
    }
    if (!byTicket.size) return { status: 'pass', detail: `no production fix of iteration ${ctx.iteration} changed since ${ctx.base}` };

    const problems = [];
    const notes = [];
    for (const [ticket, files] of byTicket) {
      const commits = [...new Set(files.flatMap(f => commitsTouching(ctx.root, ctx.base, f).map(c => c.sha)))];
      const record = path.join('docs/studio/iterations', ctx.iteration, 'reviews', `${ticket}.md`);
      const text = await readIfPresent(path.join(ctx.root, record));
      const problem = productionReviewProblem(ticket, { text, commits, contains: contains(ctx.root) });
      // The reviewed commit must be one this branch actually has, or "contains"
      // would be decided about a commit from somewhere else.
      const sha = /^- \*\*Reviewed:\*\* `?([0-9a-f]{40})`?\s*$/m.exec(text ?? '')?.[1];
      if (problem) problems.push(`${record}: ${problem}`);
      else if (!contains(ctx.root)(sha, 'HEAD')) problems.push(`${record}: the reviewed commit ${sha.slice(0, 7)} is not in HEAD's history`);
      else notes.push(`${ticket}: reviewed at ${sha.slice(0, 7)}, covering ${commits.length} commit(s) to ${files.length} file(s)`);
    }
    return problems.length
      ? { status: 'fail', detail: problems.join('\n  ') }
      : { status: 'pass', detail: notes.join('\n  ') };
  }
};
