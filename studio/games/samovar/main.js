// Samovar — the only file here that touches the document.
//
// It measures how long the pour button is held, in real time, and hands the
// amounts to the pure rules in gameplay.js. One loop paints the cup and runs
// the result timer; it stands still while the page is hidden or the settings
// drawer is open.

import { BEST_KEY, CUPS, EVENING_LENGTH, RESULT_MS } from './constants.js';
import { cssColour, judge, levelOf, pourAmount, ratioOf, spilled, verdictLine } from './gameplay.js';
import { makeEvening, readBest } from './state.js';

// --- Storage -----------------------------------------------------------------
// One key, a literal, documented in ../../README.md. Blocked site data must not
// stop the tea: every call is wrapped.

function readStoredBest() {
  try { return readBest(localStorage.getItem('studio_samovar_best')); } catch { return 0; }
}

function writeStoredBest(value) {
  try { localStorage.setItem('studio_samovar_best', String(value)); } catch { /* blocked: keep it for this visit */ }
}

// --- Session -----------------------------------------------------------------

const el = id => document.getElementById(id);

const s = {
  guests: [],
  index: 0,
  results: [],
  phase: 'brew',        // 'brew' | 'water' | 'result' | 'end'
  brew: 0,
  water: 0,
  pour: null,           // { liquid: 'brew'|'water', start: ms, base: units }
  pointer: null,        // the pointer holding the button, if one is
  resultLeft: 0,
  paused: false,        // hidden || drawer: either one holds the evening
  hidden: false,
  drawer: false,
  keyFocus: false,      // the button had the keyboard's focus when a result card disabled it
  lastFrame: 0,
  best: 0,
  evenings: 0
};

function guest() { return s.guests[s.index]; }

function startEvening() {
  s.guests = makeEvening();
  s.index = 0;
  s.results = [];
  s.evenings += 1;
  el('end').hidden = true;
  startGuest();
}

function startGuest() {
  const g = guest();
  s.phase = 'brew';
  s.brew = 0;
  s.water = 0;
  s.pour = null;
  el('result').hidden = true;
  const cup = el('cup');
  cup.classList.remove('spilled');
  cup.style.setProperty('--cup-h', String(g.cup.height));
  cup.style.setProperty('--cup-aspect', String(g.cup.width / g.cup.height * CUP_SHAPE));
  cup.setAttribute('aria-label', `${capital(g.cup.name)}, empty`);
  el('swatch').style.background = cssColour(g.strength.ratio);
  el('wants-word').textContent = g.strength.word;
  el('guest').textContent = `Guest ${s.index + 1} of ${EVENING_LENGTH} · ${g.cup.name}`;
  setData();
  paint();
}

/** The table is wider than it is tall on most phones' stage; this keeps cups cup-shaped. */
const CUP_SHAPE = 1.3;

function capital(text) { return text.charAt(0).toUpperCase() + text.slice(1); }

// --- Pouring -----------------------------------------------------------------

function now() { return performance.now(); }

/** What is in the cup at time `t`, the pour in progress included. */
function amounts(t = now()) {
  let { brew, water } = s;
  if (s.pour) {
    const more = pourAmount(t - s.pour.start);
    if (s.pour.liquid === 'brew') brew = s.pour.base + more; else water = s.pour.base + more;
  }
  return { brew, water };
}

function press() {
  if (s.paused || s.pour || (s.phase !== 'brew' && s.phase !== 'water')) return;
  s.pour = { liquid: s.phase, start: now(), base: s.phase === 'brew' ? s.brew : s.water };
  setData();
  paint();
}

/** Ends the pour in progress at time `t`. Returns whether one was running. */
function stopPour(t = now()) {
  if (!s.pour) return false;
  const a = amounts(t);
  s.brew = a.brew;
  s.water = a.water;
  s.pour = null;
  return true;
}

/** The player let go: brew moves on to water, water serves the cup. */
function release() {
  const liquid = s.pour?.liquid;
  if (!stopPour()) return;
  const g = guest();
  if (spilled(s.brew, s.water, g.cup.volume)) return serve();
  if (liquid === 'brew') {
    s.phase = 'water';
    setData();
    paint();
  } else {
    serve();
  }
}

