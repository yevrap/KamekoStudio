// Samovar — the only file here that touches the document.
//
// It measures how long the pour button is held, in real time, and hands the
// amounts to the pure rules in gameplay.js. One loop paints the cup and runs
// the result timer; it stands still while the page is hidden or the settings
// drawer is open.

import { BEST_KEY, CUPS, DRIP_BAND, EVENING_LENGTH, FULL_FROM, RESULT_MS } from './constants.js';
import { cssColour, heightAtVolume, judge, levelOf, overBrim, pourAmount, ratioOf, spilled, verdictLine } from './gameplay.js';
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
  cup.style.setProperty('--cup-aspect', String(g.cup.aspect));
  drawGlass(g.cup);
  cup.setAttribute('aria-label', `${capital(g.cup.name)}, empty`);
  el('swatch').style.background = cssColour(g.strength.ratio);
  el('wants-word').textContent = g.strength.word;
  el('guest').textContent = `Guest ${s.index + 1} of ${EVENING_LENGTH} · ${g.cup.name}`;
  setData();
  paint();
}

// --- The glass ---------------------------------------------------------------
// Drawn from the cup's own profile, the one the rules read (constants.js), in a
// 100 × 100 box stretched over the glass's inside: y 0 is the rim, y 100 the
// foot, and x 50 ± 50 the widest the glass gets. Stretching keeps heights true,
// so the surface drawn at a height share is at that share of the glass on screen.

const PROFILE_POINTS = 48;

function wall(cup) {
  const points = [];
  for (let i = 0; i <= PROFILE_POINTS; i++) {
    const h = i / PROFILE_POINTS;
    points.push([50 * cup.halfWidth(h), 100 * (1 - h)]);
  }
  return points; // foot to rim: [half-width, y]
}

const fmt = n => Number(n.toFixed(2));

function drawGlass(cup) {
  const side = wall(cup);
  const left = side.map(([w, y]) => `${fmt(50 - w)} ${fmt(y)}`).reverse(); // rim down to foot
  const right = side.map(([w, y]) => `${fmt(50 + w)} ${fmt(y)}`);          // foot up to rim
  const open = `M ${left.join(' L ')} L ${right.join(' L ')}`;
  el('glass-edge').setAttribute('d', open);
  el('glass-back').setAttribute('d', `${open} Z`);
  el('glass-clip').setAttribute('d', `${open} Z`);

  // The dashed line: 90 % of this glass's volume, wall to wall at that height.
  const h = heightAtVolume(cup, FULL_FROM);
  const w = 50 * cup.halfWidth(h);
  const band = el('band');
  band.setAttribute('x1', String(fmt(50 - w)));
  band.setAttribute('x2', String(fmt(50 + w)));
  band.setAttribute('y1', String(fmt(100 * (1 - h))));
  band.setAttribute('y2', String(fmt(100 * (1 - h))));
}

// Tea over the brim runs down the outside of the glass, following its profile
// a few pixels out from the wall. Within the drip band (#51) one drip runs down
// the right side, longer the further over the brim, with a drop hanging at its
// end. Past it the cup has spilled: tea heaped over the whole rim and running
// down both sides to the foot (no drops there: the result card covers the
// foot). The strokes don't scale with the stretched box, so a drop stays round;
// `data-overflow` on the cup says which is drawn.

const OVERFLOW_PATHS = ['run-under', 'drop-under', 'run', 'drop'];

function drawOverflow(cup, level, colour) {
  const over = level - 1;
  const kind = over <= 1e-9 ? '' : level > 1 + DRIP_BAND + 1e-9 ? 'spill' : 'drip';
  const box = el('cup');
  if (!kind) {
    if (box.dataset.overflow) {
      delete box.dataset.overflow;
      for (const id of OVERFLOW_PATHS) el(id).removeAttribute('d');
    }
    return;
  }
  // Box units per pixel, across and down: the box is 100 × 100 however big the glass is.
  const rect = box.getBoundingClientRect();
  const px = 100 / (rect.width || 100);
  const py = 100 / (rect.height || 100);
  const out = 4 * px;
  const down = kind === 'spill' ? 1 : 0.12 + 0.28 * Math.min(1, over / DRIP_BAND);
  const rim = 50 * cup.halfWidth(1);
  const side = sign => {
    const lip = [50 + sign * (rim - 3 * px), -2 * py];
    const points = [lip];
    for (let i = 0; i <= 24; i++) {
      const h = 1 - down * i / 24;
      points.push([50 + sign * (50 * cup.halfWidth(h) + out), 100 * (1 - h)]);
    }
    return points;
  };
  const line = points => `M ${points.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join(' L ')}`;
  const runs = (kind === 'spill' ? [1, -1] : [1]).map(side);
  const drops = kind === 'drip'
    ? runs.map(points => {
      const [x, y] = points[points.length - 1];
      return `M ${fmt(x)} ${fmt(y + 3 * py)} L ${fmt(x)} ${fmt(y + 3 * py)}`;
    })
    // A spill heaps the tea over the whole rim, lip to lip.
    : [`M ${fmt(50 - rim + 2 * px)} ${fmt(-2 * py)} L ${fmt(50 + rim - 2 * px)} ${fmt(-2 * py)}`];
  const run = runs.map(line).join(' ');
  const drop = drops.join(' ');
  el('run-under').setAttribute('d', run);
  el('run').setAttribute('d', run);
  el('drop-under').setAttribute('d', drop);
  el('drop').setAttribute('d', drop);
  el('run').style.stroke = colour;
  el('drop').style.stroke = colour;
  box.dataset.overflow = kind;
}

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

/**
 * The player let go: brew moves on to water, water serves the cup. A brew let
 * go over the brim serves at once: there is no room left for water (#51).
 */
function release() {
  const liquid = s.pour?.liquid;
  if (!stopPour()) return;
  const g = guest();
  if (overBrim(s.brew, s.water, g.cup.volume)) return serve();
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
  // A first evening above 0 is a best too (#54): nothing was saved to beat.
  el('end-best').textContent = !newBest
    ? (s.best > 0 ? `Best evening: ${s.best}.` : 'No best evening yet: pour another.')
    : before > 0
      ? `A new best evening! The last best was ${before}.`
      : 'A new best evening, your first!';
  el('end-best').classList.toggle('new', newBest);
  el('end').dataset.newBest = String(newBest);
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
  // The level is a share of the cup's volume; the glass's shape says how high that is.
  const surfaceAt = heightAtVolume(g.cup, levelOf(brew, water, g.cup.volume));
  const liquid = el('liquid');
  liquid.setAttribute('y', String(100 * (1 - surfaceAt)));
  liquid.setAttribute('height', String(100 * surfaceAt + 1));
  liquid.style.fill = brew + water > 0 ? cssColour(ratioOf(brew, water)) : 'transparent';
  drawOverflow(g.cup, levelOf(brew, water, g.cup.volume), cssColour(ratioOf(brew, water)));

  const stream = el('stream');
  if (s.pour) {
    const stage = el('stage').getBoundingClientRect();
    const cup = el('cup').getBoundingClientRect();
    const surface = cup.bottom - surfaceAt * cup.height;
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
  // The best evening, from the first screen on (#54); none saved shows none.
  const best = el('best-now');
  const bestText = s.best > 0 ? `best ${s.best}` : '';
  if (best.textContent !== bestText) {
    best.textContent = bestText;
    best.hidden = !bestText;
    best.setAttribute('aria-label', `Best evening: ${s.best} stars`);
  }
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
export { s as session, startGuest as showGuest, serve as serveCup, CUPS, BEST_KEY };
