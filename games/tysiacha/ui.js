// ═══════════════════════════════════════════════════════════════════════════
// UI — all DOM rendering: hand, field, scoreboard, overlays, coach bar,
//       card dimming, two-tap play. Also coach text generation.
// ═══════════════════════════════════════════════════════════════════════════

import {
    SUITS, SUIT_CHAR, SUIT_IS_RED, RANKS, PTS, MARRIAGE, TARGET,
    key, rankIdx, cardLabel, suitSpan, suitName, handCardPts, marriagesInHand
} from './constants.js';
import {
    state, legalMoves, wouldWinNow, trickPts, canDeclare, trickWinnerSlot
} from './state.js';

// ── DOM ref cache ────────────────────────────────────────────────────────

const $ = id => document.getElementById(id);

// ── Card HTML ────────────────────────────────────────────────────────────

export function cardHTML(c, extra = '', give = '') {
    return `<div class="card ${SUIT_IS_RED[c.s] ? 'red' : ''} ${extra}" data-k="${key(c)}">
        ${give ? `<span class="c-give">${give}</span>` : ''}
        <div class="c-corner">${c.r}<br>${SUIT_CHAR[c.s]}</div>
        <div class="c-pip">${SUIT_CHAR[c.s]}</div>
        ${PTS[c.r] ? `<div class="c-pts">${PTS[c.r]}</div>` : ''}
    </div>`;
}

function cardBackHTML() { return '<div class="card back"></div>'; }

// ── Slot order (visual: Vera left, You center, Boris right) ─────────────

function slotOrder() { return [1, 0, 2]; }

// ── Banner ───────────────────────────────────────────────────────────────

let bannerTimer = null;
export function banner(msg) {
    if (typeof document === 'undefined') return;   // unit tests run gameplay headless
    const b = $('banner');
    b.textContent = msg;
    b.style.opacity = 1;
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => { b.style.opacity = 0; }, 3400);
}

// ── Flash tip ────────────────────────────────────────────────────────────

export function flashTip(msg) {
    if (typeof document === 'undefined') return;
    const tip = $('tip');
    $('tip-text').textContent = msg;
    tip.classList.remove('hidden');
    tip.classList.remove('flash');
    void tip.offsetWidth;
    tip.classList.add('flash');
}

// ── Coach text ───────────────────────────────────────────────────────────

export function coachText() {
    const me = state.players[0];
    if (state.phase === 'bidding') {
        if (state.passed[0]) return 'You passed — watch how high the others push the bid.';
        const mar = marriagesInHand(me.hand);
        const marTxt = mar.length ? ` + marriage${mar.length > 1 ? 's' : ''} ${mar.map(s => SUIT_CHAR[s] + MARRIAGE[s]).join(', ')}` : ', no marriage in hand';
        const est = handCardPts(me.hand) + mar.reduce((t, s) => t + MARRIAGE[s], 0) + 15;
        if (state.bidTurn === 0) return `Your hand: ~${handCardPts(me.hand)} card points${marTxt}. The talon adds ~3 cards of upside. Bidding much beyond ~${Math.floor(est / 10) * 10} is risky — fail the bid and you LOSE that many points.`;
        return `${state.players[state.bidTurn].name} is deciding whether to outbid ${state.currentBid}…`;
    }
    if (state.phase === 'talon') return 'The 3 talon cards are revealed to everyone, then join the bid winner\'s hand.';
    if (state.phase === 'exchange') {
        if (state.declarer === 0) return 'Pick 2 cards to give away — 1st goes to Vera, 2nd to Boris. Coach: dump 9s and Js, never split a K+Q pair (that\'s a future trump!), and keep aces.';
        return `${state.players[state.declarer].name} is choosing two cards to give away…`;
    }
    if (state.phase === 'play') {
        if (state.turn !== 0) return `${state.players[state.turn].name} is thinking…`;
        const legal = legalMoves(me.hand);
        if (state.trick.length === 0) {
            const mar = marriagesInHand(me.hand).filter(s => s !== state.trump);
            if (mar.length && canDeclare(0)) return `You lead. You hold K+Q of ${mar.map(s => SUIT_CHAR[s]).join(' ')} — lead one of them (tap twice) and declare to set trump and score +${MARRIAGE[mar[0]]}!`;
            if (mar.length) return `You lead. You hold a K+Q pair (${mar.map(s => SUIT_CHAR[s]).join(' ')}) but must WIN a trick before declaring it. An ace lead usually wins.`;
            return 'You lead — any card. Coach: aces almost always win their trick (11 pts); save weak cards for tricks you\'ve already lost.';
        }
        const winners = legal.filter(wouldWinNow);
        const led = state.trick[0].card.s;
        const mustTrump = !me.hand.some(c => c.s === led) && state.trump && me.hand.some(c => c.s === state.trump);
        let txt = mustTrump ? `No ${SUIT_CHAR[led]} — you must play a trump.` : `Follow ${suitName(led)} ${SUIT_CHAR[led]} if you can.`;
        if (winners.length) txt += ` Your ${cardLabel(winners.sort((a, b) => rankIdx(a) - rankIdx(b))[0])} would win the trick (${trickPts()} pts in it).`;
        else txt += ' You can\'t win this trick — dump your most worthless card (9 or J).';
        txt += ' Tap a card twice to play it.';
        return txt;
    }
    return '';
}

