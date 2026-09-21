// Which checks run in which stage, where it matters that a list is exactly right.

import test from 'node:test';
import assert from 'node:assert/strict';
import { STAGES, CONCLUSIVE_STAGES, checksForStage } from './checks/index.mjs';
import { splitArg } from './lib/rules.mjs';

const ids = stage => checksForStage(stage).map(c => c.id);

test('push is the gate without the two review checks, plus on-main and no-stop-file', () => {
  const expected = [
    ...ids('gate').filter(id => !['docs-current', 'reviewer-verdict'].includes(id)),
    'on-main', 'no-stop-file'
  ].sort();
  assert.deepEqual(ids('push').sort(), expected);
});

test('a check the gate adds later lands in push too, unless it is a review check', () => {
  // Stated as a rule over the registry, so that a new gate check that forgets
  // `push` fails here rather than being skipped before every push.
  const reviewOnly = new Set(['docs-current', 'reviewer-verdict']);
  for (const id of ids('gate')) {
    if (!reviewOnly.has(id)) assert.ok(ids('push').includes(id), `${id} runs at the gate but not before a push`);
  }
});

test('push and gate are conclusive: a check they cannot run is a failure', () => {
  assert.deepEqual([...CONCLUSIVE_STAGES].sort(), ['gate', 'push']);
  assert.ok(STAGES.indexOf('push') > STAGES.indexOf('gate') && STAGES.indexOf('push') < STAGES.indexOf('postdeploy'));
});

test('an argument splits at its first "=", so a value may contain one', () => {
  assert.deepEqual(splitArg('--marker=if (!bh) particles = particles.filter(p => !p.spiral);'),
    ['marker', 'if (!bh) particles = particles.filter(p => !p.spiral);']);
  assert.deepEqual(splitArg('--stage=push'), ['stage', 'push']);
  assert.deepEqual(splitArg('--skip-slow'), ['skip-slow', undefined]);
  assert.deepEqual(splitArg('--marker='), ['marker', '']);
  assert.deepEqual(splitArg('stray'), [null, null]);
});
