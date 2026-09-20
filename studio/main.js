// Shadow Studio — the realm's home page.
//
// Everything on this page comes from shelf-data.js through the pure functions
// in shelf.js; this file is the only one that touches the document. Keeping the
// split means every rendered state — each status, an unrecognised one, the
// empty shelf — is unit-testable without a browser.

import { PULSE, LEARNED, SHELF } from './shelf-data.js';
import { pulseMarkup, shelfMarkup } from './shelf.js';

// --- Storage -----------------------------------------------------------------
//
// The namespace is applied inside these two wrappers and is never passed in, so
// a caller cannot reach a production key even by accident — and because the
// prefix is a literal at the call site, the static check can see it too.
// See ../docs/studio/decisions/ADR-0003-storage-namespace.md.

const FIRST_VISIT = 'firstVisit';
const VISIT_COUNT = 'visitCount';

/** localStorage can throw (private mode, blocked site data). Never break the page over it. */
function read(name) {
  try { return localStorage.getItem('studio_' + name); } catch { return null; }
}

function write(name, value) {
  try { localStorage.setItem('studio_' + name, value); return true; } catch { return false; }
}

/**
 * A stored value can be absent, stale, hand-edited or nonsense. Coerce to a
 * sane integer rather than trusting it: "3.7" produced "Visit number 4.7", and
 * "1e999" produced "Visit number Infinity".
 */
function wholeNumber(value, fallback) {
  const n = Math.floor(Number(value));
  return Number.isSafeInteger(n) && n >= 0 ? n : fallback;
}

function recordVisit(now = Date.now()) {
  const first = wholeNumber(read(FIRST_VISIT), now) || now;
  // Coerce after the increment as well as before it: a stored value of
  // MAX_SAFE_INTEGER passed the guard and then rendered "Visit number
  // 9007199254740992", which is not a number the guard would have allowed in.
  const count = wholeNumber(wholeNumber(read(VISIT_COUNT), 0) + 1, 1);
  const stored = write(FIRST_VISIT, String(first)) && write(VISIT_COUNT, String(count));
  return { first, count, stored };
}

function describeVisit({ first, count }, now = Date.now()) {
  if (!(count > 1) || !Number.isFinite(first)) return 'First time here.';
  const days = Math.floor((now - first) / 86400000);
  const since = days < 1 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;
  return `Visit number ${count}. The first one was ${since}.`;
}

// --- Rendering ---------------------------------------------------------------

function fill(id, markup) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = markup;
}

function reveal(id) {
  const el = document.getElementById(id);
  if (el) el.hidden = false;
}

function render() {
  fill('pulse', pulseMarkup(PULSE));
  fill('shelf-region', shelfMarkup(SHELF));
  reveal('shelf-section');

  const learned = document.getElementById('learned');
  if (learned) learned.textContent = LEARNED.line;
  reveal('learned-section');

  // The visit line is the realm's logbook, and the reason the storage rule has
  // something real to check. It is a footnote, not a card: if storage is
  // unavailable the page is complete without it.
  const visit = recordVisit();
  const line = document.getElementById('visits');
  if (visit.stored && line) {
    line.textContent = describeVisit(visit);
    line.hidden = false;
  }
}

// Guarded so the pure helpers can be imported by the unit tests, which have no DOM.
if (typeof document !== 'undefined') render();

export { describeVisit, wholeNumber };
