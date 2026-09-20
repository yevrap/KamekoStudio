// Overtighten — the only file here that touches the document.
//
// It converts held time into torque, calls the pure model, and paints the
// result. Everything it decides with lives in gameplay.js, state.js and ui.js,
// so the interesting parts are tested without a browser and this file stays
// small enough to read in one sitting.

import { COUPLING, OUTCOMES, PLATES, TURN_RATE, couplingFor } from './constants.js';
import { initialTorque, plateAspect, plateState, turn } from './gameplay.js';
import { afterClear, allCleared, isUnlocked, readProgress, resumeIndex, writeProgress } from './state.js';
import { GAUGE, arcDash, pickerMarkup, plateMarkup, statusLine, stateWord } from './ui.js';
import { sfx, setMuted, unlock } from './sfx.js';

// --- Storage -----------------------------------------------------------------
//
// The namespace is applied inside these wrappers and never passed in, exactly as
// on the realm's home page: a caller cannot reach a production key even by
// accident, and the prefix is a literal at the call site so the static check can
// see it. Keys are documented in ../../README.md.

const PROGRESS = 'overtighten_progress';
const MUTED = 'overtighten_muted';

function read(name) {
  try { return localStorage.getItem('studio_' + name); } catch { return null; }
}

function write(name, value) {
  try { localStorage.setItem('studio_' + name, value); return true; } catch { return false; }
}

// --- Session -----------------------------------------------------------------

const session = {
  cleared: readProgress(read(PROGRESS), PLATES.length),
  index: 0,
  plate: null,
  coupling: COUPLING,
  torque: {},
  previous: null,
  finished: false,
  held: null,
  lastFrame: 0,
  clickAccrued: 0
};

const el = id => document.getElementById(id);

function loadPlate(index) {
  session.index = index;
  session.plate = PLATES[index];
  session.coupling = couplingFor(session.plate);
  session.torque = initialTorque(session.plate);
  session.previous = null;
  session.finished = false;
  release();
  el('plate').style.setProperty('--plate-aspect', plateAspect(session.plate));
  el('plate').innerHTML = plateMarkup(session.plate, plateState(session.plate, session.torque));
  el('plate-name').textContent = session.plate.name;
  el('plate-hint').textContent = session.plate.hint;
  el('outcome').hidden = true;
  el('plate').classList.remove('is-finished');
  paint();
  renderPicker();
}

function renderPicker() {
  el('picker').innerHTML = pickerMarkup(PLATES, {
    currentIndex: session.index,
    cleared: session.cleared,
    isUnlocked
  });
}

// --- Painting ----------------------------------------------------------------
//
// The markup is rebuilt only when the plate changes. Per frame the loop touches
// the two gauge arcs, one class and one readout per bolt — a full re-render
// while a bolt is held would destroy the button under the player's finger and
// with it the pointer capture.

function paint() {
  const state = plateState(session.plate, session.torque);
  const previous = session.previous;

  for (const bolt of state.bolts) {
    const button = el('plate').querySelector(`[data-bolt="${bolt.id}"]`);
    const readout = el('plate').querySelector(`[data-readout="${bolt.id}"]`);
    if (!button || !readout) continue;

    const fill = button.querySelector('.fill');
    if (fill) fill.setAttribute('stroke-dasharray', arcDash(0, bolt.fill, GAUGE.circum));
    button.classList.remove('is-loose', 'is-seated', 'is-over', 'is-stripped');
    button.classList.add(`is-${bolt.state}`);
    readout.textContent = `${Math.round(bolt.value)} · ${stateWord(bolt.state)}`;

    if (previous) {
      const before = previous.bolts.find(b => b.id === bolt.id);
      if (before && before.seated !== bolt.seated) (bolt.seated ? sfx.seat : sfx.unseat)();
    }
  }

  el('status').textContent = statusLine(session.plate, state);
  session.previous = state;

  if (state.outcome && !session.finished) finish(state.outcome);
}

function finish(outcome) {
  session.finished = true;
  release();
  const copy = OUTCOMES[outcome];
  el('outcome-title').textContent = copy.title;
  el('outcome-line').textContent = copy.line;
  el('outcome').hidden = false;
  el('plate').classList.add('is-finished');

  if (outcome === 'solved') {
    sfx.solved();
    const next = afterClear(session.index, session.cleared);
    if (next !== session.cleared) {
      session.cleared = next;
      write(PROGRESS, writeProgress(next));
    }
    renderPicker();
    const more = session.index + 1 < PLATES.length;
    el('advance').hidden = !more;
    el('advance').textContent = more ? `Next: ${PLATES[session.index + 1].name}` : '';
    el('outcome-all').hidden = !allCleared(session.cleared, PLATES.length);
  } else {
    sfx.strip();
    el('advance').hidden = true;
    el('outcome-all').hidden = true;
  }
  // Moving focus is what makes the outcome reachable without a mouse; it is the
  // only place this page takes focus from the player.
  el('outcome').focus();
}

