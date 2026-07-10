// ═══════════════════════════════════════════════════════════════════════════
// GAMEPLAY — bidding, trick resolution, marriages, scoring, deal flow.
//            DOM-free pure logic.
// ═══════════════════════════════════════════════════════════════════════════

import { MARRIAGE, OPEN_BID, RAISE, key, buildDeck, sortHand } from './constants.js';
import { t, playerName } from './i18n.js';
import {
    state, newPlayer, legalMoves, cardBeats, trickWinnerSlot, wouldWinNow,
    trickPts, canDeclare, activeBidders, nextActive
} from './state.js';
import { aiBid as aiDoBid, aiExchange as aiDoExchange, aiMove as aiDoMove, estimateHand } from './ai.js';
import { logEvent, eventText, trickReason } from './log.js';
import { render, banner, flashTip, coachText } from './ui.js';
import { snap, chime, gavel } from './sfx.js';

// ── Session-safe timer ───────────────────────────────────────────────────

function later(fn, ms) {
    const sess = state.session;
    setTimeout(() => { if (state.session === sess) fn(); }, ms);
}

// ── Event announcement ───────────────────────────────────────────────────
// Log an event and show it as the banner — the banner is a view of the log,
// so the two can never disagree. Silent events use logEvent directly.

export function announce(type, data) {
    banner(eventText(logEvent(type, data)));
}

// Log what the coach would say at every human decision point — even with the
// hint bar off (Q10): the bar toggle controls live display only, so the log
// can answer "what would coach have said?" after a confusing moment.
function logHumanHint() {
    const text = coachText();
    if (text) logEvent('hint', { text });
}

// ── Match / deal flow ────────────────────────────────────────────────────

export function newMatch() {
    state.session++;
    state.players = [0, 1, 2].map(p => newPlayer(playerName(p)));
    state.dealer = 2;          // first deal: You open the bidding
    state.dealNum = 0;
    state.log = [];
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
    state.bidLabel = [null, null, null];
    state.declarer = null;
    state.phase = 'bidding';

    for (let p = 1; p < 3; p++) {
        state.aiEstimate[p] = estimateHand(state.players[p].hand, state.difficulty);
    }

    const opener = (state.dealer + 1) % 3;
    
    state.isRaspasy = false;
    
    if (state.settings.raspasy) {
        state.currentBid = OPEN_BID - RAISE; // Starts below 100 so next bid is 100
        state.highBidder = null;
        state.bidTurn = opener;
        announce('deal-start', { p: opener, forced: false });
    } else {
        state.currentBid = OPEN_BID;
        state.highBidder = opener;
        state.bidLabel[opener] = { kind: 'bid', amount: OPEN_BID };
        state.bidTurn = nextActive(opener);
        announce('deal-start', { p: opener, forced: true });
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
        announce('raspasy', {});
        render();
        later(step, 1400);
        return;
    }
    
    if (active.length === 1 && state.highBidder !== null) {
        winBidding(active[0]);
        return;
    }

    if (state.bidTurn === 0) logHumanHint();
    render();
    if (state.bidTurn !== 0) later(() => aiDoBid(state.bidTurn), 900 + Math.random() * 500);
}

export function humanBid(pass) {
    if (state.phase !== 'bidding' || state.bidTurn !== 0) return;
    if (pass) {
        state.passed[0] = true;
        state.bidLabel[0] = { kind: 'pass' };
        logEvent('pass', { p: 0 });
    } else {
        state.currentBid += RAISE;
        state.highBidder = 0;
        state.bidLabel[0] = { kind: 'bid', amount: state.currentBid };
        logEvent('bid', { p: 0, amount: state.currentBid });
    }
    state.bidTurn = nextActive(0);
    bidStep();
}

