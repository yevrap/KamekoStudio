// ═══════════════════════════════════════════════════════════════════════════
// AI — bidding decisions, card play logic, exchange. DOM-free.
// ═══════════════════════════════════════════════════════════════════════════

import { RANKS, PTS, MARRIAGE, RAISE, rankIdx, marriagesInHand, key, handCardPts } from './constants.js';
import {
    state, legalMoves, wouldWinNow, trickPts, canDeclare, nextActive, activeBidders
} from './state.js';
import { bidStep, giveCard, startPlay, playCard, step, announce } from './gameplay.js';
import { logEvent } from './log.js';

// ── Hand estimate (drives bidding) ───────────────────────────────────────
// Difficulty is the noise on the estimate: easy bots undervalue marriages
// and swing wildly (timid auctions, occasional wild overbids); hard bots
// price the hand tightly and bid to the edge.

export function estimateHand(hand, difficulty = 'normal') {
    const marPts = marriagesInHand(hand).reduce((tot, s) => tot + MARRIAGE[s], 0);
    const pts = handCardPts(hand);
    if (difficulty === 'easy') return pts + Math.round(marPts * 0.7) + 8 - Math.floor(Math.random() * 25);
    if (difficulty === 'hard') return pts + marPts + 16 - Math.floor(Math.random() * 6);
    return pts + Math.round(marPts * 0.9) + 15 - Math.floor(Math.random() * 12);
}

// ── AI Bidding ───────────────────────────────────────────────────────────

export function aiBid(p) {
    if (state.phase !== 'bidding' || state.bidTurn !== p) return;
    if (state.currentBid + RAISE <= state.aiEstimate[p]) {
        state.currentBid += RAISE;
        state.highBidder = p;
        state.bidLabel[p] = { kind: 'bid', amount: state.currentBid };
        logEvent('bid', { p, amount: state.currentBid });
    } else {
        state.passed[p] = true;
        state.bidLabel[p] = { kind: 'pass' };
        logEvent('pass', { p });
    }
    state.bidTurn = nextActive(p);
    bidStep();
}

// ── AI Exchange ──────────────────────────────────────────────────────────

export function giveScore(c, marSuits) {
    let v = PTS[c.r] + rankIdx(c) * 0.1;
    if (marSuits.includes(c.s) && (c.r === 'K' || c.r === 'Q')) v += 100;
    return v;
}

export function aiExchange(p) {
    if (state.phase !== 'exchange') return;
    const marSuits = marriagesInHand(state.players[p].hand);
    const ranked = state.players[p].hand.slice().sort((a, b) => giveScore(a, marSuits) - giveScore(b, marSuits));
    const gives = [ranked[0], ranked[1]];
    const opp1 = (p + 1) % 3, opp2 = (p + 2) % 3;
    giveCard(p, opp1, gives[0]);
    giveCard(p, opp2, gives[1]);
    announce('exchange', { p, to1: opp1, to2: opp2 });
    startPlay();
}

// ── AI Play ──────────────────────────────────────────────────────────────

function lowest(cards) {
    return cards.slice().sort((a, b) => (PTS[a.r] - PTS[b.r]) || (rankIdx(a) - rankIdx(b)))[0];
}

// What to throw on a lost trick. Hard bots won't break up a K+Q pair —
// that's a future marriage — unless nothing else is legal.
function dumpCard(hand, legal, diff) {
    if (diff !== 'hard') return lowest(legal);
    const marSuits = marriagesInHand(hand);
    const safe = legal.filter(c => !(marSuits.includes(c.s) && (c.r === 'K' || c.r === 'Q')));
    return lowest(safe.length ? safe : legal);
}

export function aiMove(p) {
    if (state.phase !== 'play' || state.turn !== p) return;
    const diff = state.difficulty || 'normal';
    const hand = state.players[p].hand;
    const legal = legalMoves(hand);

    // Easy bots blunder: about a third of the time they just toss the
    // lowest legal card without looking at the trick at all.
    if (diff === 'easy' && Math.random() < 0.35) { playCard(p, lowest(legal), false); return; }

    if (state.trick.length === 0) {
        if (diff !== 'easy' && state.settings.reraise && state.declarer === p && state.trickNum === 1 && state.currentBid < state.aiEstimate[p] - 10) {
            state.currentBid = Math.floor(state.aiEstimate[p] / 10) * 10;
            announce('reraise', { p, amount: state.currentBid });
        }
        if (canDeclare(p)) {
            const suits = marriagesInHand(hand).sort((a, b) => MARRIAGE[b] - MARRIAGE[a]);
            // ...and sometimes forget they're holding a marriage.
            if (suits.length && !(diff === 'easy' && Math.random() < 0.25)) {
                const q = hand.find(c => c.s === suits[0] && c.r === 'Q');
                playCard(p, q, true);
                return;
            }
        }
        const ace = legal.find(c => c.r === 'A' && (!state.trump || c.s === state.trump))
                 || legal.find(c => c.r === 'A');
        if (ace) { playCard(p, ace, false); return; }
        playCard(p, dumpCard(hand, legal, diff), false);
        return;
    }

    const winners = legal.filter(wouldWinNow).sort((a, b) => (PTS[a.r] - PTS[b.r]) || (rankIdx(a) - rankIdx(b)));
    const last = state.trick.length === 2;
    const pts = trickPts();
    if (winners.length) {
        const cheapWin = PTS[winners[0].r] <= 2;
        // Hard bots also grab the lead when a marriage is waiting to be
        // declared (declaring requires having won a trick), and contest
        // mid-trick points sooner.
        const wantsLead = diff === 'hard' && !state.wonTrick[p] && marriagesInHand(hand).length > 0;
        const take = last ? (pts > 0 || cheapWin || wantsLead)
                          : (pts >= (diff === 'hard' ? 5 : 8));
        if (take) { playCard(p, winners[0], false); return; }
    }
    playCard(p, dumpCard(hand, legal, diff), false);
}
