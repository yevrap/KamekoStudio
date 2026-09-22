// commit-lint.mjs — the git history is part of the public record.

import { git, refExists } from '../lib/shell.mjs';
import { lintCommit, commitKind } from '../lib/rules.mjs';

export const commitLint = {
  id: 'commit-lint',
  stages: ['gate', 'push'],
  description: 'Every studio commit is conventional, scoped studio, and names a ticket; arcade commits are not the studio\'s to lint',
  run(ctx) {
    if (!refExists(ctx.root, ctx.base)) {
      return { status: 'fail', detail: `base ref "${ctx.base}" does not exist, so no commits could be read; pass --base=<ref>` };
    }
    // %H is the full hash, which is what a waiver is keyed by; %P is the parent
    // list: more than one means git wrote this commit, not us.
    const log = git(ctx.root, 'log', '--format=%H%x1f%P%x1f%s', `${ctx.base}..HEAD`);
    // An empty range proves nothing about the history; it is not a pass.
    if (!log) return { status: 'skip', detail: `no commits since ${ctx.base}, so nothing was linted` };

    const problems = [];
    const waived = [];
    const exempt = [];
    let checked = 0;
    let arcade = 0;
    for (const line of log.split('\n')) {
      const [sha, parents, subject] = line.split('\x1f');
      const parentCount = parents.trim() ? parents.trim().split(/\s+/).length : 0;
      // Which side of the shared main this commit is on is decided in one place
      // (SHS-055). An arcade commit that changes a studio path is path-guard's
      // violation, not a lint pass.
      const { kind, reason } = commitKind({ sha, parentCount, subject });
      if (kind === 'merge') continue;
      if (kind === 'arcade') { arcade++; continue; }
      if (kind === 'exempt') { exempt.push(`${sha.slice(0, 7)} exempt — ${reason}`); continue; }
      checked++;
      const result = lintCommit({ sha, parentCount, subject });
      if (result.status === 'fail') problems.push(`${sha.slice(0, 7)} ${result.problem}\n      ${subject}`);
      if (result.status === 'waived') waived.push(`${sha.slice(0, 7)} waived — ${result.reason}`);
    }
    const recorded = [...waived, ...exempt];
    const recordedNote = recorded.length ? `\n  ${recorded.join('\n  ')}` : '';
    const arcadeNote = arcade ? `; ${arcade} arcade commit(s) not linted` : '';
    if (problems.length) {
      return { status: 'fail', detail: `${problems.length} of ${checked} studio commit(s):\n  ${problems.join('\n  ')}${recordedNote}` };
    }
    // No studio commit in the range: the lint read subjects but judged none.
    if (!checked) {
      return { status: 'skip', detail: `no studio commits since ${ctx.base}, so nothing was linted${arcadeNote}${recordedNote}` };
    }
    return {
      status: 'pass',
      detail: `${checked} studio commit(s) conventional${arcadeNote}${waived.length ? `, ${waived.length} waived by hash` : ''}${exempt.length ? `, ${exempt.length} exempt by hash` : ''}${recordedNote}`
    };
  }
};
