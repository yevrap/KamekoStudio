// The production-fix rule (ADR-0008): the studio may change a production file
// only as a fix its own ticket owns, in its own iteration.
//
// The first half tests the pure rule; the second runs the real check against a
// scratch repository, because the rule's evidence — which commits touched the
// file, and which ticket each names — lives in git.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRODUCTION_FIXES, classifyPaths, productionFixProblem, productionFixEntryProblems, readReviewRecord
} from './lib/rules.mjs';
import { pathGuard, productionUnchanged } from './checks/path-guard.mjs';
import { productionFixReviewed } from './checks/production-review.mjs';
import { scratchRepo } from './lib/scratch-repo.mjs';

const FIX = { path: 'games/g/ui.js', ticket: 'SHS-052', iteration: '04' };
const OK_COMMIT = { sha: 'a'.repeat(40), subject: 'fix(studio): SHS-052 drop orphaned particles' };

test('the entries recorded in the repository are well-formed', () => {
  assert.deepEqual(productionFixEntryProblems(PRODUCTION_FIXES), []);
});

test('a malformed entry is reported, not silently never matched', () => {
  const bad = [
    { path: '/games/g/ui.js', ticket: 'SHS-052', iteration: '04' },
    { path: 'studio/x.js', ticket: 'SHS-052', iteration: '04' },
    { path: 'games/g/ui.js', ticket: 'SHS-52', iteration: '04' },
    { path: 'games/g/ui.js', ticket: 'SS-052', iteration: '04' },
    { path: 'games/g/ui.js', ticket: 'SHS-052', iteration: '4' },
    { path: 'games/../ui.js', ticket: 'SHS-052', iteration: '04' }
  ];
  assert.equal(productionFixEntryProblems(bad).length, 6);
});

test('a fix is admitted when the entry, the ticket file and every commit agree', () => {
  assert.equal(productionFixProblem(FIX.path, {
    iteration: '04', ticketIds: ['SHS-051', 'SHS-052'], commits: [OK_COMMIT], fixes: [FIX]
  }), null);
});

test('an uncommitted change to a listed file is admitted at the ticket stage', () => {
  assert.equal(productionFixProblem(FIX.path, { iteration: '04', ticketIds: ['SHS-052'], commits: [], fixes: [FIX] }), null);
});

test('each way a fix can be inadmissible fails on its own', () => {
  const base = { iteration: '04', ticketIds: ['SHS-052'], commits: [OK_COMMIT], fixes: [FIX] };
  const cases = {
    'no entry at all': { ...base, fixes: [] },
    'an entry for another iteration': { ...base, iteration: '05' },
    'no ticket file in the iteration': { ...base, ticketIds: ['SHS-051'] },
    'a commit naming another ticket': { ...base, commits: [OK_COMMIT, { sha: 'b'.repeat(40), subject: 'fix(studio): SHS-051 unrelated' }] },
    'a commit naming no ticket': { ...base, commits: [{ sha: 'c'.repeat(40), subject: 'tweak the game' }] }
  };
  for (const [name, opts] of Object.entries(cases)) {
    const problem = productionFixProblem(FIX.path, opts);
    assert.ok(problem, `${name}: admitted, and should not be`);
  }
  assert.match(productionFixProblem(FIX.path, cases['an entry for another iteration']), /SHS-052 in iteration 04, not iteration 05/);
  assert.match(productionFixProblem(FIX.path, cases['a commit naming another ticket']), /names SHS-051; only SHS-052 may/);
});

test('a fix entry for this iteration takes precedence over a narrow exception on the same file', () => {
  const onException = { path: 'shared/3d/gameplay.js', ticket: 'SHS-060', iteration: '05' };
  const now = classifyPaths(['shared/3d/gameplay.js'], { iteration: '05', fixes: [onException] });
  assert.deepEqual(now.fixes, ['shared/3d/gameplay.js']);
  // In any other iteration the exception governs the file again, as before.
  const later = classifyPaths(['shared/3d/gameplay.js'], { iteration: '06', fixes: [onException] });
  assert.deepEqual(later.exceptions, ['shared/3d/gameplay.js']);
});

