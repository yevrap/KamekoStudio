// ═══════════════════════════════════════════════════════════════════════════
// GAMEPLAY — bidding, trick resolution, marriages, scoring, deal flow.
//            DOM-free pure logic.
// ═══════════════════════════════════════════════════════════════════════════

import {
    NAMES, SUITS, SUIT_CHAR, RANKS, PTS, MARRIAGE, TARGET, OPEN_BID, RAISE,
    key, rankIdx, buildDeck, sortHand, handCardPts, marriagesInHand, suitSpan, suitName
} from './constants.js';
import {
    state, newPlayer, legalMoves, cardBeats, trickWinnerSlot, wouldWinNow,
    trickPts, canDeclare, activeBidders, nextActive
} from './state.js';
import { aiBid as aiDoBid, aiExchange as aiDoExchange, aiMove as aiDoMove } from './ai.js';
import { render, banner, flashTip } from './ui.js';

// ── Session-safe timer ───────────────────────────────────────────────────

function later(fn, ms) {
    const sess = state.session;
    setTimeout(() => { if (state.session === sess) fn(); }, ms);
}

// ── Match / deal flow ────────────────────────────────────────────────────

export function newMatch() {
    state.session++;
    state.players = NAMES.map(newPlayer);
    state.dealer = 2;          // first deal: You open the bidding
    state.dealNum = 0;
    newDeal();
}

export function newDeal() {
    state.session++;
    state.dealNum++;
    const deck = buildDeck();
    state.players.forEach(pl => {
        pl.hand = deck.splice(0, 7);
        sortHand(pl.hand);
        pl.trickPts = 0; pl.marriagePts = 0; pl.marriages = []; pl.tricks = 0;
    });
    state.talon = deck.splice(0, 3);
    state.talonUp = false;
    state.trump = null;
    state.trick = [];
    state.trickNum = 1;
    state.wonTrick = [false, false, false];
    state.selected = null;
    state.give = [];
    state.pendingCard = null;
    state.passed = [false, false, false];
    state.bidLabel = ['', '', ''];
    state.declarer = null;
    state.phase = 'bidding';

    for (let p = 1; p < 3; p++) {
        const h = state.players[p].hand;
        const marPts = marriagesInHand(h).reduce((t, s) => t + MARRIAGE[s], 0);
        state.aiEstimate[p] = handCardPts(h) + Math.round(marPts * 0.9) + 15 - Math.floor(Math.random() * 12);
    }

    const opener = (state.dealer + 1) % 3;
    
    state.isRaspasy = false;
    
    if (state.settings.raspasy) {
        state.currentBid = OPEN_BID - RAISE; // Starts below 100 so next bid is 100
        state.highBidder = null;
        state.bidTurn = opener;
        banner(`Deal ${state.dealNum} — ${state.players[opener].name} starts the bidding`);
    } else {
        state.currentBid = OPEN_BID;
        state.highBidder = opener;
        state.bidLabel[opener] = 'bid 100';
        state.bidTurn = nextActive(opener);
        banner(`Deal ${state.dealNum} — ${state.players[opener].name} open${opener === 0 ? '' : 's'} the bidding at 100 (forced)`);
    }
    
    render();
    later(bidStep, 1400);
}

// ── Bidding ──────────────────────────────────────────────────────────────

export function bidStep() {
    if (state.phase !== 'bidding') return;
    const active = activeBidders();
    
    if (active.length === 0) {
        // Everyone passed, play Raspasy
        state.isRaspasy = true;
        state.declarer = null;
        state.phase = 'play';
        state.leader = (state.dealer + 1) % 3;
        state.turn = state.leader;
        state.trick = [];
        state.trickNum = 1;
        state.talon = []; // Discard talon in Raspasy
        banner('Everyone passed! Playing Raspasy (Negative Round) 📉');
        render();
        later(step, 1400);
        return;
    }
    
    if (active.length === 1 && state.highBidder !== null) { 
        winBidding(active[0]); 
        return; 
    }
    
    render();
    if (state.bidTurn !== 0) later(() => aiDoBid(state.bidTurn), 900 + Math.random() * 500);
}

