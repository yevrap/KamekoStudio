// The placeholder page's one piece of logic: turning a stored visit record
// into a sentence. Everything else on the page is markup.

import test from 'node:test';
import assert from 'node:assert/strict';
import { describeVisit } from '../../studio/main.js';

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
