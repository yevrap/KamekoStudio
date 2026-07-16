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

// ---- Orbit-and-flick (BH-4) --------------------------------------------------
// A near-circular pass around a planet snaps into a live, station-kept orbit the
// player then flicks out of (force-push: the flick impulse adds to the orbital
// velocity). Tuned to sit BETWEEN the two existing outcomes — slow tangential
// grazes still land/soft-catch, fast swings still SLINGSHOT away and escape —
// so only genuine "swung around but stayed" passes are captured.
export const ORBIT_MIN_GAP = 2.5;     // comet must clear the surface by this much to orbit
export const ORBIT_MAX_GAP = 13;      // ...and be no farther than surface+this (orbit hugs the planet)
export const ORBIT_MIN_TAN = 7;       // ignore near-stationary grazes (those land, not orbit)
export const ORBIT_RADIAL_TOL = 0.4;  // |radial speed| < this fraction of circular speed = "not diving"
export const ORBIT_SPEED_TOL = 0.42;  // tangential speed within ±this fraction of circular = snap to orbit
export const ORBIT_COOLDOWN = 0.45;   // seconds after leaving an orbit before re-capture is allowed
export const ORBIT_ARM_T = 0.22;      // don't capture in the first instants of a flick (let it leave the tee)

// ---- Liftoff grace (STAB-1) --------------------------------------------------
// A big planet's surface gravity (~G·r²/r² near the surface) can exceed a full
// flick, so a comet resting on one gets dragged straight back and re-lands in
// place — a soft-lock ("some planets too big can't escape"). Fix (decision D1=C:
// keep big planets, no new mechanic): for a brief window right after flicking OFF
// a planet surface, damp ONLY that launch planet's pull, ramping back to full, so
// the flick reliably carries the comet clear. Every other body's gravity — the
// "gravity is the club" feel — is untouched.
export const LIFTOFF_T = 0.35;        // seconds of reduced launch-planet gravity after liftoff
export const LIFTOFF_MIN = 0.3;       // launch-planet gravity scale at the liftoff instant (ramps to 1)

// Circular orbital speed at distance d from a body of mass m (v² = G·m/d, since
// centripetal a = v²/d must equal gravity G·m/d²). Pure — unit-tested.
export function circularSpeed(m, d) { return Math.sqrt(G * Math.abs(m) / d); }

export const PALETTES = [
    { base: '#e2725b', dark: '#8c3a2c', name: 'rust' },
    { base: '#57c7c2', dark: '#20635f', name: 'teal' },
    { base: '#9b7bd4', dark: '#4b3378', name: 'violet' },
    { base: '#d8b56b', dark: '#7a5f2a', name: 'sand' },
    { base: '#7fb0e0', dark: '#33567e', name: 'ice' },
];

export function rand(a, b) { return a + Math.random() * (b - a); }
export function dist(ax, ay, bx, by) { return Math.hypot(bx - ax, by - ay); }

// ── Seeded PRNG ────────────────────────────────────────────────────────────
export function mulberry32(seed) {
    let h = seed | 0;
    return function () {
        h = Math.imul(h ^ (h >>> 16), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        h ^= h >>> 16;
        return (h >>> 0) / 4294967296;
    };
}

export function seedFromString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return hash;
}


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
