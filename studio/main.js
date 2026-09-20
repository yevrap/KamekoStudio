// Shadow Studio — placeholder page behavior.
//
// Deliberately tiny. Its one job beyond rendering is to exercise the storage
// namespace rule with real keys, so that `npm run studio:check` is verifying
// something rather than passing on an empty folder.
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

function recordVisit(now = Date.now()) {
  const first = Number(read(FIRST_VISIT)) || now;
  const count = (Number(read(VISIT_COUNT)) || 0) + 1;
  const stored = write(FIRST_VISIT, String(first)) && write(VISIT_COUNT, String(count));
  return { first, count, stored };
}

function describeVisit({ first, count }, now = Date.now()) {
  if (!(count > 1) || !Number.isFinite(first)) return 'First time here.';
  const days = Math.floor((now - first) / 86400000);
  const since = days < 1 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;
  return `Visit number ${count}. The first one was ${since}.`;
}

function render() {
  const visit = recordVisit();
  if (!visit.stored) return; // storage unavailable — the page is complete without it
  const card = document.getElementById('visits-card');
  const text = document.getElementById('visits-text');
  if (!card || !text) return;
  text.textContent = describeVisit(visit);
  card.hidden = false;
}

// Guarded so the pure helper can be imported by the unit tests, which have no DOM.
if (typeof document !== 'undefined') render();

export { describeVisit };
