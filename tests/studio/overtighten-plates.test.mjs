// Every shipped plate, proved reachable and proved non-trivial.
//
// Two claims, and the second is the one worth having. A solver shows each plate
// can be cleared from zero without stripping, so no plate ships that cannot be
// finished. The naive test shows each plate *cannot* be cleared by holding each
// bolt once, which is the design hypothesis — that the coupling is the game,
// not the timing — written as a check that would fail if it stopped being true.

import test from 'node:test';
import assert from 'node:assert/strict';
import { COUPLING, PLATES, couplingFor } from '../../studio/games/overtighten/constants.js';
import {
  asymmetricLinks, couplingLoad, initialTorque, isStripped, plateState, turn
} from '../../studio/games/overtighten/gameplay.js';

const mid = bolt => (bolt.lo + bolt.hi) / 2;

/**
 * The reference strategy: repeatedly take the bolt furthest below the middle of
 * its band and turn it exactly to the middle. It never turns a bolt above the
 * middle, so it cannot strip one — which makes "did it strip anything" a real
 * assertion about the plate rather than about the solver's caution.
 */
function solve(plate, coupling, budget = 400) {
  let torque = initialTorque(plate);
  for (let step = 0; step < budget; step++) {
    if (plateState(plate, torque).solved) return { solved: true, steps: step, torque };
    let worst = null;
    for (const bolt of plate.bolts) {
      const deficit = mid(bolt) - torque[bolt.id];
      if (deficit > 0 && (!worst || deficit > worst.deficit)) worst = { bolt, deficit };
    }
    if (!worst) return { solved: false, steps: step, torque, reason: 'no bolt is below its band middle' };
    torque = turn(plate, torque, worst.bolt.id, worst.deficit, coupling);
  }
  return { solved: false, steps: budget, torque, reason: 'ran out of budget' };
}

/** Hold each bolt once, in the order they are listed, to the middle of its band. */
function naive(plate, coupling) {
  let torque = initialTorque(plate);
  for (const bolt of plate.bolts) {
    const amount = mid(bolt) - torque[bolt.id];
    if (amount > 0) torque = turn(plate, torque, bolt.id, amount, coupling);
  }
  return torque;
}

test('there are plates to play', () => {
  assert.ok(PLATES.length >= 3, 'fewer than three plates ship');
  assert.equal(new Set(PLATES.map(p => p.id)).size, PLATES.length, 'two plates share an id');
});

for (const plate of PLATES) {
  const coupling = couplingFor(plate);

  test(`${plate.id}: every coupling is mutual`, () => {
    assert.deepEqual(asymmetricLinks(plate), []);
  });

  test(`${plate.id}: no bolt is coupled to more than it can gain`, () => {
    for (const { id, load } of couplingLoad(plate, coupling)) {
      assert.ok(load < 1, `${plate.id}/${id} loses ${load} per unit gained: the plate cannot converge`);
    }
  });

  test(`${plate.id}: the bands are coherent`, () => {
    for (const bolt of plate.bolts) {
      assert.ok(bolt.lo < bolt.hi, `${bolt.id}: lo is not below hi`);
      assert.ok(bolt.hi < bolt.strip, `${bolt.id}: the band reaches the strip point`);
      assert.ok(bolt.lo > 0, `${bolt.id}: a bolt that is seated at rest is not a bolt`);
    }
  });

  test(`${plate.id}: is solvable from zero without stripping anything`, () => {
    const result = solve(plate, coupling);
    assert.ok(result.solved, `${plate.id} was not solved: ${result.reason}`);
    for (const bolt of plate.bolts) {
      assert.ok(!isStripped(bolt, result.torque[bolt.id]), `${plate.id}/${bolt.id} stripped while solving`);
    }
  });

  test(`${plate.id}: is not solved by holding each bolt once — the coupling is the game`, () => {
    const state = plateState(plate, naive(plate, coupling));
    assert.equal(state.solved, false,
      `${plate.id} falls to the naive strategy: its coupling is decoration, not a mechanic`);
  });
}

test('a plate may only lower the coupling, never raise it', () => {
  // The guard on the override itself. A plate asking for a stronger coupling, or
  // for nonsense, gets the house value rather than what it asked for.
  assert.equal(couplingFor({ coupling: 0.18 }), 0.18);
  assert.equal(couplingFor({ coupling: 0.9 }), COUPLING);
  assert.equal(couplingFor({ coupling: 0 }), COUPLING);
  assert.equal(couplingFor({ coupling: -1 }), COUPLING);
  assert.equal(couplingFor({ coupling: NaN }), COUPLING);
  assert.equal(couplingFor({}), COUPLING);
  assert.equal(couplingFor(undefined), COUPLING);
});

test('the solver needs more moves than there are bolts, on every plate', () => {
  // The companion to the naive test, stated positively: if a plate took one
  // move per bolt it would be the naive strategy under another name.
  for (const plate of PLATES) {
    const { steps } = solve(plate, couplingFor(plate));
    assert.ok(steps > plate.bolts.length,
      `${plate.id} solved in ${steps} moves for ${plate.bolts.length} bolts`);
  }
});
