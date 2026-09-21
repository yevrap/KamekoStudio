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
  // Everything currently holding the bolt — pointer ids and keys — because more
  // than one thing can. One slot held the bolt and nothing held the cause: a
  // second finger froze the first bolt mid-turn, lifting either finger stopped
  // everything, and tapping Enter while Space was down ended a hold Space was
  // still making. A turn ends when the last of these lets go.
  causes: new Set(),
  lastFrame: 0,
  clickAccrued: 0,
  lastStatus: null,
  // Which turn the animation loop belongs to. A frame already scheduled by a
  // previous hold would otherwise see `session.held` still truthy and carry on
  // alongside the new one: six pointerdown/up pairs in a single task left seven
  // loops running, each repainting the whole plate every frame.
  turnId: 0
};

const el = id => document.getElementById(id);

function loadPlate(index, options = {}) {
  session.index = index;
  session.plate = PLATES[index];
  session.coupling = couplingFor(session.plate);
  session.torque = initialTorque(session.plate);
  session.previous = null;
  session.finished = false;
  session.lastStatus = null;
  release();
  el('plate').style.setProperty('--plate-aspect', plateAspect(session.plate));
  el('plate').innerHTML = plateMarkup(session.plate, plateState(session.plate, session.torque));
  el('plate-name').textContent = session.plate.name;
  el('plate-hint').textContent = session.plate.hint;
  el('outcome').hidden = true;
  el('plate').classList.remove('is-finished');
  paint();
  renderPicker();
  showBench(options);
}

/**
 * Put the plate you just chose on screen, and leave focus somewhere usable.
 *
 * Both are consequences of the picker sitting after the bench in the document:
 * clicking a plate scrolls the picker into view, which pushed every bolt off
 * the top of the screen — on a phone there was nothing playable visible at all.
 * And advancing hides the button that had focus, which dropped focus to the
 * body and sent a keyboard player back to the top of the document.
 *
 * Not done on first load: arriving at the top of a page you have not read is
 * correct, and moving focus there would be taking it for no reason.
 */
function showBench({ scroll = false, focus = false } = {}) {
  if (scroll) {
    const bench = document.querySelector('.bench');
    if (bench) bench.scrollIntoView({ block: 'start', behavior: 'auto' });
  }
  if (focus) el('plate').querySelector('[data-bolt]')?.focus();
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

  // Assigned only when the string changes. This is an aria-live region and
  // paint() runs every frame: a one-second hold re-stuffed the polite queue 62
  // times with the same sentence.
  const line = statusLine(session.plate, state);
  if (line !== session.lastStatus) {
    el('status').textContent = line;
    session.lastStatus = line;
  }
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

/**
 * Start turning `boltId`. `cause` identifies one thing holding it — a pointer
 * id, or the key that went down — so that releasing a *different* input does not
 * stop this one.
 *
 * The previous bolt is always released first. Without that, a second input left
 * the first bolt marked `is-turning` for the rest of the plate, its head lit,
 * with nothing holding it.
 */
function hold(boltId, cause) {
  if (session.finished) return;
  if (session.held === boltId) {
    // A key that repeats, or a second finger on the same bolt. Both join the
    // hold; neither restarts it and neither replaces what is already holding it.
    session.causes.add(cause);
    return;
  }
  release();
  unlock();
  session.held = boltId;
  session.causes = new Set([cause]);
  session.lastFrame = performance.now();
  session.clickAccrued = 0;
  session.turnId += 1;
  // Named `turnId`, not `turn`: `turn` is the torque rule imported from
  // gameplay.js, and shadowing it here made `turn(plate, …)` a call on a number.
  const turnId = session.turnId;
  el('plate').querySelector(`[data-bolt="${boltId}"]`)?.classList.add('is-turning');
  requestAnimationFrame(now => step(now, turnId));
}

/**
 * One input lets go. The turn stops only when nothing is holding the bolt any
 * more: pressing Enter while Space is down, or lifting a second finger, must not
 * stop a turn another input is still making. Called with no cause it stops
 * unconditionally, which is what focus loss, a finished plate and a new plate
 * all want.
 */
function release(cause) {
  if (cause !== undefined) {
    session.causes.delete(cause);
    if (session.held && session.causes.size > 0) return;
  }
  if (session.held) {
    el('plate').querySelector(`[data-bolt="${session.held}"]`)?.classList.remove('is-turning');
  }
  session.held = null;
  session.causes.clear();
}

/** One frame of turning. Elapsed time, not frame count, so the rate is the same everywhere. */
function step(now, turnId) {
  // A frame left over from a previous hold retires here rather than running on
  // beside the current one.
  if (turnId !== session.turnId || !session.held) return;
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
  if (session.held) requestAnimationFrame(next => step(next, turnId));
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
    const button = event.target instanceof Element ? event.target.closest('[data-bolt]') : null;
    if (!button) return;
    event.preventDefault();
    // preventDefault suppresses the browser's own focus, so it is done by hand.
    // Without this a player who clicked a bolt could not then use the keyboard:
    // activeElement was the body and holding a key did nothing.
    button.focus();
    // Capture keeps the turn going if the finger slides off the bolt head, and
    // guarantees the matching pointerup arrives here even so. It is specified to
    // throw when the pointer is already gone, and an exception here would abort
    // the handler before the turn ever started.
    try { button.setPointerCapture(event.pointerId); } catch { /* the turn does not depend on it */ }
    hold(button.dataset.bolt, `pointer:${event.pointerId}`);
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    plate.addEventListener(type, event => release(`pointer:${event.pointerId}`));
  }

  // A key that repeats holds; the first repeat is not waited for, so a single
  // deliberate tap still turns the bolt a little.
  plate.addEventListener('keydown', event => {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    const boltId = boltUnder(event.target);
    if (!boltId) return;
    event.preventDefault();
    hold(boltId, `key:${event.key}`);
  });
  // Only the key that started the hold ends it. Tapping Enter while Space was
  // down used to stop the turn with Space still physically pressed, and the only
  // way back was to release and press again.
  plate.addEventListener('keyup', event => release(`key:${event.key}`));
  // Tabbing away mid-hold, or the window losing focus, must stop the turn —
  // unconditionally, because there is no input left to attribute it to.
  plate.addEventListener('focusout', () => release());
  window.addEventListener('blur', () => release());
  document.addEventListener('visibilitychange', () => { if (document.hidden) release(); });

  el('picker').addEventListener('click', event => {
    const button = event.target.closest('[data-plate]');
    if (!button || button.disabled) return;
    unlock();
    loadPlate(Number(button.dataset.plate), { scroll: true, focus: true });
  });

  el('restart').addEventListener('click', () => { unlock(); loadPlate(session.index, { focus: true }); });
  el('advance').addEventListener('click', () => {
    unlock();
    if (session.index + 1 < PLATES.length) loadPlate(session.index + 1, { scroll: true, focus: true });
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
