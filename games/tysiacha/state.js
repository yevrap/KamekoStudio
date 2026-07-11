// ═══════════════════════════════════════════════════════════════════════════
// STATE — mutable game state object and state query helpers. DOM-free.
// ═══════════════════════════════════════════════════════════════════════════

import { RANKS, key, rankIdx, PTS } from './constants.js';

export function newPlayer(name) {
    return { name, hand: [], trickPts: 0, marriagePts: 0, marriages: [], tricks: 0, total: 0, bolts: 0, barrelAttempts: 0 };
}

export const state = {
    session: 0,
    coach: false,
    autoPlay: false,
    fastForward: false,
    autoRestart: false,
    difficulty: 'normal',   // easy | normal | hard — applies live, persisted in main.js
    settings: {
        targetScore: 500,
        rounding: false,
        hiddenPoints: false,
        bolts: false,
        barrel: false,
        reraise: false,
        raspasy: false,
        tapToPlay: false
    },
    players: [],
    dealer: 2,
    dealNum: 0,
    phase: 'idle',   // bidding | talon | exchange | play | dealEnd | matchEnd | paused
    talon: [],
    talonUp: false,
    currentBid: 0,
    highBidder: null,
    bidTurn: 0,
    passed: [false, false, false],
    bidLabel: [null, null, null],   // typed: {kind:'bid',amount} | {kind:'pass'} | null — formatted at render
    declarer: null,
    trump: null,
    trick: [],
    trickNum: 1,
    leader: 0,
    turn: 0,
    wonTrick: [false, false, false],
    log: [],             // match-long event stream (see log.js); reset in newMatch
    selected: null,      // card key selected in hand (two-tap play)
    give: [],            // exchange: card keys chosen to give away
    pendingCard: null,   // card awaiting marriage prompt
    aiEstimate: [0, 0, 0],
    pausedPhase: null,   // phase before settings pause
    resumeAction: null,  // saved later() action while paused
};

// ── State query helpers ──────────────────────────────────────────────────

export function legalMoves(hand) {
    if (state.trick.length === 0) return hand.slice();
    const led = state.trick[0].card.s;
    const follow = hand.filter(c => c.s === led);
    if (follow.length) return follow;
    if (state.trump) {
        const trumps = hand.filter(c => c.s === state.trump);
        if (trumps.length) return trumps;
    }
    return hand.slice();
}

export function cardBeats(challenger, incumbent) {
    if (challenger.s === incumbent.s) return rankIdx(challenger) > rankIdx(incumbent);
    return challenger.s === state.trump;
}

export function trickWinnerSlot() {
    let best = 0;
    for (let i = 1; i < state.trick.length; i++) {
        if (cardBeats(state.trick[i].card, state.trick[best].card)) best = i;
    }
    return best;
}

export function wouldWinNow(card) {
    if (state.trick.length === 0) return true;
    return cardBeats(card, state.trick[trickWinnerSlot()].card);
}

export function trickPts() { return state.trick.reduce((t, x) => t + PTS[x.card.r], 0); }

export function canDeclare(p) {
    if (state.isRaspasy) return false;
    return state.wonTrick[p] || (p === state.declarer && state.trickNum === 1 && state.trick.length === 0);
}

export function activeBidders() {
    return [0, 1, 2].filter(p => !state.passed[p]);
}

export function nextActive(from) {
    let t = from;
    do { t = (t + 1) % 3; } while (state.passed[t]);
    return t;
}
