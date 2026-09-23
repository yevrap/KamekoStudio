// The path guard's reader, exercised against real git output rather than
// through a pure function.
//
// The exception mechanism compares a file's content at the base revision with
// its content now, byte for byte. It was fed by a helper that trims, so every
// file arrived without its final newline and the comparison could never hold —
// the guard rejected the very edit it was written to allow. The pure rule was
// never wrong, so a test of the pure rule would not have caught it. This one
// reads the repository.

import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { textAt, pathGuard, productionUnchanged } from './checks/path-guard.mjs';
import { commitLint } from './checks/commit-lint.mjs';
import { scratchRepo } from './lib/scratch-repo.mjs';
import { refExists } from './lib/shell.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BASE = 'studio-iteration-00';

test('the base revision is read whole, trailing newline included', { skip: !refExists(ROOT, BASE) && 'no base tag in this clone' }, () => {
  const text = textAt(ROOT, BASE, 'package.json');
  assert.ok(text.length > 0, 'package.json came back empty at the base revision');
  assert.ok(text.endsWith('\n'), 'the file lost its final newline on the way out of git');
  assert.equal(JSON.parse(text).name, 'kameko-studio');
});

test('a file unchanged since the base revision compares equal to the file on disk', () => {
  // This is the comparison every content-checked exception performs. If it
  // cannot hold for an untouched file, no exception can ever pass.
  // A file no studio exception covers. It was constants.js until SHS-057 gave
  // that file an exception and changed it.
  const unchanged = 'shared/3d/state.js';
  assert.ok(existsSync(path.join(ROOT, unchanged)));
  assert.equal(textAt(ROOT, BASE, unchanged), readFileSync(path.join(ROOT, unchanged), 'utf8'));
});

test('a path absent at the base revision reads as empty, not as a throw', () => {
  assert.equal(textAt(ROOT, BASE, 'no/such/file/at/that/revision.js'), '');
});

// --- Studio commits and arcade commits on one main (SHS-055) -------------------
//
// The arcade and the studio share `main`, so the range since a studio tag holds
// both. Each verdict below is read from a real repository, merges included.

/** A repository tagged `studio-iteration-04`, and the context every check needs. */
function sharedMain(t) {
  const r = scratchRepo();
  t.after(r.done);
  r.commit('docs(studio): SHS-053 the release');
  r.git('tag', 'studio-iteration-04');
  const ctx = { root: r.root, base: 'studio-iteration-04', previousTag: 'studio-iteration-04', iteration: '05', productionFixes: [] };
  return { r, ctx };
}

test('an arcade commit outside the studio paths is not a studio violation', async t => {
  const { r, ctx } = sharedMain(t);
  r.commit('docs(studio): SHS-055 studio work', ['studio/a.js', 'docs/studio/b.md']);
  r.commit('chore: the arcade moves its skills', ['.claude/settings.json', 'CLAUDE.md', 'games/g/main.js']);
  const guard = await pathGuard.run(ctx);
  assert.equal(guard.status, 'pass', guard.detail);
  assert.match(guard.detail, /2 path\(s\) inside the guard/);
  assert.match(guard.detail, /commits: 1 studio, 1 arcade, 0 merge, 0 exempt/);
  const deployed = await productionUnchanged.run(ctx);
  assert.equal(deployed.status, 'pass', deployed.detail);
  const lint = commitLint.run(ctx);
  assert.equal(lint.status, 'pass', lint.detail);
  assert.match(lint.detail, /1 studio commit\(s\) conventional; 1 arcade commit\(s\) not linted/);
});

test('a studio commit outside the studio paths is still a violation', async t => {
  const { r, ctx } = sharedMain(t);
  r.commit('feat(studio): SHS-055 reaches into the arcade', ['games/g/main.js']);
  const guard = await pathGuard.run(ctx);
  assert.equal(guard.status, 'fail');
  assert.match(guard.detail, /games\/g\/main\.js/);
  assert.equal((await productionUnchanged.run(ctx)).status, 'fail');
});

