import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  Card, mulberry32, seedFromString, shuffle,
  displayValue, suitEmoji, suitName
} from '../games/durak-dungeon/constants.js';
import { state, newRun, hasRelic, getActiveTrumpSuit, canDefend } from '../games/durak-dungeon/state.js';

// ─── mulberry32 / seedFromString ─────────────────────────────────────────────

test('mulberry32: same seed produces the same sequence', () => {
  const a = mulberry32(42);
  const b = mulberry32(42);
  const seqA = [a(), a(), a()];
  const seqB = [b(), b(), b()];
  assert.deepEqual(seqA, seqB);
});

test('mulberry32: different seeds produce different sequences', () => {
  const a = mulberry32(1);
  const b = mulberry32(2);
  assert.notEqual(a(), b());
});

test('mulberry32: values stay within [0, 1)', () => {
  const rng = mulberry32(7);
  for (let i = 0; i < 20; i++) {
    const v = rng();
    assert.ok(v >= 0 && v < 1);
  }
});

test('seedFromString: same string produces the same hash', () => {
  assert.equal(seedFromString('ABCD12'), seedFromString('ABCD12'));
});

test('seedFromString: different strings produce different hashes', () => {
  assert.notEqual(seedFromString('ABCD12'), seedFromString('ZZZZZZ'));
});

// ─── shuffle ──────────────────────────────────────────────────────────────

test('shuffle: preserves all elements', () => {
  const rng = mulberry32(5);
  const arr = [1, 2, 3, 4, 5];
  const shuffled = shuffle(arr.slice(), rng);
  assert.deepEqual(shuffled.slice().sort(), [1, 2, 3, 4, 5]);
});

test('shuffle: is deterministic for a given rng seed', () => {
  const arrA = shuffle([1, 2, 3, 4, 5], mulberry32(99));
  const arrB = shuffle([1, 2, 3, 4, 5], mulberry32(99));
  assert.deepEqual(arrA, arrB);
});

// ─── display helpers ──────────────────────────────────────────────────────

test('displayValue: numeric ranks 6-10 return their own string', () => {
  for (let v = 6; v <= 10; v++) assert.equal(displayValue(v), String(v));
});

test('displayValue: face ranks map to letters', () => {
  assert.equal(displayValue(11), 'J');
  assert.equal(displayValue(12), 'Q');
  assert.equal(displayValue(13), 'K');
  assert.equal(displayValue(14), 'A');
});

test('suitEmoji: known suit ids map to symbols', () => {
  assert.equal(suitEmoji(1), '♠');
  assert.equal(suitEmoji(4), '❤');
});

test('suitEmoji: unknown suit id returns empty string', () => {
  assert.equal(suitEmoji(99), '');
});

test('suitName: known suit ids map to names', () => {
  assert.equal(suitName(2), 'clubs');
  assert.equal(suitName(3), 'diamonds');
});

// ─── hasRelic / getActiveTrumpSuit ───────────────────────────────────────────

test('hasRelic: true when relic id is present in run', () => {
  newRun('TESTSEED');
  state.run.relics = [{ id: 'iron-shield' }, { id: 'magnet' }];
  assert.equal(hasRelic('magnet'), true);
});

test('hasRelic: false when relic id is absent', () => {
  newRun('TESTSEED');
  state.run.relics = [{ id: 'iron-shield' }];
  assert.equal(hasRelic('magnet'), false);
});

test('getActiveTrumpSuit: returns run trumpSuit when no override', () => {
  newRun('TESTSEED');
  state.run.trumpSuit = 3;
  state.run.currentTrumpOverride = null;
  assert.equal(getActiveTrumpSuit(), 3);
});

test('getActiveTrumpSuit: returns override when set (trump-shift mutation)', () => {
  newRun('TESTSEED');
  state.run.trumpSuit = 3;
  state.run.currentTrumpOverride = 1;
  assert.equal(getActiveTrumpSuit(), 1);
});

test('getActiveTrumpSuit: defaults to 1 when there is no active run', () => {
  state.run = null;
  assert.equal(getActiveTrumpSuit(), 1);
});

// ─── canDefend ────────────────────────────────────────────────────────────

function setupRun(trumpSuit, mutations) {
  newRun('TESTSEED');
  state.run.trumpSuit = trumpSuit;
  state.run.currentTrumpOverride = null;
  state.run.enemy = { mutations: mutations || [] };
}

test('canDefend: same suit higher value beats lower value', () => {
  setupRun(1, []);
  assert.equal(canDefend(new Card(9, 2), new Card(7, 2)), true);
});

test('canDefend: same suit lower value cannot beat higher value', () => {
  setupRun(1, []);
  assert.equal(canDefend(new Card(7, 2), new Card(9, 2)), false);
});

test('canDefend: trump beats non-trump attack', () => {
  setupRun(1, []);
  assert.equal(canDefend(new Card(6, 1), new Card(14, 2)), true);
});

test('canDefend: non-trump cannot beat trump attack', () => {
  setupRun(1, []);
  assert.equal(canDefend(new Card(14, 2), new Card(6, 1)), false);
});

test('canDefend: trump beats trump only with higher value', () => {
  setupRun(1, []);
  assert.equal(canDefend(new Card(10, 1), new Card(8, 1)), true);
  assert.equal(canDefend(new Card(8, 1), new Card(10, 1)), false);
});

test('canDefend: no attack card returns false', () => {
  setupRun(1, []);
  assert.equal(canDefend(new Card(10, 1), null), false);
});

test('canDefend: no-trumps mutation disables trump defense, same-suit-higher only', () => {
  setupRun(1, ['no-trumps']);
  assert.equal(canDefend(new Card(6, 1), new Card(14, 2)), false);
  assert.equal(canDefend(new Card(9, 2), new Card(7, 2)), true);
});