/** Anything that is not the player letting go: the pour stops, the cup waits. */
function interrupt() {
  if (stopPour()) {
    setData();
    paint();
  }
  s.pointer = null;
}

function serve() {
  const g = guest();
  const result = judge({ brew: s.brew, water: s.water, volume: g.cup.volume, wanted: g.strength.ratio });
  s.results.push(result);
  s.phase = 'result';
  s.resultLeft = RESULT_MS;
  if (result.spilled) el('cup').classList.add('spilled');

  el('result-wanted').style.background = cssColour(g.strength.ratio);
  el('result-poured').style.background = cssColour(result.ratio);
  el('result-stars').textContent = starText(result.stars);
  el('result-stars').setAttribute('aria-label', `${result.stars} of 3 stars`);
  el('result-line').textContent = verdictLine(result);
  el('result').dataset.stars = String(result.stars);
  el('result').hidden = false;
  setData();
  paint();
}

function starText(n) { return '★'.repeat(n) + '☆'.repeat(3 - n); }

function nextGuest() {
  if (s.index + 1 < EVENING_LENGTH) {
    s.index += 1;
    startGuest();
  } else {
    endEvening();
  }
}

function endEvening() {
  s.phase = 'end';
  el('result').hidden = true;
  const total = s.results.reduce((sum, r) => sum + r.stars, 0);
  const before = s.best;
  const newBest = total > before;
  if (newBest) {
    s.best = total;
    writeStoredBest(total);
  }
  el('end-total').textContent = `${total} of ${EVENING_LENGTH * 3} stars`;
  el('end-best').textContent = newBest && before > 0
    ? `Your best evening yet (the last best was ${before}).`
    : `Best evening: ${s.best}.`;
  el('end-cups').innerHTML = s.results
    .map((r, i) => `<li title="Cup ${i + 1}">${r.spilled ? '×' : r.stars}</li>`).join('');
  el('end').dataset.total = String(total);
  el('end').hidden = false;
  setData();
  paint();
  el('again').focus({ preventScroll: true });
}

// --- Painting ----------------------------------------------------------------

const LABELS = {
  brew: 'Hold to pour the tea',
  water: 'Hold to add hot water',
  result: 'Serving…',
  end: 'Evening over'
};

function hintFor() {
  if (s.phase === 'brew' && s.index === 0 && s.evenings === 1 && s.brew === 0) {
    return 'Hold the button to pour the dark tea, and let go. Hold again to top up with hot water, and let go to serve.';
  }
  if (s.phase === 'brew') return 'Match the colour they want. Pour the tea first: the water can only make it paler.';
  if (s.phase === 'water') return 'Top up to the dashed line, under the brim. Let go to serve.';
  if (s.phase === 'result') return '';
  return 'Pour another evening, or take a break.';
}

function paint(t = now()) {
  const g = guest();
  if (!g) return;
  const { brew, water } = amounts(t);
  const level = Math.min(1.08, levelOf(brew, water, g.cup.volume));
  const liquid = el('liquid');
  liquid.style.height = `${Math.min(100, level * 100)}%`;
  liquid.style.background = brew + water > 0 ? cssColour(ratioOf(brew, water)) : 'transparent';

  const stream = el('stream');
  if (s.pour) {
    const stage = el('stage').getBoundingClientRect();
    const cup = el('cup').getBoundingClientRect();
    const surface = cup.bottom - Math.min(1, level) * cup.height;
    stream.style.height = `${Math.max(0, surface - stage.top)}px`;
    stream.style.background = s.pour.liquid === 'brew' ? cssColour(0.85) : 'var(--water)';
    stream.classList.add('on');
  } else {
    stream.classList.remove('on');
  }

  const pour = el('pour');
  pour.textContent = LABELS[s.phase];
  const disabled = s.phase === 'result' || s.phase === 'end';
  if (disabled && !pour.disabled && document.activeElement === pour) s.keyFocus = true;
  pour.disabled = disabled;
  // Disabling the button drops focus to the page; a keyboard player gets it back
  // with the next guest instead of a Tab before every cup (sprint 08 review, IR08-4).
  if (!disabled && s.keyFocus) {
    s.keyFocus = false;
    if (!s.drawer && (document.activeElement === document.body || !document.activeElement)) {
      pour.focus({ preventScroll: true });
    }
  }
  pour.classList.toggle('pouring', !!s.pour);
  const hint = hintFor();
  if (el('hint').textContent !== hint) el('hint').textContent = hint;

  const stars = s.results.reduce((sum, r) => sum + r.stars, 0);
  const score = `★ ${stars}`;
  if (el('score').textContent !== score) el('score').textContent = score;
}

