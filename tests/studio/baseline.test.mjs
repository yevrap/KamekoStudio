// What "the previous release" means, against a real git repository.
//
// After an iteration's own tag was pushed, `production-unchanged` compared the
// release with itself and passed having proved nothing (TD-011). These tests
// build a throwaway repository and tag it the way an iteration does.

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { gitPath, previousIterationTag, commitsSince } from './lib/shell.mjs';
import { productionUnchanged } from './checks/path-guard.mjs';

// No real identity: the committer only has to exist, and `@localhost` is not an
// address anyone owns.
const ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: 'studio test', GIT_AUTHOR_EMAIL: 'studio@localhost',
  GIT_COMMITTER_NAME: 'studio test', GIT_COMMITTER_EMAIL: 'studio@localhost',
  GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1'
};

function repo() {
  const root = mkdtempSync(path.join(tmpdir(), 'studio-baseline-'));
  const git = (...args) => execFileSync(gitPath(), args, { cwd: root, env: ENV, encoding: 'utf8' }).trim();
  git('init', '--quiet', '--initial-branch=main');
  let n = 0;
  const commit = (file = `studio/f${n}.txt`) => {
    const full = path.join(root, file);
    execFileSync('mkdir', ['-p', path.dirname(full)]);
    writeFileSync(full, String(n++));
    git('add', '--all');
    git('commit', '--quiet', '-m', `docs(studio): SHS-050 commit ${n}`);
    return git('rev-parse', 'HEAD');
  };
  return { root, git, commit, done: () => rmSync(root, { recursive: true, force: true }) };
}

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
  r.commit('games/g/index.html'); r.git('tag', 'studio-iteration-01');
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
