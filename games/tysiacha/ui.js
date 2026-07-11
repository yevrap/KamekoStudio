// ═══════════════════════════════════════════════════════════════════════════
// UI — all DOM rendering: hand, field, scoreboard, overlays, coach bar,
//       card dimming, two-tap play. Also coach text generation.
//       Every user-facing string comes from the i18n table; localizeStatic()
//       re-labels the static chrome so a language switch applies live.
// ═══════════════════════════════════════════════════════════════════════════

import {
    SUITS, SUIT_CHAR, SUIT_IS_RED, RANKS, PTS, MARRIAGE, TARGET,
    key, rankIdx, handCardPts, marriagesInHand
} from './constants.js';
import {
    state, legalMoves, wouldWinNow, trickPts, canDeclare, trickWinnerSlot
} from './state.js';
import { eventText } from './log.js';
import { t, playerName, rankText, cardText } from './i18n.js';

// ── DOM ref cache ────────────────────────────────────────────────────────

const $ = id => document.getElementById(id);

export function animateSweepToWinner(winnerPlayerIdx, onComplete) {
    if (typeof document === 'undefined') return onComplete();

    let targetEl;
    if (winnerPlayerIdx === 0) {
        targetEl = $('me-info');
    } else {
        targetEl = $('opponents').children[winnerPlayerIdx === 1 ? 0 : 1];
    }
    if (!targetEl) return onComplete();

    const targetRect = targetEl.getBoundingClientRect();
    const trickArea = $('trick-area');
    const cards = trickArea.querySelectorAll('.card');
    if (cards.length === 0) return onComplete();

    let animated = 0;
    cards.forEach(el => {
        const startRect = el.getBoundingClientRect();
        const ghost = el.cloneNode(true);
        ghost.style.position = 'absolute';
        ghost.style.left = startRect.left + 'px';
        ghost.style.top = startRect.top + 'px';
        ghost.style.margin = '0';
        ghost.style.zIndex = '100';
        ghost.classList.remove('win-pulse');
        document.body.appendChild(ghost);

        el.style.opacity = '0';

        const dx = (targetRect.left + targetRect.width / 2) - (startRect.left + startRect.width / 2);
        const dy = (targetRect.top + targetRect.height / 2) - (startRect.top + startRect.height / 2);

        void ghost.offsetWidth; // force reflow
        
        ghost.classList.add('sweep-animating');
        ghost.style.transform = `translate(${dx}px, ${dy}px) scale(0.6)`;
        ghost.style.opacity = '0';

        setTimeout(() => {
            if (document.body.contains(ghost)) document.body.removeChild(ghost);
            animated++;
            if (animated === cards.length) onComplete();
        }, 400);
    });
}

// ── Card HTML ────────────────────────────────────────────────────────────

