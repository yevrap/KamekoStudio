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
    scoreDeal, endDeal
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

// ─── gameplay.js (endDeal full logic) ──────────────────────────────────────

function setupDeal(declarer, bid, isRaspasy = false) {
    state.players = [newPlayer('P1'), newPlayer('P2'), newPlayer('P3')];
    state.declarer = declarer;
    state.currentBid = bid;
    state.isRaspasy = isRaspasy;
    state.settings = { targetScore: 1000, bolts: false, barrel: false, rounding: false };
}

test('endDeal: basic declarer makes bid', () => {
    setupDeal(0, 100);
    state.players[0].trickPts = 110;
    state.players[1].trickPts = 10;
    state.players[2].trickPts = 0;
    state.players[1].tricks = 1;
    
    endDeal();
    
    assert.equal(state.players[0].total, 100);
    assert.equal(state.players[1].total, 10);
    assert.equal(state.players[2].total, 0);
});

test('endDeal: basic declarer fails bid', () => {
    setupDeal(1, 120);
    state.players[0].trickPts = 40; state.players[0].tricks = 2;
    state.players[1].trickPts = 80; state.players[1].tricks = 6;
    state.players[2].trickPts = 0;  state.players[2].tricks = 0;
    
    endDeal();
    
    assert.equal(state.players[0].total, 40);
    assert.equal(state.players[1].total, -120);
    assert.equal(state.players[2].total, 0);
});

test('endDeal: bolts rule', () => {
    setupDeal(0, 100);
    state.settings.bolts = true;
    
    state.players[0].trickPts = 100; state.players[0].tricks = 8;
    state.players[1].trickPts = 0;   state.players[1].tricks = 0; // Defender gets bolt
    state.players[2].trickPts = 20;  state.players[2].tricks = 2; // (Not 8 tricks total, but just a test setup)
    
    // 1st bolt
    endDeal();
    assert.equal(state.players[1].bolts, 1);
    assert.equal(state.players[1].total, 0);
    
    // 2nd bolt
    state.players[1].tricks = 0; state.players[1].trickPts = 0;
    endDeal();
    assert.equal(state.players[1].bolts, 2);
    assert.equal(state.players[1].total, 0);
    
    // 3rd bolt -> -120 and reset
    state.players[1].tricks = 0; state.players[1].trickPts = 0;
    endDeal();
    assert.equal(state.players[1].bolts, 0);
    assert.equal(state.players[1].total, -120);
});

test('endDeal: declarer cannot get bolts', () => {
    setupDeal(0, 100);
    state.settings.bolts = true;
    state.players[0].trickPts = 0; state.players[0].tricks = 0; // Declarer fails totally
    endDeal();
    assert.equal(state.players[0].bolts, 0); // Declarer shouldn't get a bolt
    assert.equal(state.players[0].total, -100);
});

test('endDeal: raspasy subtracts points', () => {
    setupDeal(null, 0, true);
    state.players[0].trickPts = 30;
    state.players[1].trickPts = 0;
    state.players[2].trickPts = 90;
    endDeal();
    assert.equal(state.players[0].total, -30);
    assert.equal(state.players[1].total, 0);
    assert.equal(state.players[2].total, -90);
});

test('endDeal: rounding', () => {
    setupDeal(0, 100);
    state.settings.rounding = true;
    state.players[0].trickPts = 100; state.players[0].tricks = 5;
    state.players[1].trickPts = 12;  state.players[1].tricks = 1;
    state.players[2].trickPts = 8;   state.players[2].tricks = 1;
    endDeal();
    // 12 rounds to 10. 8 rounds to 10.
    assert.equal(state.players[1].total, 10);
    assert.equal(state.players[2].total, 10);
});

test('endDeal: barrel - hitting barrel stops score', () => {
    setupDeal(1, 100);
    state.settings.barrel = true;
    state.players[0].total = 870; 
    state.players[0].trickPts = 150; state.players[0].tricks = 4; // Defender jumps past 880
    
    endDeal();
    // Must stop at 880
    assert.equal(state.players[0].total, 880);
    assert.equal(state.players[0].barrelAttempts, 0);
});

test('endDeal: barrel - winning bid on barrel wins game', () => {
    setupDeal(0, 120);
    state.settings.barrel = true;
    state.players[0].total = 880; 
    state.players[0].trickPts = 120; state.players[0].tricks = 5; // Declarer fulfills bid
    
    const result = endDeal();
    assert.equal(state.players[0].total, 1000);
    assert.equal(result.champion, state.players[0]);
});

test('endDeal: barrel - failing bid on barrel gives strike', () => {
    setupDeal(0, 120);
    state.settings.barrel = true;
    state.players[0].total = 880; 
    state.players[0].trickPts = 40; state.players[0].tricks = 2; // Declarer fails bid
    
    endDeal();
    // Stays at 880, but gains a strike
    assert.equal(state.players[0].total, 880);
    assert.equal(state.players[0].barrelAttempts, 1);
    
    // Fails again
    endDeal();
    assert.equal(state.players[0].barrelAttempts, 2);
    
    // 3rd strike
    endDeal();
    assert.equal(state.players[0].total, 760); // Falls off
    assert.equal(state.players[0].barrelAttempts, 0);
});