test('a production path with no entry is still a violation', () => {
  const r = classifyPaths(['games/other/main.js', 'studio/index.html'], { iteration: '04', fixes: [FIX] });
  assert.deepEqual(r.violations, ['games/other/main.js']);
  assert.deepEqual(r.allowed, ['studio/index.html']);
});

/** A repository at iteration 04 with a ticket file for SHS-052, tagged at iteration 03. */
function iterationRepo(t) {
  const r = scratchRepo();
  t.after(r.done);
  r.commit('docs(studio): SHS-049 before the release');
  r.git('tag', 'studio-iteration-03');
  r.commit('docs(studio): SHS-053 plan', ['docs/studio/iterations/04/tickets/SHS-052-fix.md']);
  return r;
}

test('the check admits a fix and names it with its ticket', async t => {
  const r = iterationRepo(t);
  r.commit('fix(studio): SHS-052 the fix', [FIX.path]);
  const ctx = { root: r.root, base: 'studio-iteration-03', iteration: '04', productionFixes: [FIX] };
  const guard = await pathGuard.run(ctx);
  assert.equal(guard.status, 'pass', guard.detail);
  assert.match(guard.detail, /production fix: games\/g\/ui\.js — SHS-052, 1 commit\(s\)/);
  const deployed = await productionUnchanged.run({ ...ctx, previousTag: 'studio-iteration-03' });
  assert.equal(deployed.status, 'pass', deployed.detail);
  assert.match(deployed.detail, /production fix: games\/g\/ui\.js/);
});

test('the check refuses a listed file that another ticket also changed', async t => {
  const r = iterationRepo(t);
  r.commit('fix(studio): SHS-052 the fix', [FIX.path]);
  r.commit('fix(studio): SHS-051 riding along', [FIX.path]);
  const guard = await pathGuard.run({ root: r.root, base: 'studio-iteration-03', iteration: '04', productionFixes: [FIX] });
  assert.equal(guard.status, 'fail');
  assert.match(guard.detail, /names SHS-051/);
});

test('the check refuses a fix whose ticket has no file in the iteration', async t => {
  const r = iterationRepo(t);
  const orphan = { ...FIX, ticket: 'SHS-054' };
  r.commit('fix(studio): SHS-054 no ticket file', [FIX.path]);
  const guard = await pathGuard.run({ root: r.root, base: 'studio-iteration-03', iteration: '04', productionFixes: [orphan] });
  assert.equal(guard.status, 'fail');
  assert.match(guard.detail, /SHS-054 has no ticket file/);
});