// --- Holding a bolt ----------------------------------------------------------

function hold(boltId) {
  if (session.finished || session.held === boltId) return;
  unlock();
  session.held = boltId;
  session.lastFrame = performance.now();
  session.clickAccrued = 0;
  el('plate').querySelector(`[data-bolt="${boltId}"]`)?.classList.add('is-turning');
  requestAnimationFrame(step);
}

function release() {
  if (session.held) {
    el('plate').querySelector(`[data-bolt="${session.held}"]`)?.classList.remove('is-turning');
  }
  session.held = null;
}

/** One frame of turning. Elapsed time, not frame count, so the rate is the same everywhere. */
function step(now) {
  if (!session.held) return;
  // A backgrounded tab resumes with a huge delta, which would strip every bolt
  // the player was holding when they switched away. One frame at 30fps is the
  // most any single step may apply.
  const elapsed = Math.min(now - session.lastFrame, 34);
  session.lastFrame = now;

  const boltId = session.held;
  session.torque = turn(session.plate, session.torque, boltId, (elapsed / 1000) * TURN_RATE, session.coupling);

  // The ratchet clicks on travel, not on time: holding a bolt that cannot move
  // any further should go quiet.
  session.clickAccrued += (elapsed / 1000) * TURN_RATE;
  if (session.clickAccrued >= 6) {
    session.clickAccrued = 0;
    const bolt = session.plate.bolts.find(b => b.id === boltId);
    sfx.click(bolt ? Math.min(1, session.torque[boltId] / bolt.strip) : 0);
  }

  paint();
  if (session.held) requestAnimationFrame(step);
}

// --- Input -------------------------------------------------------------------
//
// Pointer events cover mouse, touch and pen with one path. Keyboard is handled
// separately because a held key repeats rather than staying down, and because
// space and enter both activate a button — which would otherwise turn a bolt by
// one frame per keypress and feel broken.

function boltUnder(target) {
  const button = target instanceof Element ? target.closest('[data-bolt]') : null;
  return button ? button.dataset.bolt : null;
}

function wire() {
  const plate = el('plate');

  plate.addEventListener('pointerdown', event => {
    const boltId = boltUnder(event.target);
    if (!boltId) return;
    event.preventDefault();
    // Capture keeps the turn going if the finger slides off the bolt head, and
    // guarantees the matching pointerup arrives here even so.
    event.target.closest('[data-bolt]')?.setPointerCapture?.(event.pointerId);
    hold(boltId);
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    plate.addEventListener(type, release);
  }

  // A key that repeats holds; the first repeat is not waited for, so a single
  // deliberate tap still turns the bolt a little.
  plate.addEventListener('keydown', event => {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    const boltId = boltUnder(event.target);
    if (!boltId) return;
    event.preventDefault();
    hold(boltId);
  });
  plate.addEventListener('keyup', event => {
    if (event.key === ' ' || event.key === 'Enter') release();
  });
  // Tabbing away mid-hold, or the window losing focus, must stop the turn.
  plate.addEventListener('focusout', release);
  window.addEventListener('blur', release);
  document.addEventListener('visibilitychange', () => { if (document.hidden) release(); });

  el('picker').addEventListener('click', event => {
    const button = event.target.closest('[data-plate]');
    if (!button || button.disabled) return;
    unlock();
    loadPlate(Number(button.dataset.plate));
  });

  el('restart').addEventListener('click', () => { unlock(); loadPlate(session.index); });
  el('advance').addEventListener('click', () => {
    unlock();
    if (session.index + 1 < PLATES.length) loadPlate(session.index + 1);
  });

  const mute = el('mute');
  const applyMute = value => {
    setMuted(value);
    mute.setAttribute('aria-pressed', String(value));
    mute.textContent = value ? 'Sound off' : 'Sound on';
  };
  applyMute(read(MUTED) === '1');
  mute.addEventListener('click', () => {
    const next = !(mute.getAttribute('aria-pressed') === 'true');
    applyMute(next);
    write(MUTED, next ? '1' : '0');
  });
}

// Guarded so the module can be imported by a test with no DOM.
if (typeof document !== 'undefined' && el('plate')) {
  wire();
  loadPlate(resumeIndex(session.cleared, PLATES.length));
  el('game').hidden = false;
}
