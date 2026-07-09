import { test } from 'node:test';
import assert from 'node:assert/strict';

import { 
    SUITS, RANKS, PTS, MARRIAGE, 
    key, buildDeck, sortHand, handCardPts, marriagesInHand
} from '../games/tysiacha/constants.js';

import {
    state, newPlayer, legalMoves, cardBeats, trickWinnerSlot, wouldWinNow,
    trickPts, canDeclare, activeBidders, nextActive
} from '../games/tysiacha/state.js';

import {
    scoreDeal
} from '../games/tysiacha/gameplay.js';

// ─── constants.js ────────────────────────────────────────────────────────────

test('buildDeck: 24 cards (4 suits × 6 ranks)', () => {
    const deck = buildDeck();
    assert.equal(deck.length, 24);
    assert.equal(new Set(deck.map(key)).size, 24);
});

test('handCardPts: calculates point values correctly', () => {
    const hand = [
        { s: 'H', r: 'A' }, // 11
        { s: 'H', r: '10' }, // 10
        { s: 'D', r: 'K' }, // 4
        { s: 'C', r: 'Q' }, // 3
        { s: 'S', r: 'J' }, // 2
        { s: 'S', r: '9' }  // 0
    ];
    assert.equal(handCardPts(hand), 30);
});

test('marriagesInHand: detects K+Q of same suit', () => {
    const hand = [
        { s: 'H', r: 'K' }, { s: 'H', r: 'Q' }, // Heart marriage
        { s: 'D', r: 'K' }, { s: 'C', r: 'Q' }, // No marriage
        { s: 'S', r: 'K' }, { s: 'S', r: 'Q' }  // Spade marriage
    ];
    const marriages = marriagesInHand(hand);
    assert.equal(marriages.length, 2);
    assert.ok(marriages.includes('H'));
    assert.ok(marriages.includes('S'));
});

// ─── state.js (pure helpers) ───────────────────────────────────────────────

test('cardBeats: higher rank beats lower rank of same suit', () => {
    state.trump = null;
    const incumbent = { s: 'H', r: '10' };
    const challenger = { s: 'H', r: 'A' };
    assert.equal(cardBeats(challenger, incumbent), true);
    assert.equal(cardBeats(incumbent, challenger), false);
});

test('cardBeats: different non-trump suit cannot beat', () => {
    state.trump = null;
    const incumbent = { s: 'H', r: 'A' };
    const challenger = { s: 'D', r: '10' };
    assert.equal(cardBeats(challenger, incumbent), false);
});

test('cardBeats: trump beats non-trump', () => {
    state.trump = 'S';
    const incumbent = { s: 'H', r: 'A' };
    const challenger = { s: 'S', r: '9' };
    assert.equal(cardBeats(challenger, incumbent), true);
});

test('cardBeats: higher trump beats lower trump', () => {
    state.trump = 'S';
    const incumbent = { s: 'S', r: 'Q' };
    const challenger = { s: 'S', r: 'K' };
    assert.equal(cardBeats(challenger, incumbent), true);
});

test('trickWinnerSlot: finds the correct winner', () => {
    state.trump = 'D';
    state.trick = [
        { p: 1, card: { s: 'C', r: 'A' } }, // led
        { p: 2, card: { s: 'C', r: '9' } }, // followed suit, lower
        { p: 0, card: { s: 'D', r: '9' } }  // trumped!
    ];
    assert.equal(trickWinnerSlot(), 2); // The 3rd slot (index 2) played the trump
});

test('trickPts: sums the trick points correctly', () => {
    state.trick = [
        { card: { s: 'C', r: 'A' } }, // 11
        { card: { s: 'H', r: '10' } }, // 10
        { card: { s: 'S', r: 'K' } }   // 4
    ];
    assert.equal(trickPts(), 25);
});

test('legalMoves: must follow suit if possible', () => {
    state.trick = [ { card: { s: 'H', r: '9' } } ]; // Heart led
    state.trump = 'S';
    const hand = [
        { s: 'H', r: 'K' },
        { s: 'S', r: '10' },
        { s: 'C', r: 'A' }
    ];
    const legal = legalMoves(hand);
    assert.equal(legal.length, 1);
    assert.equal(legal[0].s, 'H');
});

test('legalMoves: must play trump if void in led suit', () => {
    state.trick = [ { card: { s: 'H', r: '9' } } ]; // Heart led
    state.trump = 'S';
    const hand = [
        { s: 'D', r: 'K' },
        { s: 'S', r: '10' },
        { s: 'C', r: 'A' }
    ];
    const legal = legalMoves(hand);
    assert.equal(legal.length, 1);
    assert.equal(legal[0].s, 'S');
});

test('legalMoves: can play anything if void in led suit and trump', () => {
    state.trick = [ { card: { s: 'H', r: '9' } } ]; // Heart led
    state.trump = 'S';
    const hand = [
        { s: 'D', r: 'K' },
        { s: 'C', r: 'A' }
    ];
    const legal = legalMoves(hand);
    assert.equal(legal.length, 2);
});

test('canDeclare: true if won a trick', () => {
    state.wonTrick = [true, false, false];
    state.declarer = 1;
    assert.equal(canDeclare(0), true);
    assert.equal(canDeclare(1), false);
});

test('canDeclare: true if declarer on first trick', () => {
    state.wonTrick = [false, false, false];
    state.declarer = 0;
    state.trickNum = 1;
    state.trick = [];
    assert.equal(canDeclare(0), true);
});

test('activeBidders / nextActive', () => {
    state.passed = [false, true, false];
    assert.deepEqual(activeBidders(), [0, 2]);
    assert.equal(nextActive(0), 2);
    assert.equal(nextActive(2), 0);
});

// ─── gameplay.js (pure scoring logic) ──────────────────────────────────────

test('scoreDeal: declarer makes bid', () => {
    const deltas = scoreDeal(0, 120, 125, [30, 25]);
    assert.equal(deltas[0], 120); // declarer gets bid amount exactly
    assert.equal(deltas[1], 30);
    assert.equal(deltas[2], 25);
});

test('scoreDeal: declarer fails bid', () => {
    const deltas = scoreDeal(1, 140, 110, [10, 40]); // declarer is 1
    assert.equal(deltas[0], 10);
    assert.equal(deltas[1], -140); // declarer loses bid amount
    assert.equal(deltas[2], 40);
});