test('endDeal: barrel - defender on barrel stays 880, no strike', () => {
    setupDeal(1, 100);
    state.settings.barrel = true;
    state.players[0].total = 880; 
    state.players[0].trickPts = 40; state.players[0].tricks = 2; // Defender on barrel scores
    
    endDeal();
    assert.equal(state.players[0].total, 880);
    assert.equal(state.players[0].barrelAttempts, 0); // No strike
});

// ─── log.js (event stream — p1-15) ──────────────────────────────────────────

test('logEvent: appends entry stamped with current deal and trick', async () => {
    const { logEvent } = await import('../games/tysiacha/log.js');
    state.log = [];
    state.dealNum = 3;
    state.trickNum = 5;
    const entry = logEvent('bid', { p: 1, amount: 110 });
    assert.equal(state.log.length, 1);
    assert.deepEqual(entry, { type: 'bid', deal: 3, trick: 5, p: 1, amount: 110 });
});

test('trickReason: highest of led suit vs trumped', async () => {
    const { trickReason } = await import('../games/tysiacha/log.js');
    const trick = [
        { p: 0, card: { s: 'H', r: 'A' } },
        { p: 1, card: { s: 'S', r: '9' } },
        { p: 2, card: { s: 'H', r: 'K' } },
    ];
    assert.deepEqual(trickReason(trick, 1), { kind: 'trumped', card: { s: 'S', r: '9' } });
    assert.deepEqual(trickReason(trick, 0), { kind: 'highest', suit: 'H' });
    assert.deepEqual(trickReason(trick, 2), { kind: 'highest', suit: 'H' });
});

test('eventText: trick-won grammar and reasons for You vs AI', async () => {
    const { eventText } = await import('../games/tysiacha/log.js');
    assert.equal(
        eventText({ type: 'trick-won', p: 0, pts: 14, reason: { kind: 'trumped', card: { s: 'S', r: '9' } } }),
        'You take the trick (+14 — trumped with 9♠)');
    assert.equal(
        eventText({ type: 'trick-won', p: 1, pts: 25, reason: { kind: 'highest', suit: 'H' } }),
        'Vera takes the trick (+25 — highest ♥)');
});

test('eventText: bidding and deal-start lines', async () => {
    const { eventText } = await import('../games/tysiacha/log.js');
    assert.equal(eventText({ type: 'deal-start', deal: 3, p: 2, forced: true }),
        'Deal 3 — Boris opens the bidding at 100 (forced)');
    assert.equal(eventText({ type: 'pass', p: 0 }), 'You pass');
    assert.equal(eventText({ type: 'pass', p: 1 }), 'Vera passes');
    assert.equal(eventText({ type: 'bid', p: 2, amount: 120 }), 'Boris bids 120');
    assert.equal(eventText({ type: 'marriage', p: 1, suit: 'D' }),
        '💍 Vera declares the ♦ marriage — diamonds are trump! +80');
});

test('gameplay: a played trick logs plays in order and a reasoned trick-won', async () => {
    const { playCard, resolveTrick } = await import('../games/tysiacha/gameplay.js');
    state.session++;
    state.players = ['You', 'Vera', 'Boris'].map(newPlayer);
    state.log = [];
    state.dealNum = 1;
    state.phase = 'play';
    state.trump = null;
    state.trick = [];
    state.trickNum = 1;
    state.wonTrick = [false, false, false];
    state.leader = 0;
    state.turn = 0;
    state.players[0].hand = [{ s: 'H', r: '9' }];
    state.players[1].hand = [{ s: 'S', r: 'A' }]; // void in hearts, no trump: discard
    state.players[2].hand = [{ s: 'H', r: 'J' }];

    playCard(0, { s: 'H', r: '9' }, false);
    playCard(1, { s: 'S', r: 'A' }, false);
    playCard(2, { s: 'H', r: 'J' }, false);
    state.session++; // cancel the scheduled auto-resolve; resolve synchronously
    resolveTrick();

    const types = state.log.map(e => e.type);
    assert.deepEqual(types, ['play', 'play', 'play', 'trick-won']);
    assert.equal(state.log[0].isLead, true);
    assert.equal(state.log[1].isLead, false);
    const won = state.log[3];
    assert.equal(won.p, 2);                    // J♥ beats 9♥; off-suit A♠ never wins
    assert.equal(won.pts, 13);                 // 0 + 11 + 2
    assert.deepEqual(won.reason, { kind: 'highest', suit: 'H' });
    assert.equal(won.trick, 1);
    assert.equal(state.trickNum, 2);
});

test('gameplay: declaring a marriage logs the event and sets trump', async () => {
    const { playCard } = await import('../games/tysiacha/gameplay.js');
    state.session++;
    state.players = ['You', 'Vera', 'Boris'].map(newPlayer);
    state.log = [];
    state.dealNum = 2;
    state.phase = 'play';
    state.trump = null;
    state.trick = [];
    state.trickNum = 2;
    state.wonTrick = [false, true, false];
    state.leader = 1;
    state.turn = 1;
    state.players[1].hand = [{ s: 'D', r: 'Q' }, { s: 'D', r: 'K' }];

    playCard(1, { s: 'D', r: 'Q' }, true);

    assert.equal(state.trump, 'D');
    assert.equal(state.players[1].marriagePts, 80);
    const types = state.log.map(e => e.type);
    assert.deepEqual(types, ['marriage', 'play']);
    assert.equal(state.log[0].suit, 'D');
    assert.equal(state.log[1].trump, 'D');     // trump recorded as of the play
});
