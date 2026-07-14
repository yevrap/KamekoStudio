// ═══════════════════════════════════════════════════════════════════════════
// GAMEPLAY — session/question state transitions + scoring math.
//            Calls into ui.js to re-render after every state change (one-way
//            dependency: ui.js never imports this module, so there's no cycle).
// ═══════════════════════════════════════════════════════════════════════════

import { SIGNS, ELEMENTS, MODS, PLANETS, oppOf, compatible, birthdayFor, shuffle, rnd, pick } from './constants.js';
import { HAPPY, FORTUNES } from './constants.js';
import { G, setG, TOTAL_GUESTS, isPaused, reportSessionStars } from './state.js';
import { renderCard, updateHud, renderEnd, setWheelActive } from './ui.js';

/* ---------------- scoring (pure, unit-tested) ---------------- */

export function computeScore(correct, tries, streak, bestStreak) {
    const earned = correct ? (tries === 1 ? 2 : 1) : 0;
    let newStreak = streak;
    let newBestStreak = bestStreak;
    let bonus = 0;
    if (correct) {
        if (tries === 1) {
            newStreak = streak + 1;
            newBestStreak = Math.max(bestStreak, newStreak);
        } else {
            newStreak = 0;
        }
        if (newStreak > 0 && newStreak % 3 === 0) bonus = 1;
    } else {
        newStreak = 0;
    }
    return { earned, bonus, newStreak, newBestStreak };
}

/* ---------------- session lifecycle ---------------- */

export function newSession() {
    setG({
        guests: shuffle(SIGNS).slice(0, TOTAL_GUESTS),
        qTypes: shuffle(['element', 'modality', 'planet', 'opposite', 'compat']),
        idx: -1,
        stars: 0, streak: 0, bestStreak: 0, firstTries: 0, questions: 0,
        phase: null, done: false,
    });
    updateHud();
    nextGuest();
}

export function nextGuest() {
    G.idx++;
    if (G.idx >= TOTAL_GUESTS) return endSession();
    const sign = G.guests[G.idx];
    const [bm, bd] = birthdayFor(sign);
    G.client = { sign, bm, bd };
    G.revealed = false;
    startQuestion('sign');
}

// set up per-question state, then render
export function startQuestion(type) {
    const c = G.client;
    G.phase = type;
    G.tries = 0;
    G.answered = false;
    G.wrongKeys = [];
    G.chipHint = false;
    G.wheelHint = false;
    G.lastWrongWedge = null;
    G.chipKeys = null;
    G.preview = null; // read-then-confirm: wedge being inspected, not yet committed
    G.happyIdx = rnd(HAPPY.en.length);

    if (type === 'sign') {
        G.answer = c.sign.id;
    } else if (type === 'element') {
        G.answer = c.sign.el;
        G.chipKeys = Object.keys(ELEMENTS);
    } else if (type === 'modality') {
        G.answer = c.sign.mod;
        G.chipKeys = Object.keys(MODS);
    } else if (type === 'planet') {
        G.answer = c.sign.planet;
        const others = shuffle(Object.keys(PLANETS).filter(p => p !== c.sign.planet)).slice(0, 3);
        G.chipKeys = shuffle([c.sign.planet, ...others]);
    } else if (type === 'opposite') {
        G.answer = oppOf(c.sign).id;
    } else if (type === 'compat') {
        G.partner = pick(SIGNS.filter(s => s.id !== c.sign.id));
        G.answer = compatible(c.sign, G.partner) ? 'yes' : 'no';
        G.chipKeys = ['yes', 'no'];
    }
    renderCard();
}

/* ---------------- answering ---------------- */

function resolve(correct) {
    G.questions++;
    const { earned, bonus, newStreak, newBestStreak } = computeScore(correct, G.tries, G.streak, G.bestStreak);
    if (correct && G.tries === 1) G.firstTries++;
    G.streak = newStreak;
    G.bestStreak = newBestStreak;
    G.stars += earned + bonus;
    G.lastBonus = bonus;
    G.answered = true;
    G.lastCorrect = correct;
    G.lastEarned = earned;
    if (G.phase === 'sign') G.revealed = true;
    updateHud(correct && earned > 0);
    renderCard();
}

export function onWheelTap(sign) {
    if (!G || G.done || G.answered || isPaused()) return;
    if (G.phase !== 'sign' && G.phase !== 'opposite') return;
    // read-then-confirm: first tap shows the sign big in the hub, second commits
    if (G.preview !== sign.id) {
        G.preview = sign.id;
        renderCard();
        return;
    }
    G.preview = null;
    G.tries++;
    if (sign.id === G.answer) {
        resolve(true);
    } else if (G.tries >= 2) {
        G.lastWrongWedge = sign.id;
        resolve(false);
    } else {
        G.wheelHint = true;
        renderCard();
    }
}

export function onChipTap(key) {
    if (!G || G.done || G.answered || isPaused()) return;
    if (G.wrongKeys.includes(key)) return;
    G.tries++;
    if (key === G.answer) {
        resolve(true);
    } else if (G.tries >= 2) {
        G.wrongKeys.push(key);
        resolve(false);
    } else {
        G.wrongKeys.push(key);
        G.chipHint = true;
        renderCard();
    }
}

export function onContinue() {
    if (isPaused()) return;
    if (G.phase === 'sign') startQuestion(G.qTypes[G.idx]);
    else nextGuest();
}

/* ---------------- session end ---------------- */

function endSession() {
    G.done = true;
    G.fortuneIdx = rnd(FORTUNES.en.length);
    G.bestStars = reportSessionStars(G.stars);
    setWheelActive(false);
    renderEnd();
}
