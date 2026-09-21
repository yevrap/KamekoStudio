// Every shipped plate: what it can be cleared by, stated rather than hoped for.
//
// The design hypothesis was that the coupling makes a plate an ordering puzzle.
// **It is false for every plate that ships**, and this file is where that is
// recorded so it cannot be quietly re-claimed. Two independent reviews found it;
// the test that was supposed to catch it could not fail.
//
// What went wrong is worth keeping. The original test held each bolt once *to
// the middle of its band* and concluded "not solvable in one pass". The hold
// amount is a free variable and fixing it removed the only degree of freedom
// that mattered: because `turn()` clamps at zero, a bolt sitting at zero absorbs
// no loosening, so in a single pass a bolt is only reduced by neighbours turned
// *after* it. That makes the plate a back-substitution — overshoot each bolt by
// `coupling × Σ(later neighbours' amounts)` — and every plate falls to one hold
// per bolt, with 6 to 38 units of strip headroom to spare.
//
// So the assertions below say what is true: each plate is reachable, and each
// plate is also trivial in two different ways. `onePass` and `roundRobin` are
// exported shapes a redesigned mechanic must *fail*, and the tests that assert
// they succeed are the ones a real fix will flip.

import test from 'node:test';
import assert from 'node:assert/strict';
import { COUPLING, PLATES, couplingFor } from '../../studio/games/overtighten/constants.js';
import {
  asymmetricLinks, boltById, couplingLoad, initialTorque, isStripped, plateState, turn
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

/**
 * One hold per bolt, in `order`, with the amount chosen by back-substitution.
 *
 * A bolt starts at zero and stays there until it is turned, because loosening
 * clamps at zero — so its final value is its own amount minus what the
 * neighbours turned *after* it take off. Walk the order backwards and every
 * amount is determined. This is the strategy the design hypothesis said should
 * not exist.
 */
function onePass(plate, coupling, order = plate.bolts.map(b => b.id)) {
  const amounts = {};
  for (let i = order.length - 1; i >= 0; i--) {
    const bolt = boltById(plate, order[i]);
    const later = bolt.links.filter(id => order.indexOf(id) > i);
    amounts[bolt.id] = mid(bolt) + coupling * later.reduce((sum, id) => sum + (amounts[id] ?? 0), 0);
  }
  let torque = initialTorque(plate);
  let strippedEnRoute = false;
  for (const id of order) {
    torque = turn(plate, torque, id, amounts[id], coupling);
    if (plateState(plate, torque).stripped) strippedEnRoute = true;
  }
  return { torque, amounts, strippedEnRoute, solved: plateState(plate, torque).solved && !strippedEnRoute };
}

/**
 * Go round the plate in `order`, topping each bolt up to the middle of its band,
 * and repeat. The dumbest strategy there is: it looks at nothing and plans
 * nothing. It never exceeds a band, so it can never strip.
 */
function roundRobin(plate, coupling, order, maxPasses = 20) {
  let torque = initialTorque(plate);
  for (let pass = 0; pass < maxPasses; pass++) {
    if (plateState(plate, torque).solved) return { solved: true, passes: pass };
    for (const id of order) {
      const amount = mid(boltById(plate, id)) - torque[id];
      if (amount > 0) torque = turn(plate, torque, id, amount, coupling);
    }
  }
  return { solved: plateState(plate, torque).solved, passes: maxPasses };
}

/** Every ordering of a plate's bolts. Three bolts to five is 6 to 120 orders. */
function permutations(items) {
  if (items.length <= 1) return [items];
  return items.flatMap((item, i) =>
    permutations([...items.slice(0, i), ...items.slice(i + 1)]).map(rest => [item, ...rest]));
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

  test(`${plate.id}: FALLS to one hold per bolt — the design hypothesis is false here`, () => {
    // Asserted as a fact about what shipped, not as a thing that is wanted. A
    // redesign that restores the ordering puzzle flips this to `false` and this
    // test, with its name, is what will have to be rewritten to say so.
    const result = onePass(plate, coupling);
    assert.equal(result.solved, true,
      `${plate.id} no longer falls to one hold per bolt — if that is deliberate, this test is the one to invert`);
    assert.equal(result.strippedEnRoute, false, 'and it does so without stripping a thread');
    for (const bolt of plate.bolts) {
      assert.ok(result.amounts[bolt.id] <= bolt.strip,
        `${plate.id}/${bolt.id} would have to be turned past its own strip point`);
    }
  });

  test(`${plate.id}: falls to one hold per bolt in almost every order, not just the listed one`, () => {
    // The plan's falsifier was "cleared by holding each bolt once in *any*
    // order". The original test tried one order; this tries all of them.
    // Measured across the three plates: 142 of 146 orderings fall.
    const orders = permutations(plate.bolts.map(b => b.id));
    const fell = orders.filter(order => onePass(plate, coupling, order).solved);
    assert.ok(fell.length / orders.length >= 0.8,
      `only ${fell.length} of ${orders.length} orders fall to one hold per bolt`);
  });

  test(`${plate.id}: any order that resists one pass resists on a ceiling, not on a puzzle (vacuous unless one does)`, () => {
    // Four orderings of the face plate do not fall, and it is worth being exact
    // about why: one bolt would have to be turned 0.2 to 2.8 units past its own
    // strip point. That is a tuning accident, not something a player could
    // reason about — nothing on the plate tells them which orders those are.
    // If a redesign ever makes an order fail for a *structural* reason, this
    // test fails and says so, which is the point of writing it down.
    const orders = permutations(plate.bolts.map(b => b.id));
    for (const order of orders) {
      const result = onePass(plate, coupling, order);
      if (result.solved) continue;
      const overshooting = plate.bolts.filter(b => result.amounts[b.id] > b.strip);
      assert.ok(overshooting.length > 0,
        `${plate.id}: ${order.join('→')} fails for a structural reason, not a strip ceiling — the mechanic may have changed`);
      for (const bolt of overshooting) {
        // Three, not five: the claim written in review.md, the ticket and the
        // game's own page is "under three units", and the test should defend
        // the sentence rather than something looser. Measured maximum: 2.750.
        assert.ok(result.amounts[bolt.id] - bolt.strip < 3,
          `${plate.id}/${bolt.id}: misses by ${(result.amounts[bolt.id] - bolt.strip).toFixed(1)}, which is a margin, not a wall`);
      }
    }
  });

  test(`${plate.id}: falls to blind round-robin in every order, so there is nothing to order`, () => {
    const orders = permutations(plate.bolts.map(b => b.id));
    const worst = orders
      .map(order => roundRobin(plate, coupling, order))
      .reduce((a, b) => (b.passes > a.passes ? b : a));
    assert.equal(worst.solved, true);
    // Three, which is what review.md, the ticket and the game's own page say.
    // A looser bound would let the sentence and the test disagree.
    assert.ok(worst.passes <= 3, `worst case ${worst.passes} passes`);
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

test('the reference solver takes more moves than one per bolt, which proves only that it is not the clever strategy', () => {
  // Kept, demoted, and relabelled. It says the "fix the worst bolt" loop is not
  // a single pass. It was read as evidence that a single pass does not exist,
  // which is a different claim and a false one.
  for (const plate of PLATES) {
    const { steps } = solve(plate, couplingFor(plate));
    assert.ok(steps > plate.bolts.length,
      `${plate.id} solved in ${steps} moves for ${plate.bolts.length} bolts`);
  }
});

test('the strategies used here are distinct, so agreeing proves something', () => {
  // A guard on the file itself: if `onePass` and `roundRobin` ever became the
  // same walk, every assertion above would agree for the wrong reason.
  const plate = PLATES[1];
  const coupling = couplingFor(plate);
  const one = onePass(plate, coupling);
  assert.equal(Object.keys(one.amounts).length, plate.bolts.length);
  assert.ok(
    plate.bolts.some(b => one.amounts[b.id] > b.hi),
    'one-pass must overshoot at least one bolt past its band; round-robin never does'
  );
  assert.ok(roundRobin(plate, coupling, plate.bolts.map(b => b.id)).passes >= 2,
    'round-robin must take more than one pass, or it would be the one-pass strategy');
});
