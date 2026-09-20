// commit-lint.mjs — the git history is part of the public record.

import { git, refExists } from '../lib/shell.mjs';
import { lintCommitSubject } from '../lib/rules.mjs';

export const commitLint = {
  id: 'commit-lint',
  stages: ['gate'],
  description: 'Every studio commit is conventional, scoped studio, and names a ticket',
  run(ctx) {
    if (!refExists(ctx.root, ctx.base)) {
      return { status: 'skip', detail: `base ref "${ctx.base}" does not exist; pass --base=<ref>` };
    }
    const log = git(ctx.root, 'log', '--format=%h%x1f%s', `${ctx.base}..HEAD`);
    if (!log) return { status: 'pass', detail: 'no commits in range' };

    const problems = [];
    let checked = 0;
    for (const line of log.split('\n')) {
      const [sha, subject] = line.split('\x1f');
      if (/^Merge /.test(subject)) continue;
      checked++;
      const problem = lintCommitSubject(subject);
      if (problem) problems.push(`${sha} ${problem}\n      ${subject}`);
    }
    return problems.length
      ? { status: 'fail', detail: `${problems.length} of ${checked} commit(s):\n  ${problems.join('\n  ')}` }
      : { status: 'pass', detail: `${checked} commit(s) conventional` };
  }
};