export function humanBid(pass) {
    if (state.phase !== 'bidding' || state.bidTurn !== 0) return;
    if (pass) {
        state.passed[0] = true;
        state.bidLabel[0] = 'passed';
    } else {
        state.currentBid += RAISE;
        state.highBidder = 0;
        state.bidLabel[0] = 'bid ' + state.currentBid;
    }
    state.bidTurn = nextActive(0);
    bidStep();
}

function winBidding(p) {
    state.declarer = p;
    state.phase = 'talon';
    state.talonUp = true;
    banner(`${state.players[p].name} win${p === 0 ? '' : 's'} the bidding at ${state.currentBid} and take${p === 0 ? '' : 's'} the talon`);
    render();
    later(() => {
        state.players[p].hand.push(...state.talon);
        sortHand(state.players[p].hand);
        state.talon = [];
        state.talonUp = false;
        state.phase = 'exchange';
        if (p === 0) { render(); }
        else { render(); later(() => aiDoExchange(p), 1200); }
    }, 2200);
}

// ── Exchange ─────────────────────────────────────────────────────────────

export function giveCard(from, to, card) {
    const h = state.players[from].hand;
    h.splice(h.findIndex(c => key(c) === key(card)), 1);
    state.players[to].hand.push(card);
    sortHand(state.players[to].hand);
}

export function confirmExchange() {
    if (state.phase !== 'exchange' || state.declarer !== 0 || state.give.length !== 2) return;
    const cards = state.give.map(k => state.players[0].hand.find(c => key(c) === k));
    giveCard(0, 1, cards[0]);
    giveCard(0, 2, cards[1]);
    state.give = [];
    banner('You passed a card to Vera and one to Boris');
    startPlay();
}

export function startPlay() {
    state.phase = 'play';
    state.leader = state.declarer;
    state.turn = state.declarer;
    state.trick = [];
    state.trickNum = 1;
    render();
    later(step, 900);
}

// ── Play ─────────────────────────────────────────────────────────────────

export function step() {
    if (state.phase !== 'play') return;
    render();
    if (state.trick.length === 3) { later(resolveTrick, 1250); return; }
    if (state.turn !== 0) later(() => aiDoMove(state.turn), 800 + Math.random() * 450);
}

export function playCard(p, card, declare) {
    const h = state.players[p].hand;
    h.splice(h.findIndex(c => key(c) === key(card)), 1);
    if (declare) {
        state.trump = card.s;
        state.players[p].marriagePts += MARRIAGE[card.s];
        state.players[p].marriages.push(card.s);
        banner(`💍 ${state.players[p].name} declare${p === 0 ? '' : 's'} the ${SUIT_CHAR[card.s]} marriage — ${suitName(card.s)} are trump! +${MARRIAGE[card.s]}`);
    }
    state.trick.push({ p, card });
    state.selected = null;
    state.turn = (p + 1) % 3;
    step();
}

function resolveTrick() {
    if (state.phase !== 'play') return;
    const slot = trickWinnerSlot();
    const winner = state.trick[slot].p;
    const pts = trickPts();
    state.players[winner].trickPts += pts;
    state.players[winner].tricks++;
    state.wonTrick[winner] = true;
    banner(`${state.players[winner].name} take${winner === 0 ? '' : 's'} the trick (+${pts})`);
    state.trick = [];
    state.leader = winner;
    state.turn = winner;
    state.trickNum++;
    if (state.trickNum > 8) { later(endDeal, 1000); render(); return; }
    step();
}

// ── Deal end / scoring ───────────────────────────────────────────────────

