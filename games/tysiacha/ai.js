// ═══════════════════════════════════════════════════════════════════════════
// AI — bidding decisions, card play logic, exchange. DOM-free.
// ═══════════════════════════════════════════════════════════════════════════

import { RANKS, PTS, MARRIAGE, RAISE, rankIdx, marriagesInHand, key } from './constants.js';
import {
    state, legalMoves, wouldWinNow, trickPts, canDeclare, nextActive, activeBidders
} from './state.js';
import { bidStep, giveCard, startPlay, playCard, step, announce } from './gameplay.js';
import { logEvent } from './log.js';

// ── AI Bidding ───────────────────────────────────────────────────────────

export function aiBid(p) {
    if (state.phase !== 'bidding') return;
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

export function aiMove(p) {
    if (state.phase !== 'play' || state.turn !== p) return;
    const hand = state.players[p].hand;
    const legal = legalMoves(hand);

    if (state.trick.length === 0) {
        if (state.settings.reraise && state.declarer === p && state.trickNum === 1 && state.currentBid < state.aiEstimate[p] - 10) {
            state.currentBid = Math.floor(state.aiEstimate[p] / 10) * 10;
            announce('reraise', { p, amount: state.currentBid });
        }
        if (canDeclare(p)) {
            const suits = marriagesInHand(hand).sort((a, b) => MARRIAGE[b] - MARRIAGE[a]);
            if (suits.length) {
                const q = hand.find(c => c.s === suits[0] && c.r === 'Q');
                playCard(p, q, true);
                return;
            }
        }
        const ace = legal.find(c => c.r === 'A' && (!state.trump || c.s === state.trump))
                 || legal.find(c => c.r === 'A');
        if (ace) { playCard(p, ace, false); return; }
        playCard(p, lowest(legal), false);
        return;
    }

    const winners = legal.filter(wouldWinNow).sort((a, b) => (PTS[a.r] - PTS[b.r]) || (rankIdx(a) - rankIdx(b)));
    const last = state.trick.length === 2;
    const pts = trickPts();
    if (winners.length && ((last && (pts > 0 || PTS[winners[0].r] <= 2)) || (!last && pts >= 8))) {
        playCard(p, winners[0], false);
        return;
    }
    playCard(p, lowest(legal), false);
}
