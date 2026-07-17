// Black Hole in One — static config + pure helpers (DOM-free, unit-tested)
'use strict';

export const WORLD_W = 200;   // expanded from 100 for larger maps
export const COURSE_H = 200;  // expanded from 170 for larger maps
                              // The course is no longer letterboxed.

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

// ---- Temporary zoom-out (STAB-2) ---------------------------------------------
// While orbiting — or hugging — a body too big to read at the normal one-screen
// scale (Explore's giant planets, r up to ~40), the view gently zooms OUT so the
// whole orbit / planet fits, then snaps back (decision D2=b). fitZoom() is the
// pure fit calc: how much to scale so a world-span fills ZOOM_FIT of the smaller
// viewport dimension, clamped to [ZOOM_MIN, 1]. It returns 1 (no zoom) whenever
// the span already fits — which is ALWAYS true for golf's small bodies, so golf
// keeps its camera-free one-screen framing untouched.
export const ZOOM_FIT = 0.82;         // fraction of the smaller viewport dim the focus should fill
export const ZOOM_MIN = 0.45;         // never zoom out past this
export const ZOOM_LERP = 4.5;         // per-second smoothing toward the target zoom
export function fitZoom(span, viewMin) {
    if (!(span > 0) || !(viewMin > 0)) return 1;
    const z = (viewMin * ZOOM_FIT) / span;
    return z >= 1 ? 1 : Math.max(z, ZOOM_MIN);
}

// Circular orbital speed at distance d from a body of mass m (v² = G·m/d, since
// centripetal a = v²/d must equal gravity G·m/d²). Pure — unit-tested.
export function circularSpeed(m, d) { return Math.sqrt(G * Math.abs(m) / d); }

// ---- Town Shop upgrades (EXP-1b) ---------------------------------------------
// Permanent, stardust-bought upgrades scoped to Explore only — Endless's fuel
// system stays untouched so its high-score runs remain comparable session to
// session. Shared cost curve across all upgrade types (15/35/60 for L1/L2/L3).
export const UPGRADE_MAX_LEVEL = 3;
export const UPGRADE_COSTS = [15, 35, 60];
export const FUEL_TANK_LEVELS = [100, 130, 160, 200]; // max fuel by tank level (0-3)

// Stardust cost to buy the NEXT level above `level`; null once maxed (L3).
export function upgradeCost(level) { return level < UPGRADE_MAX_LEVEL ? UPGRADE_COSTS[level] : null; }
export function tankMaxFuel(level) { return FUEL_TANK_LEVELS[Math.max(0, Math.min(level, UPGRADE_MAX_LEVEL))]; }

// Fuel gained per pickup by Fuel Siphon level (EXP-1c), Explore only.
export const FUEL_SIPHON_LEVELS = [20, 28, 36, 45];
export function siphonGain(level) { return FUEL_SIPHON_LEVELS[Math.max(0, Math.min(level, UPGRADE_MAX_LEVEL))]; }

// Long-Range Sensor (EXP-1d): active-chunk load radius (in chunks) around the camera
// in updateActiveChunks(). Base is 1 (today's fixed 3×3 window, 9 chunks); each level
// adds one full ring (5×5, 7×7, 9×9 at L1-L3) so every purchased tier is a distinct,
// observable improvement — the design doc's +25/50/75% framing doesn't map onto whole
// chunks cleanly (chunk radius must be an integer), so this uses the doc's own goal
// ("loads/renders bodies and pickups farther out") rather than the literal percentages.
// Gravity sums over every loaded body every physics step (240 Hz), but per-body work is
// cheap arithmetic (one sqrt), so even the L3 worst case (~400 bodies) is negligible.
export const SENSOR_RADIUS_LEVELS = [1, 2, 3, 4];
export function sensorChunkRadius(level) { return SENSOR_RADIUS_LEVELS[Math.max(0, Math.min(level, UPGRADE_MAX_LEVEL))]; }

// ---- Thruster (INV-3), Explore only --------------------------------------------
// Analog thrust stick that replaces the flick while enabled (T1/T6): direction +
// throttle from one input, strong enough to beat every planet's surface gravity
// (max ~370 u/s² at a giant, since G=400) so Explore becomes a flying game, not
// just a flicking one (T2). Do NOT raise MAX_V to make thrust feel faster — it's a
// tunneling guard (keeps per-step movement under COMET_R so collision can't skip
// past a body), not a taste knob; raising it needs swept collision first.
export const THRUST_A      = 400;  // world u/s² at full throttle
export const THRUST_BURN   = 8;    // fuel/second at full throttle (× throttle)
export const STICK_R_PX    = 46;   // CSS px from stick origin = full throttle (INV-3b)
export const STICK_DEAD_PX = 8;    // CSS px deadzone — a tap must not fire a blip (INV-3b)

// ---- Inventory registry (INV-1) -----------------------------------------------
// A mechanic testbed, not a shop: one entry per experimental gameplay modifier,
// toggled from the settings drawer, Explore only. `owned` defaults true — there's
// no purchase or discovery yet (deferred; see the Explore Inventory System note).
// Adding item N+1 is one entry here plus one hook at its usage site.
export const ITEMS = [
    { key: 'endlessFlight', icon: '♾️', label: 'Endless Flight',
      desc: 'Full tank, forever — fuel stops draining until you switch it off.' },
    { key: 'thruster', icon: '🚀', label: 'Thruster',
      desc: 'Fly with a stick instead of flicking. Hold to burn — fuel drains while you thrust.' },
];

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