/** State a reader (or a test) can see without reaching into the module. */
function setData() {
  const g = guest();
  const game = el('game');
  game.dataset.phase = s.phase;
  game.dataset.guest = String(s.index + 1);
  game.dataset.volume = String(g.cup.volume);
  game.dataset.cup = g.cup.id;
  game.dataset.wanted = String(g.strength.ratio);
  game.dataset.brew = s.brew.toFixed(2);
  game.dataset.water = s.water.toFixed(2);
  game.dataset.pouring = s.pour ? s.pour.liquid : '';
  game.dataset.best = String(s.best);
}

// --- The loop ----------------------------------------------------------------

function frame(t) {
  const dt = Math.min(100, Math.max(0, t - (s.lastFrame || t)));
  s.lastFrame = t;
  if (!s.paused) {
    if (s.pour) {
      const g = guest();
      const a = amounts(t);
      if (spilled(a.brew, a.water, g.cup.volume)) {
        stopPour(t);
        s.pointer = null;
        serve();
      }
    }
    if (s.phase === 'result') {
      s.resultLeft -= dt;
      if (s.resultLeft <= 0) nextGuest();
    }
    paint(t);
  }
  requestAnimationFrame(frame);
}

// Two things pause the evening, and each lets go only of its own hold: showing
// the page again must not start the result timer behind an open drawer
// (sprint 08 review, IR08-3).
function hold(reason, on) {
  s[reason] = on;
  const was = s.paused;
  s.paused = s.hidden || s.drawer;
  if (s.paused) interrupt();
  else if (was) s.lastFrame = 0;
}

// --- Input -------------------------------------------------------------------

function wire() {
  const pour = el('pour');
  pour.addEventListener('pointerdown', e => {
    if (s.pointer !== null || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault();
    s.pointer = e.pointerId;
    try { pour.setPointerCapture(e.pointerId); } catch { /* the pointer is gone already */ }
    press();
  });
  const up = e => {
    if (e.pointerId !== s.pointer) return;
    s.pointer = null;
    release();
  };
  pour.addEventListener('pointerup', up);
  pour.addEventListener('pointercancel', e => { if (e.pointerId === s.pointer) interrupt(); });
  pour.addEventListener('lostpointercapture', up);
  pour.addEventListener('contextmenu', e => e.preventDefault());

  // Keyboard: Space or Enter held on the focused button is a hold.
  pour.addEventListener('keydown', e => {
    if ((e.key === ' ' || e.key === 'Enter')) {
      e.preventDefault();
      if (!e.repeat && s.pointer === null) { s.pointer = 'key'; press(); }
    }
  });
  pour.addEventListener('keyup', e => {
    if ((e.key === ' ' || e.key === 'Enter') && s.pointer === 'key') {
      e.preventDefault();
      s.pointer = null;
      release();
    }
  });
  pour.addEventListener('blur', () => { if (s.pointer === 'key') interrupt(); });

  el('again').addEventListener('click', () => {
    startEvening();
    el('pour').focus({ preventScroll: true });
  });

  document.addEventListener('visibilitychange', () => hold('hidden', document.hidden));
  window.addEventListener('blur', () => interrupt());
  window.addEventListener('settingsOpened', () => hold('drawer', true));
  window.addEventListener('settingsClosed', () => hold('drawer', false));
}

// --- Boot --------------------------------------------------------------------

function boot() {
  s.best = readStoredBest();
  el('game').hidden = false;
  el('screen').classList.add('playing');
  wire();
  startEvening();
  requestAnimationFrame(frame);
}

boot();

// Exposed for tests and curious readers; nothing in the page reads it.
export { s as session, startGuest as showGuest, CUPS, BEST_KEY };
