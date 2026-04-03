'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parsePlainText, deckToPlainText, shuffle, lerpHex, typeForStreak } = require('../shared/utils.js');

// ─── parsePlainText ───────────────────────────────────────────────────────────

test('parsePlainText: basic valid input', () => {
  const result = parsePlainText('# My Deck\nFrance: Paris\nJapan: Tokyo');
  assert.equal(result.name, 'My Deck');
  assert.deepEqual(result.pairs, [{ k: 'France', v: 'Paris' }, { k: 'Japan', v: 'Tokyo' }]);
});

test('parsePlainText: # header sets name', () => {
  const result = parsePlainText('# Capital Cities\nGermany: Berlin');
  assert.equal(result.name, 'Capital Cities');
});

test('parsePlainText: no header defaults to Imported Deck', () => {
  const result = parsePlainText('France: Paris');
  assert.equal(result.name, 'Imported Deck');
});

test('parsePlainText: empty string returns null', () => {
  assert.equal(parsePlainText(''), null);
});

test('parsePlainText: no valid pairs returns null', () => {
  assert.equal(parsePlainText('# Just a header\nno colon here'), null);
});

test('parsePlainText: lines without colon are skipped', () => {
  const result = parsePlainText('France: Paris\nskip this line\nJapan: Tokyo');
  assert.equal(result.pairs.length, 2);
});

test('parsePlainText: value can contain colon (splits on first only)', () => {
  const result = parsePlainText('Capital: Paris, France: city');
  assert.equal(result.pairs[0].k, 'Capital');
  assert.equal(result.pairs[0].v, 'Paris, France: city');
});

test('parsePlainText: trims whitespace from keys and values', () => {
  const result = parsePlainText('  France  :  Paris  ');
  assert.equal(result.pairs[0].k, 'France');
  assert.equal(result.pairs[0].v, 'Paris');
});

test('parsePlainText: blank lines are ignored', () => {
  const result = parsePlainText('\n\nFrance: Paris\n\n\nJapan: Tokyo\n\n');
  assert.equal(result.pairs.length, 2);
});

// ─── deckToPlainText ──────────────────────────────────────────────────────────

test('deckToPlainText: produces correct format', () => {
  const deck = { name: 'Test', pairs: [{ k: 'France', v: 'Paris' }, { k: 'Japan', v: 'Tokyo' }] };
  assert.equal(deckToPlainText(deck), '# Test\nFrance: Paris\nJapan: Tokyo');
});

test('deckToPlainText / parsePlainText round-trip', () => {
  const deck = { name: 'Capitals', pairs: [{ k: 'France', v: 'Paris' }, { k: 'Japan', v: 'Tokyo' }, { k: 'Germany', v: 'Berlin' }] };
  const result = parsePlainText(deckToPlainText(deck));
  assert.equal(result.name, deck.name);
  assert.deepEqual(result.pairs, deck.pairs);
});

// ─── typeForStreak ────────────────────────────────────────────────────────────

test('typeForStreak: streak 0-2 returns tier 0', () => {
  assert.equal(typeForStreak(0), 0);
  assert.equal(typeForStreak(1), 0);
  assert.equal(typeForStreak(2), 0);
});

test('typeForStreak: streak 3-4 returns tier 1', () => {
  assert.equal(typeForStreak(3), 1);
  assert.equal(typeForStreak(4), 1);
});

test('typeForStreak: streak 5-7 returns tier 2', () => {
  assert.equal(typeForStreak(5), 2);
  assert.equal(typeForStreak(6), 2);
  assert.equal(typeForStreak(7), 2);
});

test('typeForStreak: streak 8+ returns tier 3', () => {
  assert.equal(typeForStreak(8), 3);
  assert.equal(typeForStreak(100), 3);
});

// ─── shuffle ─────────────────────────────────────────────────────────────────

test('shuffle: returns the same array reference (in-place)', () => {
  const arr = [1, 2, 3, 4, 5];
  const result = shuffle(arr);
  assert.equal(result, arr);
});

test('shuffle: result has same length', () => {
  const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  shuffle(arr);
  assert.equal(arr.length, 10);
});

test('shuffle: result contains all original elements', () => {
  const original = [1, 2, 3, 4, 5];
  const arr = [...original];
  shuffle(arr);
  assert.deepEqual(arr.slice().sort((a, b) => a - b), original);
});

test('shuffle: empty array is a no-op', () => {
  const arr = [];
  shuffle(arr);
  assert.deepEqual(arr, []);
});

// ─── lerpHex ─────────────────────────────────────────────────────────────────

test('lerpHex: t=0 returns color a', () => {
  assert.equal(lerpHex('#000000', '#ffffff', 0), '#000000');
});

test('lerpHex: t=1 returns color b', () => {
  assert.equal(lerpHex('#000000', '#ffffff', 1), '#ffffff');
});

test('lerpHex: t=0.5 returns midpoint', () => {
  // Math.round(255 * 0.5) = Math.round(127.5) = 128 = 0x80
  assert.equal(lerpHex('#000000', '#ffffff', 0.5), '#808080');
});

test('lerpHex: result is a valid 7-char hex string', () => {
  const result = lerpHex('#ff0000', '#0000ff', 0.3);
  assert.match(result, /^#[0-9a-f]{6}$/);
});
