// The realm's home page: the visit logbook's one piece of logic, and the shelf
// renderer, whose every state is exercised here rather than in a browser.

import test from 'node:test';
import assert from 'node:assert/strict';
import { describeVisit, wholeNumber } from '../../studio/main.js';

const DAY = 86400000;
const NOW = Date.UTC(2026, 8, 19, 12, 0, 0);

test('the first visit says so', () => {
  assert.equal(describeVisit({ first: NOW, count: 1 }, NOW), 'First time here.');
});

test('a same-day return counts, and reads as today', () => {
  assert.equal(describeVisit({ first: NOW - 3600000, count: 2 }, NOW), 'Visit number 2. The first one was today.');
});

test('yesterday is singular, older is plural', () => {
  assert.equal(describeVisit({ first: NOW - DAY, count: 3 }, NOW), 'Visit number 3. The first one was yesterday.');
  assert.equal(describeVisit({ first: NOW - 12 * DAY, count: 9 }, NOW), 'Visit number 9. The first one was 12 days ago.');
});

test('a corrupted count does not produce a broken sentence', () => {
  assert.equal(describeVisit({ first: NOW, count: 0 }, NOW), 'First time here.');
  assert.equal(describeVisit({ first: NaN, count: 1 }, NOW), 'First time here.');
});

test('a stored count is coerced to a sane integer before it is used', () => {
  // Every one of these was observed rendering nonsense before the coercion:
  // "3.7" -> "Visit number 4.7", "1e999" -> "Visit number Infinity".
  assert.equal(wholeNumber('3.7', 0), 3);
  assert.equal(wholeNumber('1e999', 0), 0);
  assert.equal(wholeNumber('9007199254740993', 0), 0);
  assert.equal(wholeNumber('-5', 0), 0);
  assert.equal(wholeNumber('banana', 0), 0);
  assert.equal(wholeNumber('<img src=x onerror=alert(1)>', 0), 0);
  assert.equal(wholeNumber(null, 0), 0);
  assert.equal(wholeNumber('7', 0), 7);
});

// --- The shelf ---------------------------------------------------------------

import {
  cardMarkup, shelfMarkup, pulseMarkup, normalizeStatus, formatDate, escapeHtml, STATUSES
} from '../../studio/shelf.js';

const ENTRY = {
  title: 'Some Experiment',
  status: 'PROTOTYPE',
  blurb: 'A thing the team is trying.',
  iteration: '02',
  changed: '2026-09-20',
  url: 'games/some-experiment/'
};

test('every declared status renders its own tag and is recognised', () => {
  for (const status of STATUSES) {
    const { status: out, known } = normalizeStatus(status);
    assert.equal(out, status);
    assert.equal(known, true);
    assert.match(cardMarkup({ ...ENTRY, status }), new RegExp(`<p class="status">${status}</p>`));
  }
});

test('a status the shelf does not know is shown, not dropped', () => {
  // The point of the fallback: a mistake in the data is visible on the page.
  const markup = cardMarkup({ ...ENTRY, status: 'SHIPPED?' });
  assert.equal(normalizeStatus('SHIPPED?').known, false);
  assert.match(markup, /class="item is-unknown"/);
  assert.match(markup, /<p class="status">SHIPPED\?<\/p>/);
  assert.match(markup, /Some Experiment/);
});

test('a missing status becomes a visible UNKNOWN rather than an empty tag', () => {
  assert.deepEqual(normalizeStatus(undefined), { status: 'UNKNOWN', known: false });
  assert.deepEqual(normalizeStatus('   '), { status: 'UNKNOWN', known: false });
  assert.match(cardMarkup({ title: 'Nameless' }), /<p class="status">UNKNOWN<\/p>/);
});

test('status is matched case-insensitively, since the data is hand-written', () => {
  assert.deepEqual(normalizeStatus('killed'), { status: 'KILLED', known: true });
});

test('killed work stays on the shelf and is never a link, even with a url', () => {
  const markup = cardMarkup({ ...ENTRY, status: 'KILLED' });
  assert.match(markup, /class="item is-killed"/);
  assert.doesNotMatch(markup, /<a /);
  assert.match(markup, /Some Experiment/);          // present as history
});

test('an entry with a url is a link; one without is a plain card', () => {
  assert.match(cardMarkup(ENTRY), /<a href="games\/some-experiment\/">Some Experiment<\/a>/);
  const { url, ...noUrl } = ENTRY;
  assert.doesNotMatch(cardMarkup(noUrl), /<a /);
});

test('the card carries the iteration it arrived in and the date it last changed', () => {
  const markup = cardMarkup(ENTRY);
  assert.match(markup, /Iteration 02/);
  assert.match(markup, /<time datetime="2026-09-20">20 Sep 2026<\/time>/);
});

test('an empty shelf renders an honest empty state, not an invented entry', () => {
  const markup = shelfMarkup([]);
  assert.match(markup, /class="empty"/);
  assert.match(markup, /Nothing on the shelf yet/);
  assert.doesNotMatch(markup, /class="item/);
});

test('a missing or malformed shelf does not throw', () => {
  for (const bad of [undefined, null, 'not a list', 42]) {
    assert.match(shelfMarkup(bad), /class="empty"/);
  }
});

test('a populated shelf renders one card per entry', () => {
  const markup = shelfMarkup([ENTRY, { ...ENTRY, title: 'Another' }]);
  assert.equal(markup.match(/<article/g).length, 2);
});

test('markup escapes its inputs', () => {
  assert.equal(escapeHtml('<img src=x onerror="alert(1)">'),
    '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  const markup = cardMarkup({ ...ENTRY, title: '<script>bad()</script>' });
  assert.doesNotMatch(markup, /<script>/);
});

test('a date that is not an ISO date is passed through rather than mangled', () => {
  assert.equal(formatDate('2026-01-05'), '5 Jan 2026');
  assert.equal(formatDate('2026-13-01'), '2026-13-01');   // no such month
  assert.equal(formatDate('soon'), 'soon');
  assert.equal(formatDate(undefined), '');
});

test('the pulse line names the iteration and its date', () => {
  const markup = pulseMarkup({ iteration: '01', shipped: '2026-09-20', summary: 'Did a thing.' });
  assert.match(markup, /Iteration 01/);
  assert.match(markup, /<time class="mono" datetime="2026-09-20">20 Sep 2026<\/time>/);
  assert.match(markup, /Did a thing\./);
});
