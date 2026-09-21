// What "the previous release" means, against a real git repository.
//
// After an iteration's own tag was pushed, `production-unchanged` compared the
// release with itself and passed having proved nothing (TD-011). These tests
// build a throwaway repository and tag it the way an iteration does.

import test from 'node:test';
import assert from 'node:assert/strict';
import { previousIterationTag, commitsSince } from './lib/shell.mjs';
import { productionUnchanged } from './checks/path-guard.mjs';
import { scratchRepo as repo } from './lib/scratch-repo.mjs';

test('mid-iteration, the previous release is the newest tag', t => {
  const r = repo(); t.after(r.done);
  r.commit(); r.git('tag', 'studio-iteration-00');
  r.commit(); r.git('tag', 'studio-iteration-01');
  r.commit();
  assert.equal(previousIterationTag(r.root), 'studio-iteration-01');
  assert.equal(commitsSince(r.root, 'studio-iteration-01'), 1);
});

test('once the iteration is tagged, the previous release is the tag before it', t => {
  const r = repo(); t.after(r.done);
  r.commit(); r.git('tag', 'studio-iteration-00');
  r.commit(); r.commit(); r.git('tag', 'studio-iteration-01');
  assert.equal(previousIterationTag(r.root), 'studio-iteration-00');
  assert.equal(commitsSince(r.root, 'studio-iteration-00'), 2);
});

test('every tag on HEAD is skipped, not only the newest', t => {
  const r = repo(); t.after(r.done);
  r.commit(); r.git('tag', 'studio-iteration-00');
  r.commit(); r.git('tag', 'studio-iteration-01'); r.git('tag', 'studio-iteration-02');
  assert.equal(previousIterationTag(r.root), 'studio-iteration-00');
});

test('tag order is by version, so iteration 10 is newer than iteration 09', t => {
  const r = repo(); t.after(r.done);
  r.commit(); r.git('tag', 'studio-iteration-09');
  r.commit(); r.git('tag', 'studio-iteration-10');
  r.commit();
  assert.equal(previousIterationTag(r.root), 'studio-iteration-10');
});

test('with no tags there is no previous release', t => {
  const r = repo(); t.after(r.done);
  r.commit();
  assert.equal(previousIterationTag(r.root), null);
});

test('production-unchanged reports "not run", never "pass", on a comparison that covers no commits', async t => {
  const r = repo(); t.after(r.done);
  r.commit(); r.git('tag', 'studio-iteration-00');
  r.commit(undefined, ['games/g/index.html']); r.git('tag', 'studio-iteration-01');
  // Told to compare with the release itself: the TD-011 case, made explicit.
  const vacuous = await productionUnchanged.run({ root: r.root, previousTag: 'studio-iteration-01' });
  assert.equal(vacuous.status, 'skip', vacuous.detail);
  assert.match(vacuous.detail, /covers no commits/);
  // Left to its default, it finds the release before, and the production file.
  const real = await productionUnchanged.run({ root: r.root, previousTag: null });
  assert.equal(real.status, 'fail', real.detail);
  assert.match(real.detail, /studio-iteration-00/);
  assert.match(real.detail, /games\/g\/index\.html/);
});

test('production-unchanged fails on a baseline that names no commit', async t => {
  const r = repo(); t.after(r.done);
  r.commit();
  const result = await productionUnchanged.run({ root: r.root, previousTag: 'studio-iteration-99' });
  assert.equal(result.status, 'fail');
});