// ── Main render ──────────────────────────────────────────────────────────

export function render() {
    if (typeof document === 'undefined') return;   // unit tests run gameplay headless
    if (!state.players.length) return;
    // opponents
    $('opponents').innerHTML = [1, 2].map(p => {
        const pl = state.players[p];
        const active = (state.phase === 'bidding' && state.bidTurn === p) || (state.phase === 'play' && state.turn === p);
        const bidNote = state.phase === 'bidding' || state.phase === 'talon' ? state.bidLabel[p]
            : (p === state.declarer ? `👑 plays for ${state.currentBid}` : '');
            
        let boltText = '';
        if (state.settings.bolts && pl.bolts > 0) {
            boltText = '<span class="o-bolt">' + '⚡'.repeat(pl.bolts) + '</span>';
        }
        
        let scoreStr = pl.total;
        if (state.settings.hiddenPoints && state.phase !== 'dealEnd' && state.phase !== 'matchEnd') {
            scoreStr = '???';
        }
        
        const target = state.settings.targetScore || 1000;
        const barrelStr = (state.settings.barrel && pl.total === target - 120) ? ' 🛢️' : '';
        
        return `<div class="opp ${active ? 'active' : ''}">
            <div class="o-name">${pl.name}${boltText}${barrelStr}</div>
            <div class="o-info">🂠 ${pl.hand.length} · tricks ${pl.tricks} · deal pts ${pl.trickPts + pl.marriagePts}<br>score <strong>${scoreStr}</strong></div>
            <div class="o-bid">${bidNote}</div>
        </div>`;
    }).join('');

    // status
    const phaseTxt = {
        bidding: `Deal ${state.dealNum} · Bidding — high bid ${state.currentBid} (${state.players[state.highBidder]?.name ?? ''})`,
        talon: `Deal ${state.dealNum} · Talon revealed`,
        exchange: `Deal ${state.dealNum} · Exchange`,
        play: `Deal ${state.dealNum} · Trick ${Math.min(state.trickNum, 8)}/8`,
        dealEnd: `Deal ${state.dealNum} · Finished`,
        matchEnd: 'Match over',
    }[state.phase] || '';
    $('status').textContent = phaseTxt;

    // trump chip — during a trick it gains a second column naming the led suit
    const ledSuit = state.phase === 'play' && state.trick.length ? state.trick[0].card.s : null;
    const ledPart = ledSuit
        ? `<span class="t-part"><span class="t-suit ${SUIT_IS_RED[ledSuit] ? 'suit-red' : ''}">${SUIT_CHAR[ledSuit]}</span>led</span>`
        : '';
    const trumpPart = state.trump
        ? `<span class="t-part"><span class="t-suit ${SUIT_IS_RED[state.trump] ? 'suit-red' : ''}">${SUIT_CHAR[state.trump]}</span>trump</span>`
        : `<span class="t-part"><span class="t-suit" style="color:var(--muted)">—</span>no trump</span>`;
    $('trump-chip').innerHTML = ledPart + trumpPart;

    // table center: talon during bidding/talon, trick during play
    if (state.phase === 'bidding' || state.phase === 'talon') {
        $('trick-area').innerHTML = `
            <div style="display:flex;gap:0.5rem;align-items:center">
                ${state.talonUp ? state.talon.map(c => cardHTML(c)).join('') : state.talon.map(() => cardBackHTML()).join('')}
            </div>`;
    } else {
        // Lead marker on the leader's slot; winner pulse once the trick is full
        const ledP = state.trick.length ? state.trick[0].p : null;
        const winP = state.trick.length === 3 ? state.trick[trickWinnerSlot()].p : null;
        $('trick-area').innerHTML = [0, 1, 2].map(slotP => {
            const played = state.trick.find(t => t.p === slotOrder()[slotP]);
            const p = slotOrder()[slotP];
            return `<div class="slot">
                <div class="s-name">${state.players[p].name}${p === ledP ? '<span class="s-led">led</span>' : ''}</div>
                <div class="s-card">${played ? cardHTML(played.card, p === winP ? 'win-pulse' : '') : '<div class="s-empty"></div>'}</div>
            </div>`;
        }).join('');
    }

    // tip
    if (state.coach) {
        const t = coachText();
        $('tip').classList.toggle('hidden', !t);
        $('tip-text').textContent = t;
    } else {
        $('tip').classList.add('hidden');
    }

    // actions
    let actions = '';
    if (state.phase === 'bidding' && state.bidTurn === 0 && !state.passed[0]) {
        actions = `<button class="act-btn" id="act-bid">Bid ${state.currentBid + 10}</button>
                   <button class="act-btn secondary" id="act-pass">Pass</button>`;
    } else if (state.phase === 'exchange' && state.declarer === 0) {
        actions = `<button class="act-btn" id="act-give" ${state.give.length === 2 ? '' : 'disabled'}>Give cards</button>`;
    } else if (state.phase === 'play' && state.trickNum === 1 && state.trick.length === 0 && state.declarer === 0 && state.settings.reraise) {
        actions = `<button class="act-btn" id="act-reraise">Raise bid to ${state.currentBid + 10}</button>`;
    }
    $('actions').innerHTML = actions;

    // my info + hand
    const me = state.players[0];
    const myTurn = (state.phase === 'play' && state.turn === 0 && state.trick.length < 3);
    const exchanging = state.phase === 'exchange' && state.declarer === 0;
    
    let myBoltText = '';
    if (state.settings.bolts && me.bolts > 0) {
        myBoltText = '<span class="me-bolt">' + '⚡'.repeat(me.bolts) + '</span>';
    }
    const target = state.settings.targetScore || 1000;
    const myBarrel = (state.settings.barrel && me.total === target - 120) ? ' 🛢️' : '';
    
    $('me-info').innerHTML = `<span class="me-name">You ${state.declarer === 0 ? '👑' : ''}${myBoltText}${myBarrel}</span>
        <span>tricks ${me.tricks} · deal pts ${me.trickPts + me.marriagePts} · score <strong style="color:var(--text)">${me.total}</strong></span>`;

    const legal = myTurn ? legalMoves(me.hand).map(key) : null;
    $('hand').classList.toggle('crowded', me.hand.length > 8);
    $('hand').innerHTML = me.hand.map(c => {
        const k = key(c);
        let cls = '', give = '';
        if (myTurn && !legal.includes(k)) cls = 'dim';
        if (state.selected === k) cls += ' sel';
        if (exchanging) {
            const gi = state.give.indexOf(k);
            if (gi >= 0) { cls += ' sel'; give = gi === 0 ? '→ Vera' : '→ Boris'; }
        }
        return cardHTML(c, cls, give);
    }).join('');
}

