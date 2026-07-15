// Black Hole in One — static config + pure helpers (DOM-free, unit-tested)
'use strict';

export const WORLD_W = 100;   // course width in world units
export const COURSE_H = 170;  // fixed course height — every device plays the SAME holes.
                              // The draft derived height from the viewport, so laptops got a
                              // short compressed course (too easy) while phones got a tall one
                              // (questionnaire Q5). The course is letterboxed into the canvas.

export const G = 400;                 // gravity constant
export const COMET_R = 1.6;
export const DT = 1 / 240;            // physics step
export const MAX_LAUNCH = 120;        // top launch speed (world units/s)
export const MAX_V = 175;             // hard speed cap in flight
export const MAX_DRAG = 40;           // drag length (world units) for full power
export const MIN_SHOT = 10;           // release below this speed = cancelled shot
export const REST_BOUNCE = 0.38;      // normal restitution on planet impact
export const REST_FRIC = 0.62;        // tangential keep on impact
export const REST_V = 22;             // impact below this = comet lands (17 in the draft —
                                      // widened so deliberate hops actually stick, Q4)
export const SOFT_CATCH = 1.6;        // impacts under REST_V*SOFT_CATCH bounce dead so the
                                      // next touch lands — "the planet catches you" (Q4)
export const SOFT_BOUNCE = 0.16;      // restitution for a soft-catch bounce
export const CAPTURE_R = 4.6;         // black hole sink radius
export const OB_MARGIN = 14;          // out-of-bounds margin beyond the course rect
export const DUST_T = 9;              // seconds of flight before space dust drag ramps in
export const FLIGHT_CAP = 24;         // absolute flight timeout
export const SLING_ANG = 1.9;         // radians swung around one planet = SLINGSHOT!
export const ROUND_HOLES = 9;         // holes per round in Round mode

export const PALETTES = [
    { base: '#e2725b', dark: '#8c3a2c', name: 'rust' },
    { base: '#57c7c2', dark: '#20635f', name: 'teal' },
    { base: '#9b7bd4', dark: '#4b3378', name: 'violet' },
    { base: '#d8b56b', dark: '#7a5f2a', name: 'sand' },
    { base: '#7fb0e0', dark: '#33567e', name: 'ice' },
];

export function rand(a, b) { return a + Math.random() * (b - a); }
export function dist(ax, ay, bx, by) { return Math.hypot(bx - ax, by - ay); }

export function fmtDiff(d) { return d === 0 ? 'E' : (d > 0 ? '+' + d : '−' + Math.abs(d)); }

// Golf label for a finished hole. fanfare = number of ascending score tones.
export function holeLabel(strokes, par) {
    if (strokes === 1) return { label: 'BLACK HOLE IN ONE!', ace: true, fanfare: 5 };
    const diff = strokes - par;
    if (diff <= -2) return { label: 'EAGLE', ace: false, fanfare: 4 };
    if (diff === -1) return { label: 'BIRDIE', ace: false, fanfare: 3 };
    if (diff === 0) return { label: 'PAR', ace: false, fanfare: 2 };
    if (diff === 1) return { label: 'BOGEY', ace: false, fanfare: 1 };
    if (diff === 2) return { label: 'DOUBLE BOGEY', ace: false, fanfare: 1 };
    return { label: '+' + diff, ace: false, fanfare: 1 };
}

// Best-round bookkeeping: lower total-vs-par is better; null/undefined = no round yet.
export function isBetterRound(prevBest, total) {
    return prevBest === null || prevBest === undefined || total < prevBest;
}