export function cardHTML(c, extra = '', give = '') {
    return `<div class="card ${SUIT_IS_RED[c.s] ? 'red' : ''} ${extra}" data-k="${key(c)}">
        ${give ? `<span class="c-give">${give}</span>` : ''}
        <div class="c-corner">${rankText(c.r)}<br>${SUIT_CHAR[c.s]}</div>
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
        if (state.passed[0]) return t('coach.passed');
        const mar = marriagesInHand(me.hand);
        const marTxt = mar.length ? t('coach.marriages', mar) : t('coach.noMarriage');
        const est = handCardPts(me.hand) + mar.reduce((tot, s) => tot + MARRIAGE[s], 0) + 15;
        if (state.bidTurn === 0) return t('coach.bidTurn', handCardPts(me.hand), marTxt, Math.floor(est / 10) * 10);
        return t('coach.bidWait', playerName(state.bidTurn), state.currentBid);
    }
    if (state.phase === 'talon') return t('coach.talon');
    if (state.phase === 'exchange') {
        if (state.declarer === 0) return t('coach.exchange', playerName(1), playerName(2));
        return t('coach.exchangeWait', playerName(state.declarer));
    }
    if (state.phase === 'play') {
        if (state.turn !== 0) return t('coach.thinking', playerName(state.turn));
        const legal = legalMoves(me.hand);
        if (state.trick.length === 0) {
            const mar = marriagesInHand(me.hand).filter(s => s !== state.trump);
            if (mar.length && canDeclare(0)) return t('coach.leadDeclare', mar);
            if (mar.length) return t('coach.leadLocked', mar);
            return t('coach.lead');
        }
        const winners = legal.filter(wouldWinNow);
        const led = state.trick[0].card.s;
        const mustTrump = !me.hand.some(c => c.s === led) && state.trump && me.hand.some(c => c.s === state.trump);
        let txt = mustTrump ? t('coach.mustTrump', led) : t('coach.follow', led);
        if (winners.length) txt += t('coach.wouldWin', cardText(winners.sort((a, b) => rankIdx(a) - rankIdx(b))[0]), trickPts());
        else txt += t('coach.cantWin');
        txt += t('coach.tapTwice');
        return txt;
    }
    return '';
}

// ── Game log drawer ──────────────────────────────────────────────────────

const colorSuits = txt => txt.replace(/[♥♦]/g, m => `<span class="suit-red">${m}</span>`);

export function renderLog() {
    if (typeof document === 'undefined') return;
    const body = $('lg-body');
    if (!body) return;
    if (!state.log.length) {
        body.innerHTML = `<p class="lg-empty">${t('log.empty')}</p>`;
        return;
    }
    const deals = [...new Set(state.log.map(e => e.deal))];
    body.innerHTML = deals.map(d => {
        // Completed tricks render as audit rows (cards in play order, leader
        // first, winner highlighted); other events stay chronological lines.
        const lines = [];
        let plays = [];
        for (const e of state.log.filter(x => x.deal === d)) {
            if (e.type === 'play') { plays.push(e); continue; }
            if (e.type === 'trick-won') { lines.push(trickRowHTML(plays, e)); plays = []; continue; }
            lines.push(`<div class="lg-line lg-${e.type}">${colorSuits(eventText(e))}</div>`);
        }
        plays.forEach(e =>   // trick still in progress
            lines.push(`<div class="lg-line lg-play">${colorSuits(eventText(e))}</div>`));
        return `<details class="lg-deal"${d === state.dealNum ? ' open' : ''}><summary>${t('log.deal', d)}</summary>${lines.join('')}</details>`;
    }).join('');
    body.scrollTop = body.scrollHeight;   // newest events sit at the bottom
}

function trickRowHTML(plays, won) {
    const cards = plays.map(e =>
        `<span class="lg-card${SUIT_IS_RED[e.card.s] ? ' red' : ''}${e.p === won.p ? ' win' : ''}">
            <b>${cardText(e.card)}</b><i>${playerName(e.p)}${e.isLead ? ' · ' + t('slot.led') : ''}</i>
        </span>`).join('');
    return `<div class="lg-line lg-trickrow">
        <span class="lg-tno">T${won.trick}</span>${cards}
        <span class="lg-res">${playerName(won.p)} +${won.pts}<i>${colorSuits(t('reason.short.' + won.reason.kind, won.reason))}</i></span>
    </div>`;
}

// ── Static chrome ────────────────────────────────────────────────────────
// Re-labels everything that lives in index.html rather than in render().
// Called at boot and whenever the language changes. Drawer content is
// injected per-open, so it has its own pass: localizeDrawer(), called from
// the drawer render in main.js. Both use setText — a missing element must
// never abort localization (that crash took down boot and every drawer
// binding after the Drawer API migration).

const setText = (id, txt) => { const el = $(id); if (el) el.textContent = txt; };
const setHTML = (id, html) => { const el = $(id); if (el) el.innerHTML = html; };

export function localizeStatic() {
    if (typeof document === 'undefined') return;
    document.title = t('title');
    setText('title-name', t('title'));
    setText('title-sub', t('subtitle', state.settings.targetScore || 1000));
    setText('ht-title', t('howto.title'));
    setText('lg-title', t('log.title'));
    setText('marry-title', t('marry.title'));
    setText('marry-no', t('marry.no'));
    setText('marry-yes', t('marry.yes'));
    setText('sum-log', t('sum.review'));
    // New Match setup overlay (static markup in index.html)
    setText('setup-title', t('setup.title'));
    setText('set-names-hdr', t('set.namesHdr'));
    for (let p = 0; p < 3; p++) {
        setText('lbl-name-' + p, t('name' + p));
        const inp = $('set-name-' + p);
        if (inp) inp.placeholder = t('name' + p);
    }
    setText('set-match-hdr', t('set.matchHdr'));
    setText('lbl-target', t('set.target'));
    setText('opt-500', t('set.target500'));
    setText('opt-1000', t('set.target1000'));
    setText('set-rules-hdr', t('set.rulesHdr'));
    for (const k of ['barrel', 'bolts', 'rounding', 'reraise', 'raspasy', 'hidden']) {
        setHTML('lbl-' + k, t('set.' + k));
    }
}

export function localizeDrawer() {
    if (typeof document === 'undefined') return;
    setText('lbl-lang', t('set.lang'));
    setText('lbl-diff', t('set.diff'));
    setText('lbl-sound', t('set.sound'));
    setText('lbl-tap-to-play', t('set.tapToPlay'));
    setText('opt-diff-easy', t('set.diffEasy'));
    setText('opt-diff-normal', t('set.diffNormal'));
    setText('opt-diff-hard', t('set.diffHard'));
}

// ── Main render ──────────────────────────────────────────────────────────

function bidLabelText(lbl) {
    if (!lbl) return '';
    return lbl.kind === 'pass' ? t('lbl.passed') : t('lbl.bid', lbl.amount);
}

export function render() {
    if (typeof document === 'undefined') return;   // unit tests run gameplay headless
    if (!state.players.length) return;
    
    // --- FLIP First Phase ---
    const oldRects = {};
    document.querySelectorAll('.card').forEach(el => {
        if (el.dataset.k) oldRects[el.dataset.k] = el.getBoundingClientRect();
    });

    // opponents
    $('opponents').innerHTML = [1, 2].map(p => {
        const pl = state.players[p];
        const active = (state.phase === 'bidding' && state.bidTurn === p) || (state.phase === 'play' && state.turn === p);
        const bidNote = state.phase === 'bidding' || state.phase === 'talon' ? bidLabelText(state.bidLabel[p])
            : (p === state.declarer ? t('lbl.playsFor', state.currentBid) : '');

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
            <div class="o-name">${playerName(p)}${boltText}${barrelStr}</div>
            <div class="o-info">🂠 ${pl.hand.length} · ${t('info.opp', pl.tricks, pl.trickPts + pl.marriagePts)}<br>${t('info.score')} <strong>${scoreStr}</strong></div>
            <div class="o-bid">${bidNote}</div>
        </div>`;
    }).join('');

    // status
    const phaseTxt = {
        bidding: () => t('phase.bidding', state.dealNum, state.currentBid, state.highBidder !== null ? playerName(state.highBidder) : ''),
        talon: () => t('phase.talon', state.dealNum),
        exchange: () => t('phase.exchange', state.dealNum),
        play: () => t('phase.play', state.dealNum, Math.min(state.trickNum, 8)),
        dealEnd: () => t('phase.dealEnd', state.dealNum),
        matchEnd: () => t('phase.matchEnd'),
    }[state.phase];
    $('status').textContent = phaseTxt ? phaseTxt() : '';

    // trump chip — during a trick it gains a second column naming the led suit
    const ledSuit = state.phase === 'play' && state.trick.length ? state.trick[0].card.s : null;
    const ledPart = ledSuit
        ? `<span class="t-part"><span class="t-suit ${SUIT_IS_RED[ledSuit] ? 'suit-red' : ''}">${SUIT_CHAR[ledSuit]}</span>${t('chip.led')}</span>`
        : '';
    const trumpPart = state.trump
        ? `<span class="t-part"><span class="t-suit ${SUIT_IS_RED[state.trump] ? 'suit-red' : ''}">${SUIT_CHAR[state.trump]}</span>${t('chip.trump')}</span>`
        : `<span class="t-part"><span class="t-suit" style="color:var(--muted)">—</span>${t('chip.noTrump')}</span>`;
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
            const played = state.trick.find(x => x.p === slotOrder()[slotP]);
            const p = slotOrder()[slotP];
            return `<div class="slot">
                <div class="s-name">${playerName(p)}${p === ledP ? `<span class="s-led">${t('slot.led')}</span>` : ''}</div>
                <div class="s-card">${played ? cardHTML(played.card, p === winP ? 'win-pulse' : '') : '<div class="s-empty"></div>'}</div>
            </div>`;
        }).join('');
    }

    // tip
    if (state.coach) {
        const txt = coachText();
        $('tip').classList.toggle('hidden', !txt);
        $('tip-text').textContent = txt;
    } else {
        $('tip').classList.add('hidden');
    }

    // actions
    let actions = '';
    if (state.phase === 'bidding' && state.bidTurn === 0 && !state.passed[0]) {
        actions = `<button class="act-btn" id="act-bid">${t('act.bid', state.currentBid + 10)}</button>
                   <button class="act-btn secondary" id="act-pass">${t('act.pass')}</button>`;
    } else if (state.phase === 'exchange' && state.declarer === 0) {
        actions = `<button class="act-btn" id="act-give" ${state.give.length === 2 ? '' : 'disabled'}>${t('act.give')}</button>`;
    } else if (state.phase === 'play' && state.trickNum === 1 && state.trick.length === 0 && state.declarer === 0 && state.settings.reraise) {
        // If a card is selected in reraise phase, we don't show the reraise button since we replaced the action bar.
        // But let's check selection first.
    }
    
    // 1-Tap Play / Marriage Selection logic
    if (state.phase === 'play' && state.turn === 0 && state.trick.length < 3 && state.selected) {
        const cStr = state.selected;
        const c = state.players[0].hand.find(x => key(x) === cStr);
        if (c) {
            const isLead = state.trick.length === 0;
            const partnerRank = c.r === 'K' ? 'Q' : c.r === 'Q' ? 'K' : null;
            const hasPartner = partnerRank && state.players[0].hand.some(x => x.s === c.s && x.r === partnerRank);
            if (isLead && hasPartner && canDeclare(0) && state.trump !== c.s) {
                actions = `<button class="act-btn" id="act-play-card">${t('marry.no')}</button>
                           <button class="act-btn" id="act-declare" style="background:var(--gold)">${t('marry.yes')}</button>`;
            } else if (!state.settings.tapToPlay) {
                actions = `<button class="act-btn" id="act-play-card">${t('act.playCard')}</button>`;
            }
        }
    } else if (state.phase === 'play' && state.trickNum === 1 && state.trick.length === 0 && state.declarer === 0 && state.settings.reraise) {
        actions = `<button class="act-btn" id="act-reraise">${t('act.reraise', state.currentBid + 10)}</button>`;
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

    $('me-info').innerHTML = `<span class="me-name">${playerName(0)} ${state.declarer === 0 ? '👑' : ''}${myBoltText}${myBarrel}</span>
        <span>${t('info.me', me.tricks, me.trickPts + me.marriagePts)} <strong style="color:var(--text)">${me.total}</strong></span>`;

    // keep an open log drawer live
    const lb = $('logbook');
    if (lb && !lb.classList.contains('hidden')) renderLog();

    const legal = myTurn ? legalMoves(me.hand).map(key) : null;
    $('hand').classList.toggle('crowded', me.hand.length > 8);
    $('hand').innerHTML = me.hand.map(c => {
        const k = key(c);
        let cls = '', give = '';
        if (myTurn && !legal.includes(k)) cls = 'dim';
        if (state.selected === k) cls += ' sel';
        if (exchanging) {
            const gi = state.give.indexOf(k);
            if (gi >= 0) { cls += ' sel'; give = t('give.to', playerName(gi === 0 ? 1 : 2)); }
        }
        return cardHTML(c, cls, give);
    }).join('');

    // --- FLIP Last & Invert Phase ---
    const animatingEls = [];
    document.querySelectorAll('.card').forEach(el => {
        const oldRect = oldRects[el.dataset.k];
        if (oldRect) {
            const newRect = el.getBoundingClientRect();
            const dx = oldRect.left - newRect.left;
            const dy = oldRect.top - newRect.top;
            if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
                el.style.setProperty('--flip-dx', dx + 'px');
                el.style.setProperty('--flip-dy', dy + 'px');
                animatingEls.push(el);
            }
        }
    });

    // --- FLIP Play Phase ---
    if (animatingEls.length) {
        void document.body.offsetHeight; // force reflow
        animatingEls.forEach(el => {
            el.classList.add('flip-animating');
            el.style.setProperty('--flip-dx', '0px');
            el.style.setProperty('--flip-dy', '0px');
            const cleanup = (e) => {
                if (e.target === el && e.propertyName === 'transform') {
                    el.removeEventListener('transitionend', cleanup);
                    el.classList.remove('flip-animating');
                    el.style.removeProperty('--flip-dx');
                    el.style.removeProperty('--flip-dy');
                }
            };
            el.addEventListener('transitionend', cleanup);
            setTimeout(() => cleanup({target: el, propertyName: 'transform'}), 350); 
        });
    }
}
