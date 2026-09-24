// Samovar — the rules of a cup. Pure: no DOM, no clock, no storage.
//
// main.js measures how long a pour has run and calls these; everything the
// player is judged by is decided here, so it is tested without a browser.

import { COLOUR_STOPS, DRIP_BAND, FULL_FROM, POUR_RATE, SHORT_FROM, STRENGTH_BANDS } from './constants.js';

/** Units poured by a hold of `ms` milliseconds. */
export function pourAmount(ms, rate = POUR_RATE) {
  return Math.max(0, ms) * rate / 1000;
}

/** The brew ratio of what is in the cup; an empty cup reads as hot water. */
export function ratioOf(brew, water) {
  const total = brew + water;
  return total > 0 ? brew / total : 0;
}

/** The level of the cup as a share of its brim (may pass 1: a drip, then a spill). */
export function levelOf(brew, water, volume) {
  return (brew + water) / volume;
}

// --- A glass's shape: volume share against height share -------------------
//
// A cup's `halfWidth(h)` profile (constants.js) gives its width at each height.
// The volume below height h is the sum of the round slices under it, each
// slice's area going as the square of its half-width. Summed once per profile
// into a table of STEPS slices; both directions read the same table, so one is
// the other's exact inverse.

const STEPS = 512;
const tables = new WeakMap();

function tableFor(cup) {
  const profile = cup.halfWidth;
  let table = tables.get(profile);
  if (table) return table;
  table = new Float64Array(STEPS + 1);
  const area = h => profile(h) ** 2;
  for (let i = 1; i <= STEPS; i++) {
    // Simpson's rule on each slice: exact for the straight glass and the bowl.
    const a = (i - 1) / STEPS, b = i / STEPS;
    table[i] = table[i - 1] + (b - a) / 6 * (area(a) + 4 * area((a + b) / 2) + area(b));
  }
  const total = table[STEPS];
  for (let i = 0; i <= STEPS; i++) table[i] /= total;
  tables.set(profile, table);
  return table;
}

const clamp01 = x => Math.min(1, Math.max(0, Number.isFinite(x) ? x : 0));

/** The share of `cup`'s volume below `height` (a share of its height, foot 0 to rim 1). */
export function volumeAtHeight(cup, height) {
  const table = tableFor(cup);
  const x = clamp01(height) * STEPS;
  const i = Math.min(STEPS - 1, Math.floor(x));
  return table[i] + (table[i + 1] - table[i]) * (x - i);
}

/** Where the surface sits, as a share of `cup`'s height, when `volume` of its brim is poured. */
export function heightAtVolume(cup, volume) {
  const table = tableFor(cup);
  const v = clamp01(volume);
  let lo = 0, hi = STEPS;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (table[mid] <= v) lo = mid; else hi = mid;
  }
  const span = table[hi] - table[lo];
  return (lo + (span > 0 ? (v - table[lo]) / span : 0)) / STEPS;
}

/** Whether the tea is over the brim at all: a drip or a spill. Exactly at the brim is still in. */
export function overBrim(brew, water, volume) {
  return brew + water > volume + 1e-9;
}

/**
 * Whether the cup has spilled: over the brim by more than the drip band (#51).
 * Up to DRIP_BAND of the cup over, the tea drips down the side and costs a star.
 */
export function spilled(brew, water, volume) {
  return brew + water > volume * (1 + DRIP_BAND) + 1e-9;
}

/** [r, g, b] of tea at `ratio`, interpolated between COLOUR_STOPS. */
export function colourAt(ratio, stops = COLOUR_STOPS) {
  const r = Math.min(1, Math.max(0, Number.isFinite(ratio) ? ratio : 0));
  for (let i = 1; i < stops.length; i++) {
    const [r1, c1] = stops[i];
    if (r <= r1) {
      const [r0, c0] = stops[i - 1];
      const t = r1 === r0 ? 0 : (r - r0) / (r1 - r0);
      return c0.map((v, k) => Math.round(v + (c1[k] - v) * t));
    }
  }
  return stops[stops.length - 1][1].slice();
}

export function cssColour(ratio) {
  const [r, g, b] = colourAt(ratio);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Judge a served cup.
 *
 * Spilling (over the brim by more than the drip band) scores 0. Otherwise
 * strength gives 0–3 stars by the gap between the poured and the wanted ratio;
 * a cup a drop over the brim loses one star (#51), and a cup short of the fill
 * band loses one (two if it is well short).
 *
 * @returns {{ stars: number, spilled: boolean, ratio: number, level: number,
 *             gap: number, strength: 'right'|'strong'|'weak',
 *             fill: 'full'|'drip'|'short'|'low'|'spilled' }}
 */
export function judge({ brew, water, volume, wanted }) {
  const ratio = ratioOf(brew, water);
  const level = levelOf(brew, water, volume);
  const gap = Math.abs(ratio - wanted);
  if (spilled(brew, water, volume)) {
    return { stars: 0, spilled: true, ratio, level, gap, strength: strengthWord(ratio, wanted), fill: 'spilled' };
  }
  const strengthStars = gap <= STRENGTH_BANDS[0] ? 3 : gap <= STRENGTH_BANDS[1] ? 2 : gap <= STRENGTH_BANDS[2] ? 1 : 0;
  const fill = overBrim(brew, water, volume) ? 'drip'
    : level >= FULL_FROM ? 'full' : level >= SHORT_FROM ? 'short' : 'low';
  const penalty = { full: 0, drip: 1, short: 1, low: 2 }[fill];
  return {
    stars: Math.max(0, strengthStars - penalty),
    spilled: false,
    ratio,
    level,
    gap,
    strength: strengthWord(ratio, wanted),
    fill
  };
}

function strengthWord(ratio, wanted) {
  if (Math.abs(ratio - wanted) <= STRENGTH_BANDS[0]) return 'right';
  return ratio > wanted ? 'strong' : 'weak';
}

/** One line saying what happened to a cup, for the result card. */
export function verdictLine(result) {
  if (result.spilled) return 'Spilled over the side — no stars for this one.';
  const strength = {
    right: 'Just the strength they wanted',
    strong: result.gap > STRENGTH_BANDS[1] ? 'Much too strong' : 'A touch too strong',
    weak: result.gap > STRENGTH_BANDS[1] ? 'Much too weak' : 'A touch too weak'
  }[result.strength];
  const fill = {
    full: ', filled to the brim.',
    drip: ', but a drop over the brim.',
    short: ', but short of the brim.',
    low: ', and barely half a cup.'
  }[result.fill];
  return strength + fill;
}
