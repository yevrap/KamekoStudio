// The branch check, against real history (SHS-070).
//
// ADR-0011 §4 moves the studio to a branch and a pull request per ticket, so the
// check that used to demand `main` also admits a ticket branch named
// `studio/SHS-NNN-slug` — and nothing else. Being behind `origin/main` fails on
// either: a ticket branch is rebased before it is pushed, as `main` is.

import test from 'node:test';
import assert from 'node:assert/strict';
import { checksForStage } from './checks/index.mjs';
import { scratchRepo } from './lib/scratch-repo.mjs';

const ID = 'on-branch';
const check = checksForStage('preflight').find(c => c.id === ID);

/** A working repository whose `origin` is another scratch repository, in sync. */
function repos() {
  const origin = scratchRepo();
  origin.commit('docs(studio): SHS-050 first');
  const work = scratchRepo();
  work.git('remote', 'add', 'origin', origin.root);
  work.git('fetch', '--quiet', 'origin');
  work.git('reset', '--quiet', '--hard', 'origin/main');
  return { origin, work, done: () => { origin.done(); work.done(); } };
}

test('the branch check exists under its new id, at preflight and push', () => {
  assert.ok(check, `no preflight check "${ID}"`);
  assert.deepEqual(check.stages, ['preflight', 'push']);
  assert.match(check.description, /branch/);
  assert.equal(checksForStage('push').some(c => c.id === 'on-main'), false);
});

test('main, in sync with origin, passes and says so', () => {
  const { work, done } = repos();
  try {
    const r = check.run({ root: work.root });
    assert.equal(r.status, 'pass', r.detail);
    assert.match(r.detail, /on main, in sync/);
  } finally { done(); }
});

test('main behind origin/main still fails', () => {
  const { origin, work, done } = repos();
  try {
    origin.commit('feat: arcade moved');
    const r = check.run({ root: work.root });
    assert.equal(r.status, 'fail', r.detail);
    assert.match(r.detail, /1 commit\(s\) behind origin\/main/);
  } finally { done(); }
});

test('a ticket branch ahead of origin/main passes, and the detail names the branch', () => {
  const { work, done } = repos();
  try {
    work.git('switch', '--quiet', '-c', 'studio/SHS-070-checks-accept-branches');
    work.commit('test(studio): SHS-070 on a branch', ['studio/branch.txt']);
    const r = check.run({ root: work.root });
    assert.equal(r.status, 'pass', r.detail);
    assert.match(r.detail, /ticket branch studio\/SHS-070-checks-accept-branches/);
    assert.match(r.detail, /1 commit\(s\) ahead of origin\/main/);
  } finally { done(); }
});

test('a ticket branch behind origin/main fails: rebase first', () => {
  const { origin, work, done } = repos();
  try {
    work.git('switch', '--quiet', '-c', 'studio/SHS-070-x');
    work.commit('test(studio): SHS-070 on a branch', ['studio/branch.txt']);
    origin.commit('feat: arcade moved');
    const r = check.run({ root: work.root });
    assert.equal(r.status, 'fail', r.detail);
    assert.match(r.detail, /behind origin\/main/);
    assert.match(r.detail, /rebase/);
  } finally { done(); }
});

for (const name of ['feature/x', 'studio/x', 'studio/SHS-12-x', 'shs-070-x', 'studio/SHS-070',
  'studio/SHS-070-', 'studio/SHS-070-Upper', 'studio/SHS-0700-x', 'studio/SHS-042-x', 'studio/SS-041-x',
  'studio/SHS-070-x/y', 'main-2']) {
  test(`any other branch name fails: ${name}`, () => {
    const { work, done } = repos();
    try {
      work.git('switch', '--quiet', '-c', name);
      const r = check.run({ root: work.root });
      assert.equal(r.status, 'fail', `${name}: ${r.detail}`);
      assert.match(r.detail, new RegExp(`"${name.replace(/[/.]/g, '\\$&')}"`));
    } finally { done(); }
  });
}

test('a detached HEAD fails', () => {
  const { work, done } = repos();
  try {
    work.git('switch', '--quiet', '--detach');
    assert.equal(check.run({ root: work.root }).status, 'fail');
  } finally { done(); }
});