function winBidding(p) {
    state.declarer = p;
    state.phase = 'talon';
    state.talonUp = true;
    gavel();
    announce('bid-won', { p, amount: state.currentBid, talon: state.talon.slice() });
    render();
    later(() => {
        state.players[p].hand.push(...state.talon);
        sortHand(state.players[p].hand);
        state.talon = [];
        state.talonUp = false;
        state.phase = 'exchange';
        if (p === 0) { logHumanHint(); render(); }
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
    announce('exchange', { p: 0, to1: 1, to2: 2 });
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
    if (state.trick.length < 3 && state.turn === 0) logHumanHint();
    render();
    if (state.trick.length === 3) { later(resolveTrick, 1250); return; }
    if (state.turn !== 0) later(() => aiDoMove(state.turn), 800 + Math.random() * 450);
}

export function playCard(p, card, declare) {
    const h = state.players[p].hand;
    h.splice(h.findIndex(c => key(c) === key(card)), 1);
    snap();
    if (declare) {
        state.trump = card.s;
        state.players[p].marriagePts += MARRIAGE[card.s];
        state.players[p].marriages.push(card.s);
        announce('marriage', { p, suit: card.s });
        chime();
    }
    logEvent('play', { p, card, isLead: state.trick.length === 0, trump: state.trump });
    state.trick.push({ p, card });
    state.selected = null;
    state.turn = (p + 1) % 3;
    step();
}

export function resolveTrick() {
    if (state.phase !== 'play') return;
    const slot = trickWinnerSlot();
    const winner = state.trick[slot].p;
    const pts = trickPts();
    state.players[winner].trickPts += pts;
    state.players[winner].tricks++;
    state.wonTrick[winner] = true;
    announce('trick-won', { p: winner, pts, reason: trickReason(state.trick, slot) });
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
            note = got === 0 ? t('note.raspasyZero') : t('note.raspasyTook', got);
        } else {
            if (p === state.declarer) {
                const made = got >= state.currentBid;
                delta = made ? state.currentBid : -state.currentBid;
                note = made ? t('note.made', state.currentBid) : t('note.failed', state.currentBid);
            } else {
                delta = got;
                note = `+${got}`;

                // Bolts
                if (state.settings.bolts && pl.tricks === 0) {
                    pl.bolts = (pl.bolts || 0) + 1;
                    boltAdded = true;
                    note += t('note.bolt');
                    if (pl.bolts >= 3) {
                        delta -= 120;
                        note += t('note.bolts3');
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
                if (p === state.declarer) {
                    if (newTotal >= target) {
                        // Won the game!
                    } else {
                        // Failed to win (either failed bid or didn't reach 1000)
                        pl.barrelAttempts = (pl.barrelAttempts || 0) + 1;
                        if (pl.barrelAttempts >= 3) {
                            newTotal = barrelThreshold - 120;
                            pl.barrelAttempts = 0;
                            note += t('note.barrelFellOff');
                        } else {
                            newTotal = barrelThreshold;
                            note += t('note.barrelAttempt', pl.barrelAttempts);
                        }
                    }
                } else {
                    // Defender on the barrel
                    if (newTotal > barrelThreshold) {
                        newTotal = barrelThreshold; // Can't earn points
                    } else if (newTotal < barrelThreshold) {
                        pl.barrelAttempts = 0; // Lost points to bolts/raspasy, fell off
                        note += t('note.barrelLost');
                    }
                }
            } else if (pl.total < barrelThreshold && newTotal >= barrelThreshold) {
                // Just got on the barrel (even if they would have crossed 1000)
                newTotal = barrelThreshold;
                pl.barrelAttempts = 0;
                note += t('note.barrelOn');
            }
        }

        pl.total = newTotal;
        rows.push({ pl, p, got, delta, note, boltAdded });
    });

    logEvent('deal-end', { deltas: rows.map(r => ({ p: r.p, delta: r.delta, got: r.got })) });

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
    if (hand.some(c => c.s === led)) return t('illegal.follow', led);
    if (state.trump && hand.some(c => c.s === state.trump)) return t('illegal.trump', led, state.trump);
    return t('illegal.other');
}
