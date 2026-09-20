// Overtighten — the torque rules and the progress rules, without a browser.
//
// The plates themselves are proved in overtighten-plates.test.mjs. This file is
// about the model: that turning does what the design says, that the two failure
// states are distinguishable, and that a stored value cannot make the page lie.

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  boltState, initialTorque, isSeated, isStripped, plateAspect, plateState, turn
} from '../../studio/games/overtighten/gameplay.js';
import {
  afterClear, allCleared, isUnlocked, readProgress, resumeIndex, writeProgress
} from '../../studio/games/overtighten/state.js';

const PLATE = {
  id: 'test',
  bolts: [
    { id: 'a', lo: 40, hi: 60, strip: 100, links: ['b'] },
    { id: 'b', lo: 40, hi: 60, strip: 100, links: ['a', 'c'] },
    { id: 'c', lo: 40, hi: 60, strip: 100, links: ['b'] }
  ]
};

test('a fresh plate has every bolt at zero', () => {
  assert.deepEqual(initialTorque(PLATE), { a: 0, b: 0, c: 0 });
});

test('turning a bolt raises it and loosens only what it is coupled to', () => {
  const after = turn(PLATE, initialTorque(PLATE), 'b', 40, 0.25);
  assert.equal(after.b, 40);
  assert.equal(after.a, 0, 'a was already at zero and cannot go below it');

  const seated = turn(PLATE, { a: 50, b: 0, c: 50 }, 'b', 40, 0.25);
  assert.equal(seated.b, 40);
  assert.equal(seated.a, 40, 'a lost a quarter of what b gained');
  assert.equal(seated.c, 40, 'so did c — b is coupled to both');
});

test('a bolt with no coupling to the turned one is untouched', () => {
  const after = turn(PLATE, { a: 50, b: 50, c: 50 }, 'a', 20, 0.25);
  assert.equal(after.c, 50, 'c is not coupled to a');
});

test('loosening stops at zero rather than going negative', () => {
  const after = turn(PLATE, { a: 5, b: 0, c: 0 }, 'b', 80, 0.25);
  assert.equal(after.a, 0);
});

test('turning never mutates the state it was given', () => {
  const before = { a: 50, b: 50, c: 50 };
  turn(PLATE, before, 'b', 20, 0.25);
  assert.deepEqual(before, { a: 50, b: 50, c: 50 });
});

test('a turn of zero, a negative turn, or an unknown bolt changes nothing', () => {
  const before = { a: 50, b: 50, c: 50 };
  assert.equal(turn(PLATE, before, 'b', 0, 0.25), before);
  assert.equal(turn(PLATE, before, 'b', -10, 0.25), before);
  assert.equal(turn(PLATE, before, 'nope', 10, 0.25), before);
});

test('seating is inclusive at both ends of the band', () => {
  const bolt = PLATE.bolts[0];
  assert.equal(isSeated(bolt, 39.99), false);
  assert.equal(isSeated(bolt, 40), true);
  assert.equal(isSeated(bolt, 60), true);
  assert.equal(isSeated(bolt, 60.01), false);
});

test('stripping begins past the strip point, not at it', () => {
  const bolt = PLATE.bolts[0];
  assert.equal(isStripped(bolt, 100), false);
  assert.equal(isStripped(bolt, 100.01), true);
});

test('a bolt reports which of the two problems it has', () => {
  const bolt = PLATE.bolts[0];
  assert.equal(boltState(bolt, 10).state, 'loose');
  assert.equal(boltState(bolt, 50).state, 'seated');
  assert.equal(boltState(bolt, 80).state, 'over');
  assert.equal(boltState(bolt, 120).state, 'stripped');
  // Loose and over are different problems: one is the bolt's own to turn, the
  // other can only be fixed by turning a neighbour. A single "wrong" state
  // would hide the distinction the whole game is built on.
  assert.notEqual(boltState(bolt, 10).state, boltState(bolt, 80).state);
});

test('the gauge is drawn against the strip point, so it warns about the real danger', () => {
  const bolt = PLATE.bolts[0];
  assert.equal(boltState(bolt, 50).fill, 0.5);
  assert.equal(boltState(bolt, 100).fill, 1);
  assert.equal(boltState(bolt, 400).fill, 1, 'the gauge pins rather than overflowing');
  assert.equal(boltState(bolt, 0).bandStart, 0.4);
  assert.equal(boltState(bolt, 0).bandEnd, 0.6);
});

