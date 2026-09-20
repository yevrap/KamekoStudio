// shelf.js — the shelf, as markup. Pure functions over data, no DOM.
//
// Kept free of `document` so the unit tests can exercise every state — each
// status, an unrecognised one, and the empty shelf — without a browser. main.js
// is the only file that touches the page.

export const STATUSES = ['PROTOTYPE', 'ITERATING', 'KILLED', 'PROMOTED'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Entries are ours, but markup built by concatenation escapes its inputs anyway. */
export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * A status the shelf does not know about is a mistake in the data, and a
 * mistake in the data should be visible on the page rather than swallowed. An
 * unrecognised value is reported as itself; a missing one becomes UNKNOWN.
 */
export function normalizeStatus(raw) {
  const value = String(raw ?? '').trim().toUpperCase();
  if (STATUSES.includes(value)) return { status: value, known: true };
  return { status: value || 'UNKNOWN', known: false };
}

/** `2026-09-20` → `20 Sep 2026`. Anything unparseable is passed through as written. */
export function formatDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso ?? '').trim());
  if (!m) return String(iso ?? '');
  const month = MONTHS[Number(m[2]) - 1];
  if (!month) return String(iso);
  return `${Number(m[3])} ${month} ${m[1]}`;
}

/**
 * One card. A KILLED entry is never a link, whatever the data says: killed work
 * stays on the shelf as history, not as an offer.
 */
export function cardMarkup(entry = {}) {
  const { status, known } = normalizeStatus(entry.status);
  const killed = status === 'KILLED';
  const linked = Boolean(entry.url) && !killed;
  const classes = ['item', killed ? 'is-killed' : '', known ? '' : 'is-unknown']
    .filter(Boolean).join(' ');

  const title = escapeHtml(entry.title ?? 'Untitled');
  const heading = linked
    ? `<a href="${escapeHtml(entry.url)}">${title}</a>`
    : title;

  const meta = [];
  if (entry.iteration) meta.push(`Iteration ${escapeHtml(entry.iteration)}`);
  if (entry.changed) {
    meta.push(`changed <time datetime="${escapeHtml(entry.changed)}">${escapeHtml(formatDate(entry.changed))}</time>`);
  }

  return [
    `<article class="${classes}">`,
    `<p class="status">${escapeHtml(status)}</p>`,
    `<h3>${heading}</h3>`,
    entry.blurb ? `<p class="blurb">${escapeHtml(entry.blurb)}</p>` : '',
    meta.length ? `<p class="meta mono">${meta.join(' · ')}</p>` : '',
    `</article>`
  ].filter(Boolean).join('');
}

/** The whole shelf, or an honest empty state. Never an invented entry. */
export function shelfMarkup(entries) {
  const list = Array.isArray(entries) ? entries : [];
  if (list.length === 0) {
    return '<p class="empty">Nothing on the shelf yet. The team has built itself, its checks and this room; '
      + 'the first experiment goes here when there is one.</p>';
  }
  return `<div class="shelf">${list.map(cardMarkup).join('')}</div>`;
}

/** The pulse line: what the company is doing, in one sentence. */
export function pulseMarkup(pulse = {}) {
  const parts = [];
  if (pulse.iteration) parts.push(`<span class="status">Iteration ${escapeHtml(pulse.iteration)}</span>`);
  if (pulse.shipped) {
    parts.push(`<time class="mono" datetime="${escapeHtml(pulse.shipped)}">${escapeHtml(formatDate(pulse.shipped))}</time>`);
  }
  const head = parts.join(' ');
  const summary = pulse.summary ? `<p class="pulse-summary">${escapeHtml(pulse.summary)}</p>` : '';
  return `${head ? `<p class="pulse-head">${head}</p>` : ''}${summary}`;
}
