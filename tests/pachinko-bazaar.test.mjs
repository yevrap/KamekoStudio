import { test } from 'node:test';
import assert from 'node:assert/strict';
import { quotaFor, BUCKET_MULTS } from '../games/pachinko-bazaar/constants.js';
import { state } from '../games/pachinko-bazaar/state.js';
import { hitPeg, landOrb, buildPegs, assignSpecials, collideCircle } from '../games/pachinko-bazaar/gameplay.js';

function resetState() {
    state.round = 1;
    state.quota = 800;
    state.roundScore = 0;
    state.runScore = 0;
    state.drops = 5;
    state.coins = 4;
    state.owned = {};
    state.pegs = [];
    state.orbs = [];
    state.particles = [];
    state.floats = [];
    state.dropMult = 1;
    state.dropSplitUsed = false;
}

test('quotaFor: calculates expected curve', () => {
    assert.equal(quotaFor(1), 800);
    assert.equal(quotaFor(3), 1680);
    assert.equal(quotaFor(10), 22690);
    // Extrapolates beyond array
    assert.equal(quotaFor(11), 32900); // 22690 * 1.45 = 32900.5 -> round to 10s -> 32900
});

test('buildPegs & assignSpecials: creates correct board', () => {
    resetState();
    buildPegs();
    assert.equal(state.pegs.length, 60, 'Should create 60 pegs');
    
    assignSpecials();
    const counts = { blue: 0, gold: 0, mult: 0, coin: 0 };
    for (const p of state.pegs) counts[p.type] = (counts[p.type] || 0) + 1;
    
    assert.equal(counts.gold, 6);
    assert.equal(counts.mult, 4);
    assert.equal(counts.coin, 6);
    assert.equal(counts.blue, 44);
});

test('hitPeg: scores and resolves types correctly', () => {
    resetState();
    
    // Blue peg
    let peg = { type: 'blue', hit: false, x: 100, y: 100, flash: 0 };
    let orb = { pts: 0 };
    hitPeg(peg, orb);
    assert.equal(peg.hit, true);
    assert.equal(orb.pts, 10);
    
    // Gold peg
    peg = { type: 'gold', hit: false, x: 100, y: 100, flash: 0 };
    hitPeg(peg, orb);
    assert.equal(orb.pts, 50); // 10 + 40
    
    // Mult peg
    peg = { type: 'mult', hit: false, x: 100, y: 100, flash: 0 };
    assert.equal(state.dropMult, 1);
    hitPeg(peg, orb);
    assert.equal(state.dropMult, 2);
    
    // Coin peg
    peg = { type: 'coin', hit: false, x: 100, y: 100, flash: 0 };
    const coinsBefore = state.coins;
    hitPeg(peg, orb);
    assert.equal(orb.pts, 55);
    assert.equal(state.coins, coinsBefore + 1);
});

test('hitPeg: items modify behavior', () => {
    resetState();
    state.owned.golden = true;
    state.owned.coinx2 = true;
    state.owned.split = true;
    
    let orb = { pts: 0, x: 100, y: 100, vx: 10, vy: 10 };
    let peg = { type: 'gold', hit: false, x: 100, y: 100, flash: 0 };
    
    hitPeg(peg, orb);
    assert.equal(orb.pts, 80, 'Golden Touch gives +80 instead of +40');
    assert.equal(state.dropSplitUsed, true, 'Split item is consumed');
    assert.equal(state.orbs.length, 1, 'New orb added to state array');
    
    peg = { type: 'coin', hit: false, x: 100, y: 100, flash: 0 };
    const coinsBefore = state.coins;
    hitPeg(peg, orb);
    assert.equal(state.coins, coinsBefore + 2, 'Coinx2 gives 2 coins');
});

test('hitPeg: Peg Upgrader turns blue to gold', () => {
    resetState();
    state.owned.upgrade = true;
    
    let orb = { pts: 0, upgradeUsed: false };
    let peg = { type: 'blue', hit: false, x: 100, y: 100, flash: 0 };
    
    hitPeg(peg, orb);
    assert.equal(peg.type, 'gold', 'Peg became gold');
    assert.equal(orb.upgradeUsed, true, 'Upgrader was used');
    assert.equal(orb.pts, 40, 'Scores 40 points immediately as a gold peg');
    
    // Hit a second blue peg with the same orb
    let peg2 = { type: 'blue', hit: false, x: 100, y: 100, flash: 0 };
    hitPeg(peg2, orb);
    assert.equal(peg2.type, 'blue', 'Second peg does not turn gold');
});

test('landOrb: calculates final drop score correctly', () => {
    resetState();
    
    let orb = { pts: 100, x: 200, y: 500 }; // Falls in middle bucket (x=200) -> bucket index 2 -> BUCKET_MULTS[2] = 5
    state.dropMult = 3;
    landOrb(orb);
    assert.equal(state.roundScore, 100 * 3 * 5); // pts * dropMult * bmult
    
    // With heavy orb
    resetState();
    state.owned.heavy = true;
    orb = { pts: 100, x: 200, y: 500 }; // bucket mult 5 + 1 = 6
    state.dropMult = 3;
    landOrb(orb);
    assert.equal(state.roundScore, 100 * 3 * 6);
});

test('collideCircle: alters velocity appropriately', () => {
    // Drop straight down onto center of peg
    let orb = { x: 100, y: 86, vx: 0, vy: 100 };
    // Peg at 100, 100, distance 14 (overlap since ORB_R(8) + cr(7) = 15)
    const collided = collideCircle(orb, 100, 100, 7, 0.5);
    assert.equal(collided, true);
    assert.equal(orb.vy < 0, true, 'Orb should bounce upward');
    assert.equal(orb.y < 100, true, 'Orb should be pushed out of peg');
});
