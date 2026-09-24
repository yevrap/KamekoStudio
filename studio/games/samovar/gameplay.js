// Samovar — the rules of a cup. Pure: no DOM, no clock, no storage.
//
// main.js measures how long a pour has run and calls these; everything the
// player is judged by is decided here, so it is tested without a browser.

import { COLOUR_STOPS, FULL_FROM, POUR_RATE, SHORT_FROM, STRENGTH_BANDS } from './constants.js';

/** Units poured by a hold of `ms` milliseconds. */
export function pourAmount(ms, rate = POUR_RATE) {
  return Math.max(0, ms) * rate / 1000;
}

/** The brew ratio of what is in the cup; an empty cup reads as hot water. */
export function ratioOf(brew, water) {
  const total = brew + water;
  return total > 0 ? brew / total : 0;
}

/** The level of the cup as a share of its brim (may pass 1: that is a spill). */
export function levelOf(brew, water, volume) {
  return (brew + water) / volume;
}

/** Whether the cup has overflowed. Exactly at the brim is still in. */
export function spilled(brew, water, volume) {
  return brew + water > volume + 1e-9;
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
 * Spilling scores 0. Otherwise strength gives 0–3 stars by the gap between the
 * poured and the wanted ratio, and a cup short of the fill band loses one star
 * (two if it is well short).
 *
 * @returns {{ stars: number, spilled: boolean, ratio: number, level: number,
 *             gap: number, strength: 'right'|'strong'|'weak', fill: 'full'|'short'|'low'|'spilled' }}
 */
export function judge({ brew, water, volume, wanted }) {
  const ratio = ratioOf(brew, water);
  const level = levelOf(brew, water, volume);
  const gap = Math.abs(ratio - wanted);
  if (spilled(brew, water, volume)) {
    return { stars: 0, spilled: true, ratio, level, gap, strength: strengthWord(ratio, wanted), fill: 'spilled' };
  }
  const strengthStars = gap <= STRENGTH_BANDS[0] ? 3 : gap <= STRENGTH_BANDS[1] ? 2 : gap <= STRENGTH_BANDS[2] ? 1 : 0;
  const fill = level >= FULL_FROM ? 'full' : level >= SHORT_FROM ? 'short' : 'low';
  const penalty = fill === 'full' ? 0 : fill === 'short' ? 1 : 2;
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
  if (result.spilled) return 'Spilled over the brim — no stars for this one.';
  const strength = {
    right: 'Just the strength they wanted',
    strong: result.gap > STRENGTH_BANDS[1] ? 'Much too strong' : 'A touch too strong',
    weak: result.gap > STRENGTH_BANDS[1] ? 'Much too weak' : 'A touch too weak'
  }[result.strength];
  const fill = { full: ', filled to the brim.', short: ', but short of the brim.', low: ', and barely half a cup.' }[result.fill];
  return strength + fill;
}