test('a bolt with no stored torque reads as zero, not as NaN', () => {
  assert.equal(boltState(PLATE.bolts[0], undefined).value, 0);
  assert.equal(boltState(PLATE.bolts[0], undefined).state, 'loose');
});

test('a plate is solved only when every bolt is seated', () => {
  assert.equal(plateState(PLATE, { a: 50, b: 50, c: 50 }).solved, true);
  assert.equal(plateState(PLATE, { a: 50, b: 50, c: 30 }).solved, false);
  assert.equal(plateState(PLATE, { a: 50, b: 50, c: 30 }).seatedCount, 2);
});

test('one stripped thread loses the plate even when every other bolt is seated', () => {
  const state = plateState(PLATE, { a: 50, b: 50, c: 101 });
  assert.equal(state.stripped, true);
  assert.equal(state.solved, false);
  assert.equal(state.outcome, 'stripped');
});

test('stripping outranks solving, so a plate cannot be won and lost at once', () => {
  // 100 is exactly the strip point and therefore still legal; 100.01 is not.
  const legal = plateState({ bolts: [{ id: 'a', lo: 40, hi: 120, strip: 100, links: [] }] }, { a: 100 });
  assert.equal(legal.outcome, 'solved');
  const past = plateState({ bolts: [{ id: 'a', lo: 40, hi: 120, strip: 100, links: [] }] }, { a: 100.01 });
  assert.equal(past.outcome, 'stripped');
});

// ---- Progress ---------------------------------------------------------------

test('a stored count survives every kind of nonsense', () => {
  assert.equal(readProgress('2', 3), 2);
  assert.equal(readProgress(null, 3), 0);
  assert.equal(readProgress('', 3), 0);
  assert.equal(readProgress('two', 3), 0);
  assert.equal(readProgress('-4', 3), 0);
  assert.equal(readProgress('1.7', 3), 1, 'a fraction floors rather than rendering as one');
  // A value that cannot be read grants nothing. Clamping it to the plate count
  // instead would make "1e999" in the storage inspector unlock the whole game,
  // which is the wrong direction for an unreadable value to fail in.
  assert.equal(readProgress('1e999', 3), 0, 'Infinity is not progress');
  assert.equal(readProgress(String(Number.MAX_SAFE_INTEGER + 2), 3), 0);
  // A readable count past the end is different: it was a real count once, and
  // plates can be removed. It clamps rather than resetting.
  assert.equal(readProgress('9', 3), 3, 'a count beyond the plates that exist is clamped');
});

test('a count is written back as a plain integer string', () => {
  assert.equal(writeProgress(2), '2');
  assert.equal(writeProgress('2'), '2');
  assert.equal(writeProgress(2.9), '2');
  assert.equal(writeProgress(-1), '0');
  assert.equal(writeProgress(NaN), '0');
  assert.equal(writeProgress(undefined), '0');
});

test('plates unlock one at a time and no faster', () => {
  assert.equal(isUnlocked(0, 0), true, 'the first plate is always open');
  assert.equal(isUnlocked(1, 0), false);
  assert.equal(isUnlocked(1, 1), true);
  assert.equal(isUnlocked(2, 1), false);
});

test('a returning player resumes at the first plate they have not cleared', () => {
  assert.equal(resumeIndex(0, 3), 0);
  assert.equal(resumeIndex(1, 3), 1);
  assert.equal(resumeIndex(3, 3), 2, 'with everything cleared, the last plate, not one past it');
  assert.equal(resumeIndex(-2, 3), 0);
  assert.equal(resumeIndex(0, 0), 0);
});

test('replaying an earlier plate does not walk progress backwards', () => {
  assert.equal(afterClear(0, 3), 3);
  assert.equal(afterClear(2, 1), 3);
  assert.equal(afterClear(0, 0), 1);
});

test('"all cleared" needs plates to exist', () => {
  assert.equal(allCleared(3, 3), true);
  assert.equal(allCleared(2, 3), false);
  assert.equal(allCleared(0, 0), false, 'no plates is not a finished game');
});

test('a plate may shape its own field, within reason', () => {
  assert.equal(plateAspect({ aspect: 2.1 }), 2.1);
  assert.equal(plateAspect({}), 1, 'no value is a square');
  assert.equal(plateAspect({ aspect: 0 }), 1);
  assert.equal(plateAspect({ aspect: 40 }), 1, 'an absurd value is refused, not honoured');
  assert.equal(plateAspect({ aspect: 'wide' }), 1);
  assert.equal(plateAspect(undefined), 1);
});