test('an arcade commit that changes a studio path is a violation', async t => {
  const { r, ctx } = sharedMain(t);
  const sha = r.commit('chore: just a tidy-up', ['studio/index.html', 'tests/studio/x.mjs']);
  const guard = await pathGuard.run(ctx);
  assert.equal(guard.status, 'fail');
  assert.match(guard.detail, new RegExp(`studio/index\\.html \\(changed by arcade commit ${sha.slice(0, 7)}`));
  assert.match(guard.detail, /tests\/studio\/x\.mjs \(changed by arcade commit/);
  const deployed = await productionUnchanged.run(ctx);
  assert.equal(deployed.status, 'fail');
  assert.match(deployed.detail, /changed by arcade commit/);
});

test('dropping the scope but naming the ticket does not get a production change past the guard', async t => {
  // Iteration 05 review, finding 1: a production-only change is judged only
  // when the commit is sorted as the studio's.
  const { r, ctx } = sharedMain(t);
  r.commit('fix: SHS-060 clamp the drawer width', ['shared/settings.js']);
  const guard = await pathGuard.run(ctx);
  assert.equal(guard.status, 'fail');
  assert.match(guard.detail, /shared\/settings\.js/);
  assert.equal(commitLint.run(ctx).status, 'fail');
});

test('a merge that brings in studio and arcade paths together is a violation', async t => {
  const { r, ctx } = sharedMain(t);
  r.git('checkout', '--quiet', '-b', 'side');
  r.commit('docs(studio): SHS-055 on a branch', ['studio/side.js']);
  r.commit('feat: p1-99 also on the branch', ['games/g/side.js']);
  r.git('checkout', '--quiet', 'main');
  r.commit('docs(studio): SHS-055 on main', ['studio/main.js']);
  r.git('merge', '--quiet', '--no-ff', '-m', 'Merge side', 'side');
  const guard = await pathGuard.run(ctx);
  assert.equal(guard.status, 'fail');
  assert.match(guard.detail, /merge .{7} changes studio paths and other paths together \(1 and 1\)/);
  // Each commit the merge brings in is judged on its own too, and both are clean.
  assert.doesNotMatch(guard.detail, /changed by arcade commit/);
});

test('a merge that brings in one kind only is that kind', async t => {
  const { r, ctx } = sharedMain(t);
  r.git('checkout', '--quiet', '-b', 'side');
  r.commit('feat: p1-99 arcade on a branch', ['games/g/side.js']);
  r.git('checkout', '--quiet', 'main');
  r.commit('docs(studio): SHS-055 on main', ['studio/main.js']);
  r.git('merge', '--quiet', '--no-ff', '-m', 'Merge side', 'side');
  const guard = await pathGuard.run(ctx);
  assert.equal(guard.status, 'pass', guard.detail);
  assert.match(guard.detail, /commits: 1 studio, 1 arcade, 1 merge, 0 exempt/);
});

test('commit-lint fails a new unnumbered (studio) commit and ignores arcade subjects', t => {
  const { r, ctx } = sharedMain(t);
  r.commit('feat: p1-22 an arcade subject the studio lint would reject', ['games/g/a.js']);
  const bad = r.commit('docs(studio): direction for epic E2', ['docs/studio/steering/direction.md']);
  const lint = commitLint.run(ctx);
  assert.equal(lint.status, 'fail');
  assert.match(lint.detail, new RegExp(`^1 of 1 studio commit\\(s\\):\\n  ${bad.slice(0, 7)} expected`));
  assert.doesNotMatch(lint.detail, /p1-22/);
});

test('commit-lint does not call a range with no studio commit a pass', t => {
  const { r, ctx } = sharedMain(t);
  r.commit('feat: p1-22 arcade only', ['games/g/a.js']);
  const lint = commitLint.run(ctx);
  assert.equal(lint.status, 'skip');
  assert.match(lint.detail, /no studio commits since studio-iteration-04, so nothing was linted; 1 arcade commit\(s\) not linted/);
});
