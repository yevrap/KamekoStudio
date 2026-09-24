// Samovar — an evening's guests and the saved best. Pure.

import { CUPS, EVENING_LENGTH, STRENGTHS } from './constants.js';

/** A small seeded generator (mulberry32), so an evening can be replayed in a test. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The guests of one evening: a cup and a wanted strength each.
 *
 * Drawn without replacement from every cup-and-strength pair (three cups by
 * four strengths is twelve), so no two guests in an evening ask for the same
 * pour, and ten of twelve always include every cup and every strength: a cup
 * size has four pairs and a strength three, and only two are left out.
 */
export function makeEvening(random = Math.random, length = EVENING_LENGTH) {
  const pairs = [];
  for (const cup of CUPS) for (const strength of STRENGTHS) pairs.push({ cup, strength });
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1)) % (i + 1);
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  return pairs.slice(0, Math.min(length, pairs.length));
}

/** The best evening from storage. Anything unreadable counts as none. */
export function readBest(raw, max = EVENING_LENGTH * 3) {
  const n = Number.parseInt(raw ?? '', 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, max);
}