export function endDeal() {
    state.phase = 'dealEnd';
    const rows = [];
    let champion = null;
    
    const target = state.settings.targetScore || 1000;
    const barrelThreshold = target - 120;

    state.players.forEach((pl, p) => {
        let got = pl.trickPts + pl.marriagePts;
        
        // Rounding
        if (state.settings.rounding) {
            got = Math.round(got / 5) * 5;
        }

        let delta = 0;
        let note = '';
        let boltAdded = false;
        
        if (state.isRaspasy) {
            delta = -got;
            note = `<span class="failed">Took ${got} pts → −${got}</span>`;
            if (got === 0) note = `<span class="made">No tricks → 0</span>`;
        } else {
            if (p === state.declarer) {
                const made = got >= state.currentBid;
                delta = made ? state.currentBid : -state.currentBid;
                note = made
                    ? `<span class="made">made the ${state.currentBid} bid → +${state.currentBid}</span>`
                    : `<span class="failed">failed the ${state.currentBid} bid → −${state.currentBid}</span>`;
            } else {
                delta = got;
                note = `+${got}`;
                
                // Bolts
                if (state.settings.bolts && pl.tricks === 0) {
                    pl.bolts = (pl.bolts || 0) + 1;
                    boltAdded = true;
                    note += ` (Bolt)`;
                    if (pl.bolts >= 3) {
                        delta -= 120;
                        note += ` <span class="failed">3 Bolts! −120</span>`;
                        pl.bolts = 0;
                    }
                }
            }
        }

        // Apply delta
        let newTotal = pl.total + delta;
        
        // The Barrel
        if (state.settings.barrel) {
            if (pl.total === barrelThreshold) {
                // Already on the barrel
                if (p === state.declarer && newTotal >= target) {
                    // Won the game!
                } else {
                    // Failed to win
                    newTotal = barrelThreshold;
                    pl.barrelAttempts = (pl.barrelAttempts || 0) + 1;
                    if (pl.barrelAttempts >= 3) {
                        newTotal -= 120;
                        pl.barrelAttempts = 0;
                        note += ` <span class="failed">Fell off barrel! −120</span>`;
                    } else {
                        note += ` <span class="muted">Barrel attempt ${pl.barrelAttempts}/3</span>`;
                    }
                }
            } else if (newTotal >= barrelThreshold && newTotal < target) {
                // Just got on the barrel
                newTotal = barrelThreshold;
                pl.barrelAttempts = 0;
                note += ` <span class="made">On the barrel!</span>`;
            }
        }

        pl.total = newTotal;
        rows.push({ pl, p, got, delta, note, boltAdded });
    });

    const leader = state.players.reduce((a, b) => (b.total > a.total ? b : a));
    if (leader.total >= target) champion = leader;

    const result = { rows, champion, target };
    if (state.onDealEnd) state.onDealEnd(result);
    return result;
}

export function summaryNext() {
    if (state.phase === 'matchEnd') { newMatch(); return; }
    state.dealer = (state.dealer + 1) % 3;
    newDeal();
}

// ── Scoring helpers for tests ────────────────────────────────────────────

export function scoreDeal(declarerIdx, bid, declarerGot, defenderGots) {
    // Pure function: returns score deltas for each player
    const deltas = [];
    for (let p = 0; p < 3; p++) {
        if (p === declarerIdx) {
            deltas.push(declarerGot >= bid ? bid : -bid);
        } else {
            deltas.push(defenderGots[p < declarerIdx ? p : p - 1] || 0);
        }
    }
    return deltas;
}

// ── Human interaction ────────────────────────────────────────────────────

export function onCardTap(card) {
    const k = key(card);

    if (state.phase === 'exchange' && state.declarer === 0) {
        const i = state.give.indexOf(k);
        if (i >= 0) state.give.splice(i, 1);
        else if (state.give.length < 2) state.give.push(k);
        render();
        return;
    }

    if (state.phase !== 'play' || state.turn !== 0 || state.trick.length === 3) return;
    const legal = legalMoves(state.players[0].hand);
    if (!legal.some(c => key(c) === k)) {
        flashTip(illegalReason());
        return;
    }
    if (state.selected !== k) {
        state.selected = k;
        render();
        return;
    }
    // second tap on the same card — play it
    const isLead = state.trick.length === 0;
    const partnerRank = card.r === 'K' ? 'Q' : card.r === 'Q' ? 'K' : null;
    const hasPartner = partnerRank && state.players[0].hand.some(c => c.s === card.s && c.r === partnerRank);
    if (isLead && hasPartner && canDeclare(0) && state.trump !== card.s) {
        state.pendingCard = card;
        return { action: 'marriage-prompt', card };
    }
    playCard(0, card, false);
}

function illegalReason() {
    const led = state.trick[0].card.s;
    const hand = state.players[0].hand;
    if (hand.some(c => c.s === led)) return `You must follow suit — play a ${suitName(led)} card (${SUIT_CHAR[led]}).`;
    if (state.trump && hand.some(c => c.s === state.trump)) return `No ${SUIT_CHAR[led]} in hand — you must play a trump (${SUIT_CHAR[state.trump]}).`;
    return 'That card can\'t be played right now.';
}
