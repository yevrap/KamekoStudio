// commit-lint.mjs — the git history is part of the public record.

import { git, refExists } from '../lib/shell.mjs';
import { lintCommitSubject } from '../lib/rules.mjs';

export const commitLint = {
  id: 'commit-lint',
  stages: ['gate'],
  description: 'Every studio commit is conventional, scoped studio, and names a ticket',
  run(ctx) {
    if (!refExists(ctx.root, ctx.base)) {
      return { status: 'fail', detail: `base ref "${ctx.base}" does not exist, so no commits could be read; pass --base=<ref>` };
    }
    // %P is the parent list: more than one means git wrote this commit, not us.
    const log = git(ctx.root, 'log', '--format=%h%x1f%P%x1f%s', `${ctx.base}..HEAD`);
    if (!log) return { status: 'pass', detail: 'no commits in range' };

    const problems = [];
    let checked = 0;
    for (const line of log.split('\n')) {
      const [sha, parents, subject] = line.split('\x1f');
      const parentCount = parents.trim() ? parents.trim().split(/\s+/).length : 0;
      if (parentCount > 1) continue;
      checked++;
      const problem = lintCommitSubject(subject, { parentCount });
      if (problem) problems.push(`${sha} ${problem}\n      ${subject}`);
    }
    return problems.length
      ? { status: 'fail', detail: `${problems.length} of ${checked} commit(s):\n  ${problems.join('\n  ')}` }
      : { status: 'pass', detail: `${checked} non-merge commit(s) conventional` };
  }
};