test('the check still refuses a production file no entry covers, next to an admitted fix', async t => {
  const r = iterationRepo(t);
  r.commit('fix(studio): SHS-052 the fix', [FIX.path, 'games/g/other.js']);
  const guard = await pathGuard.run({ root: r.root, base: 'studio-iteration-03', iteration: '04', productionFixes: [FIX] });
  assert.equal(guard.status, 'fail');
  assert.match(guard.detail, /games\/g\/other\.js/);
  assert.doesNotMatch(guard.detail, /games\/g\/ui\.js \(/);
});

test('after a deploy, an admitted fix is reported as a change outside the guard, not as "nothing changed"', async t => {
  const r = iterationRepo(t);
  r.commit('fix(studio): SHS-052 the fix', [FIX.path]);
  const deployed = await productionUnchanged.run({ root: r.root, iteration: '04', productionFixes: [FIX], previousTag: 'studio-iteration-03' });
  assert.equal(deployed.status, 'pass', deployed.detail);
  assert.doesNotMatch(deployed.detail, /nothing outside the guard changed/);
  assert.match(deployed.detail, /the only changes outside the guard are the 1 admitted below/);
});

test('a change made inside a merge commit is refused: the merge names no ticket', async t => {
  const r = iterationRepo(t);
  r.commit('fix(studio): SHS-052 the fix', [FIX.path]);
  r.git('checkout', '--quiet', '-b', 'side');
  r.commit('docs(studio): SHS-053 on a side branch', ['docs/studio/side.md']);
  r.git('checkout', '--quiet', 'main');
  r.commit('docs(studio): SHS-053 on main', ['docs/studio/main.md']);
  r.git('merge', '--quiet', '--no-ff', '--no-commit', 'side');
  r.write(FIX.path, 'changed inside the merge');
  r.git('add', '--all');
  r.git('commit', '--quiet', '-m', 'Merge side');
  const ctx = { root: r.root, base: 'studio-iteration-03', iteration: '04', productionFixes: [FIX] };
  const guard = await pathGuard.run(ctx);
  assert.equal(guard.status, 'fail', guard.detail);
  assert.match(guard.detail, /names no ticket/);
  const deployed = await productionUnchanged.run({ ...ctx, previousTag: 'studio-iteration-03' });
  assert.equal(deployed.status, 'fail', deployed.detail);
});

test('an ordinary merge bringing in a ticket\'s fix is admitted: the change is in the commit that names it', async t => {
  const r = iterationRepo(t);
  r.git('checkout', '--quiet', '-b', 'fix');
  r.commit('fix(studio): SHS-052 the fix on a branch', [FIX.path]);
  r.git('checkout', '--quiet', 'main');
  r.commit('docs(studio): SHS-053 meanwhile', ['docs/studio/main.md']);
  r.git('merge', '--quiet', '--no-ff', '-m', 'Merge fix', 'fix');
  const guard = await pathGuard.run({ root: r.root, base: 'studio-iteration-03', iteration: '04', productionFixes: [FIX] });
  assert.equal(guard.status, 'pass', guard.detail);
  assert.match(guard.detail, /SHS-052, 1 commit\(s\)/);
});

test('once the iteration is tagged, a later change to its fix is refused', async t => {
  const r = iterationRepo(t);
  r.commit('fix(studio): SHS-052 the fix', [FIX.path]);
  r.git('tag', 'studio-iteration-04');
  const atRelease = await productionUnchanged.run({ root: r.root, iteration: '04', productionFixes: [FIX], previousTag: 'studio-iteration-03' });
  assert.equal(atRelease.status, 'pass', `the release itself is admitted: ${atRelease.detail}`);
  r.commit('fix(studio): SHS-052 one more tweak after the tag', [FIX.path]);
  const guard = await pathGuard.run({ root: r.root, base: 'studio-iteration-03', iteration: '04', productionFixes: [FIX] });
  assert.equal(guard.status, 'fail', guard.detail);
  assert.match(guard.detail, /after studio-iteration-04 was tagged/);
});

test('deleting a production file is refused even with an entry for it', async t => {
  const r = iterationRepo(t);
  r.commit('fix(studio): SHS-052 add', [FIX.path]);
  r.git('tag', '-f', 'studio-iteration-03');
  r.git('rm', '--quiet', FIX.path);
  r.git('commit', '--quiet', '-m', 'fix(studio): SHS-052 remove it');
  const guard = await pathGuard.run({ root: r.root, base: 'studio-iteration-03', iteration: '04', productionFixes: [FIX] });
  assert.equal(guard.status, 'fail', guard.detail);
  assert.match(guard.detail, /deleted/);
});

test('a malformed entry fails the check itself, not only the pure rule', async t => {
  const r = iterationRepo(t);
  r.commit('fix(studio): SHS-052 the fix', [FIX.path]);
  const guard = await pathGuard.run({ root: r.root, base: 'studio-iteration-03', iteration: '04', productionFixes: [{ ...FIX, iteration: '4' }] });
  assert.equal(guard.status, 'fail', guard.detail);
  assert.match(guard.detail, /malformed production-fix entries/);
});

test('an admitted fix is reported with its line counts, and with any uncommitted changes', async t => {
  const r = iterationRepo(t);
  r.commit('fix(studio): SHS-052 the fix', [FIX.path]);
  r.write(FIX.path, 'more\nlines\n');
  const guard = await pathGuard.run({ root: r.root, base: 'studio-iteration-03', iteration: '04', productionFixes: [FIX] });
  assert.equal(guard.status, 'pass', guard.detail);
  assert.match(guard.detail, /SHS-052, 1 commit\(s\) and uncommitted changes, \+2 −0/);
});

// ── SHS-054: a production fix is reviewed before it is pushed ────────────────

const record = (ticket, sha, verdict = 'APPROVED') =>
  `# ${ticket} — pre-push review\n\n- **Reviewed:** ${sha}\n- **Verdict:** ${verdict}\n`;

test('a review record is read strictly: one hash, one approving verdict, the right ticket', () => {
  const sha = 'a'.repeat(40);
  assert.deepEqual(readReviewRecord('SHS-052', record('SHS-052', sha)), { sha });
  assert.deepEqual(readReviewRecord('SHS-052', record('SHS-052', sha, 'APPROVED WITH FINDINGS')), { sha });
  const problem = text => readReviewRecord('SHS-052', text).problem;
  assert.match(problem(null), /no pre-push review record/);
  assert.match(problem(record('SHS-051', sha)), /should begin/);
  assert.match(problem(record('SHS-052', 'abc1234')), /full 40-character/);
  assert.match(problem(record('SHS-052', sha) + `- **Reviewed:** ${'b'.repeat(40)}\n`), /2 times/);
  assert.match(problem(record('SHS-052', sha, 'REJECTED')), /not an approval/);
  assert.match(problem(record('SHS-052', sha, 'APPROVEDISH')), /not an approval/);
  assert.match(problem(record('SHS-052', sha) + '<!-- - **Verdict:** REJECTED -->\n'), /2 times/);
});

const FIX2 = { path: 'games/g/harness.mjs', ticket: 'SHS-052', iteration: '04' };
const RECORD = 'docs/studio/iterations/04/reviews/SHS-052.md';

/** A release holding both of a two-file fix's files, then the ticket's file. */
function releasedRepo(t) {
  const r = scratchRepo();
  t.after(r.done);
  r.commit('docs(studio): SHS-049 the release', [FIX.path, FIX2.path]);
  r.git('tag', 'studio-iteration-03');
  r.commit('docs(studio): SHS-053 plan', ['docs/studio/iterations/04/tickets/SHS-052-fix.md']);
  return r;
}
const reviewAt = (r, sha, subject = 'docs(studio): SHS-054 the review') => {
  r.write(RECORD, record('SHS-052', sha));
  r.git('add', '--all'); r.git('commit', '--quiet', '-m', subject);
};
const ctxFor = (r, fixes = [FIX, FIX2]) => ({ root: r.root, base: 'studio-iteration-03', iteration: '04', productionFixes: fixes });

test('the push is refused until a review of exactly what is pushed is recorded', async t => {
  const r = releasedRepo(t);
  const fixSha = r.commit('fix(studio): SHS-052 the fix', [FIX.path, FIX2.path]);

  const none = await productionFixReviewed.run(ctxFor(r));
  assert.equal(none.status, 'fail', none.detail);
  assert.match(none.detail, /no pre-push review record/);

  reviewAt(r, r.git('rev-parse', 'studio-iteration-03'), 'docs(studio): SHS-054 a stale review');
  const stale = await productionFixReviewed.run(ctxFor(r));
  assert.equal(stale.status, 'fail', stale.detail);
  assert.match(stale.detail, /changed since the review/);

  reviewAt(r, fixSha);
  const covered = await productionFixReviewed.run(ctxFor(r));
  assert.equal(covered.status, 'pass', covered.detail);
  assert.match(covered.detail, /SHS-052: 2 file\(s\) at HEAD exactly as reviewed/);

  r.commit('fix(studio): SHS-052 a later change', [FIX.path]);
  const changed = await productionFixReviewed.run(ctxFor(r));
  assert.equal(changed.status, 'fail', changed.detail);
  assert.match(changed.detail, /games\/g\/ui\.js changed since the review/);
});

test('putting one of the fix\'s files back to the release after its review is refused', async t => {
  // Review round 2's reproduction: the regression tests deleted after approval.
  const r = releasedRepo(t);
  const fixSha = r.commit('fix(studio): SHS-052 the fix', [FIX.path, FIX2.path]);
  reviewAt(r, fixSha);
  r.write(FIX2.path, r.git('show', `studio-iteration-03:${FIX2.path}`));
  r.git('add', '--all'); r.git('commit', '--quiet', '-m', 'docs(studio): SHS-053 tidy the stand-up');
  const result = await productionFixReviewed.run(ctxFor(r));
  assert.equal(result.status, 'fail', result.detail);
  assert.match(result.detail, /games\/g\/harness\.mjs changed since the review/);
});

test('a merge that takes a fix file from its side parent after the review is refused', async t => {
  // Review round 2's reproduction: a merge git's history simplification hides.
  const r = releasedRepo(t);
  r.git('checkout', '--quiet', '-b', 'side', 'studio-iteration-03');
  r.commit('docs(studio): SHS-053 on the side', ['docs/studio/side.md']);
  r.git('checkout', '--quiet', 'main');
  const fixSha = r.commit('fix(studio): SHS-052 the fix', [FIX.path, FIX2.path]);
  reviewAt(r, fixSha);
  r.git('merge', '--quiet', '--no-ff', '--no-commit', 'side');
  r.git('checkout', 'side', '--', FIX2.path);
  r.git('commit', '--quiet', '-m', "Merge branch 'side'");
  assert.equal(r.git('log', '--format=%h', 'studio-iteration-03..HEAD', '--', FIX2.path), '',
    'precondition: history simplification follows the side parent and shows no commit at all for this file');
  const result = await productionFixReviewed.run(ctxFor(r));
  assert.equal(result.status, 'fail', result.detail);
  assert.match(result.detail, /harness\.mjs changed since the review/);
});

test('a narrow --base does not hide an unreviewed fix: the review is measured from the release', async t => {
  const r = releasedRepo(t);
  r.commit('fix(studio): SHS-052 the fix', [FIX.path]);
  r.commit('docs(studio): SHS-053 a stand-up');
  const result = await productionFixReviewed.run({ ...ctxFor(r), base: 'HEAD~1' });
  assert.equal(result.status, 'fail', result.detail);
  assert.match(result.detail, /no pre-push review record/);
});

test('reverting the whole fix to the release needs no review', async t => {
  const r = releasedRepo(t);
  r.commit('fix(studio): SHS-052 the fix', [FIX.path, FIX2.path]);
  r.git('revert', '--no-edit', 'HEAD');
  const result = await productionFixReviewed.run(ctxFor(r));
  assert.equal(result.status, 'pass', result.detail);
  assert.match(result.detail, /no production fix of iteration 04 differs/);
});

test('a review naming a commit this branch does not have is refused, even one with the same content', async t => {
  const r = releasedRepo(t);
  r.commit('fix(studio): SHS-052 the fix', [FIX.path]);
  reviewAt(r, 'f'.repeat(40), 'docs(studio): SHS-054 a review of nothing');
  assert.equal((await productionFixReviewed.run(ctxFor(r))).status, 'fail');
  // A real commit on another branch whose files are identical — reviewed there,
  // never brought here. Same content alone would accept it.
  r.git('checkout', '--quiet', '-b', 'elsewhere');
  const elsewhere = r.commit('docs(studio): SHS-053 elsewhere', ['docs/studio/elsewhere.md']);
  r.git('checkout', '--quiet', 'main');
  reviewAt(r, elsewhere, 'docs(studio): SHS-054 a review of another branch');
  const result = await productionFixReviewed.run(ctxFor(r));
  assert.equal(result.status, 'fail', result.detail);
  assert.match(result.detail, /not in HEAD's history/);
});

test('with no production fix differing from the release, there is nothing to review', async t => {
  const r = releasedRepo(t);
  r.commit('docs(studio): SHS-053 docs only');
  const result = await productionFixReviewed.run(ctxFor(r));
  assert.equal(result.status, 'pass', result.detail);
});
