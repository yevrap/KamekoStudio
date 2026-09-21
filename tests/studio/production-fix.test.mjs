// The production-fix rule (ADR-0008): the studio may change a production file
// only as a fix its own ticket owns, in its own iteration.
//
// The first half tests the pure rule; the second runs the real check against a
// scratch repository, because the rule's evidence — which commits touched the
// file, and which ticket each names — lives in git.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRODUCTION_FIXES, classifyPaths, productionFixProblem, productionFixEntryProblems
} from './lib/rules.mjs';
import { pathGuard, productionUnchanged } from './checks/path-guard.mjs';
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
