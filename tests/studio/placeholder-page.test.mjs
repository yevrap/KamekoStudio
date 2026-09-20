// The placeholder page's one piece of logic: turning a stored visit record
// into a sentence. Everything else on the page is markup.

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