// ── How-to overlay content ───────────────────────────────────────────────

export const HOWTO = [
    ['The goal', `<p>Tysiacha ("<span class="hl">a thousand</span>") is a classic 3-player card game from the Russian-speaking world. First player to <span class="hl">1000 points</span> (or 500 in Quick Match) wins.</p><p>You play against Vera and Boris. Each deal, you win points by taking <span class="hl">tricks</span> — and by declaring <span class="hl">marriages</span>.</p><p>The built-in 🧭 Hint bar explains every situation. This overlay reopens with the <span class="hl">Rules</span> button.</p>`],
    ['The cards', `<p>Only 24 cards are used: <span class="hl">9, J, Q, K, 10, A</span> in each suit.</p><p>Card strength (high → low): <span class="hl">A, 10, K, Q, J, 9</span> — yes, the 10 beats the King!</p><p>Each card is worth points:<br>A = <span class="hl">11</span> · 10 = <span class="hl">10</span> · K = <span class="hl">4</span> · Q = <span class="hl">3</span> · J = <span class="hl">2</span> · 9 = <span class="hl">0</span></p><p>There are 120 card points in every deal. (Point values are printed in the card corner.)</p>`],
    ['Bidding', `<p>Each deal starts with an <span class="hl">auction</span>: how many points do you promise to win this deal? Bidding starts at 100 (forced) and rises in tens.</p><p>The winner (the <span class="hl">declarer</span> 👑) takes the 3-card <span class="hl">talon</span>, then gives one unwanted card to each opponent.</p><p><span class="hl">Make the bid → +bid points. Fail → −bid points.</span> Defenders always keep whatever points they win. Bid boldly, but only if your hand can deliver.</p>`],
    ['Tricks', `<p>The declarer leads a card; the others each add one. You <span class="hl">must follow the led suit</span> if you can; with none, you <span class="hl">must play a trump</span> if you have one.</p><p>Highest card of the led suit wins — unless a <span class="hl">trump</span> was played; then the highest trump wins. The winner collects the points and leads next.</p><p>Illegal cards are dimmed in your hand — you can't misplay. Tap a card once to raise it, twice to play it.</p>`],
    ['Marriages 💍', `<p>Holding both <span class="hl">K + Q of one suit</span> is a "marriage". When it's your turn to <span class="hl">lead</span> (after you've won at least one trick), lead the K or Q and declare it:</p><p>· that suit becomes <span class="hl">trump</span> immediately<br>· you instantly score: <span class="suit-red">♥</span> = <span class="hl">100</span> · <span class="suit-red">♦</span> = <span class="hl">80</span> · ♣ = <span class="hl">60</span> · ♠ = <span class="hl">40</span></p><p>A new marriage overrides the old trump. Marriages are the engine of big bids — protect those K+Q pairs!</p>`],
    ['Classic Rules', `<p>Toggle advanced rules in the ⚙️ Settings menu.</p><p><span class="hl">The Barrel:</span> A player at 880 pts (or 380) sits on the barrel. They must win the bid to win the match. 3 fails drops them 120 pts.</p><p><span class="hl">Bolts ⚡:</span> Taking 0 tricks gives a bolt. 3 bolts = −120 penalty.</p><p><span class="hl">Raspasy:</span> If all pass, play a negative round where tricks lose points.</p><p><span class="hl">Re-raise:</span> Declarer can raise bid after talon.</p>`],
];
