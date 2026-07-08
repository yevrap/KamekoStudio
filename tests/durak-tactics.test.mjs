import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getDisplayVal } from '../games/durak-tactics/constants.js';

// Note: gameplay.js holds the rest of durak-tactics' logic (beats, resolveCombat,
// checkGameOver, generateMap) but reads DOM elements at module load time, so it
// can't be imported in a plain Node test. games/CLAUDE.md documents this game's
// ui+gameplay merge as intentional (unlike durak-dungeon's clean split).

test('getDisplayVal: numeric ranks 6-10 return their own string', () => {
  for (let v = 6; v <= 10; v++) assert.equal(getDisplayVal(v), v.toString());
});

test('getDisplayVal: face ranks map to letters', () => {
  assert.equal(getDisplayVal(11), 'J');
  assert.equal(getDisplayVal(12), 'Q');
  assert.equal(getDisplayVal(13), 'K');
  assert.equal(getDisplayVal(14), 'A');
});

test('getDisplayVal: out-of-range rank returns its own string', () => {
  assert.equal(getDisplayVal(20), '20');
});
