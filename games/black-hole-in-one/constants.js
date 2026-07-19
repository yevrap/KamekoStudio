// Black Hole in One — static config + pure helpers (DOM-free, unit-tested)
'use strict';

export const WORLD_W = 200;   // expanded from 100 for larger maps
export const COURSE_H = 200;  // expanded from 170 for larger maps
                              // The course is no longer letterboxed.

// Map Maker canvas tiers (MM-6). 'small' matches golf/endless's own scale — it's
// also the default a map without a stored size falls back to on load, so pre-sprint
// saved/shared maps keep their exact current behavior. 'large' is sized to need real
// panning (the whole reason MM-16's overview mode exists) without being unusably huge.
export const MAP_SIZES = {
    small: { w: WORLD_W, h: COURSE_H },
    large: { w: 600, h: 600 },
};
export const DEFAULT_MAP_SIZE = 'small';
export function mapBounds(sizeKey) {
    return MAP_SIZES[sizeKey] || MAP_SIZES[DEFAULT_MAP_SIZE];
}

export const G = 400;                 // gravity constant
export const COMET_R = 1.6;
export const DT = 1 / 240;            // physics step
export const MAX_LAUNCH = 120;        // top launch speed (world units/s)
export const MAX_V = 175;             // hard speed cap in flight
export const MAX_DRAG = 40;           // drag length (world units) for full power
export const MIN_SHOT = 10;           // release below this speed = cancelled shot
export const TAP_MAX_LEN = 4;         // max drag length for a tap
export const REST_BOUNCE = 0.38;      // normal restitution on planet impact
export const REST_FRIC = 0.62;        // tangential keep on impact
export const REST_V = 22;             // impact below this = comet lands (17 in the draft —
                                      // widened so deliberate hops actually stick, Q4)
export const SOFT_CATCH = 1.6;        // impacts under REST_V*SOFT_CATCH bounce dead so the
                                      // next touch lands — "the planet catches you" (Q4)
export const SOFT_BOUNCE = 0.16;      // restitution for a soft-catch bounce
export const CAPTURE_R = 4.6;         // black hole sink radius
// Out-of-bounds margin beyond the course rect (golf modes only — Explore is an
// open chunked world with no such boundary). Widened from 14 (GOLF Mode
// Catch-Up, 2026-07-19): gravity is already the only force acting on the comet
// at any distance (gravityAt sums every body unconditionally, never clipped to
// the course rect), so a wide eccentric arc that would curve back on its own
// was getting killed the instant it crossed a boundary only ~7% past the
// course edge — the rectangle check only reads position, not trajectory. 4x
// the old margin gives gravity enough room to actually finish pulling a
// looping shot back before the hard cutoff; FLIGHT_CAP below stays the
// ultimate safety net for shots that are genuinely escaping.
export const OB_MARGIN = 56;
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
// so Explore becomes a flying game, not just a flicking one (T2). Do NOT raise
// MAX_V to make thrust feel faster — it's a tunneling guard (keeps per-step
// movement under COMET_R so collision can't skip past a body), not a taste knob;
// raising it needs swept collision first.
//
// INV-3c feel pass (2026-07-17): softened from 400 → 385 (Q3a, "less instant-on").
// The ceiling on how low this can go is the biggest Giant's surface gravity —
// G·r²/(r+COMET_R)² approaches G=400 asymptotically as r grows, so a giant
// (r up to ~40) always sits close to 370 u/s² regardless of density. That's also
// why explore.js's chunk generator lost its Giant ×1.5 / Dwarf ×2.0 mass
// multipliers in this same pass: with them, worst-case surface gravity hit
// ~555 u/s², which no THRUST_A this side of ~560 could unconditionally beat
// (Q3b). At THRUST_A=385, the worst case (giant, r→40, m=r², ~369.7 u/s²)
// still clears with ~4% margin — see the escape-guarantee test in
// tests/explore.test.mjs, which asserts this directly against gravityAt().
export const THRUST_A      = 385;  // world u/s² at full throttle
export const THRUST_BURN   = 8;    // fuel/second at full throttle (× throttle)
export const STICK_R_PX    = 46;   // CSS px from stick origin = full throttle (INV-3b)
export const STICK_DEAD_PX = 8;    // CSS px deadzone — a tap must not fire a blip (INV-3b)

// ---- Refuel station planets (FUEL-2), Explore only -----------------------------
// Yev's ask: "some planets should fully refuel you when you land on them... numerous
// so exploring without unlimited fuel is possible" — common (most chunks have one),
// landing-only (not a bounce trickle), visually distinct like the Town beacon.
export const REFUEL_STATION_CHANCE = 0.75; // odds a chunk gets one flagged station planet

// ---- Explore black holes (OW-3), Explore only -----------------------------------
// A rare seeded landmark body — flying close enough warps the comet to Town, with a
// Return Portal back to the exact spot (see explore.js beginWarp/useReturnPortal).
// Unlike FUEL-2's refuel flag (which marks an existing planet), this is its own body
// so it gets independent gravity + rendering. Radius is fixed (not randomized per
// body, unlike planets) and mass follows the same m=r² density convention as every
// other chunk-generator body — that formula's surface gravity is monotonically
// increasing in r and the Giant's r=40 ceiling already proves r≤40 clears THRUST_A
// (INV-3c, ~369.7 u/s² of 385); this body's r=22 sits well inside that safe range
// (~347.6 u/s², more margin than a Giant gets), so it stays Thruster-escapable with
// no THRUST_A/gravity special-casing.
export const EXPLORE_BLACKHOLE_CHANCE = 0.04;    // odds a chunk seeds one
export const EXPLORE_BLACKHOLE_R = 22;           // fixed visual/gravity radius
// Warp triggers at b.r * 0.3.
// Return Portal lands the comet directly into orbit.

// ---- Moons & rings (OW-5), decorative only, Explore only -----------------------
// Pure render-layer decoration attached to an existing Giant planet body (b.moon /
// b.ring) — never a body in its own right, so it's structurally incapable of
// exerting gravity or registering a collision: gravityAt/stepBody (physics.js)
// only ever iterate the `bodies` array, and a moon/ring is never pushed into it,
// just set as a property on a planet that's already there. Seeded once per planet
// at chunk-gen time so the assignment (moon vs ring vs neither, and its exact
// geometry) is stable across revisits — same convention as every other
// chunk-generator roll (refuel stations, black holes).
export const MOON_RING_CHANCE = 0.65;    // odds a Giant gets a moon or a ring
export const MOON_VS_RING_CHANCE = 0.5;  // of those, odds it's a moon (else a ring)
export const MOON_ORBIT_R_MIN = 1.6, MOON_ORBIT_R_MAX = 2.4;  // × planet radius
export const MOON_SIZE_MIN = 0.14, MOON_SIZE_MAX = 0.24;      // × planet radius
export const MOON_PERIOD_MIN = 14, MOON_PERIOD_MAX = 22;      // seconds per full orbit
export const RING_RADIUS_MIN = 1.3, RING_RADIUS_MAX = 1.9;    // × planet radius
export const RING_ARC_MIN = Math.PI * 0.9, RING_ARC_MAX = Math.PI * 1.8; // radians span
export const RING_TILT_MIN = 0.32, RING_TILT_MAX = 0.54;      // y-scale (ellipse squash)

// Moon world position at cosmetic time `t` (S.time). Fixed radius/period — a pure
// circular orbit, always exactly `moon.orbitR` from the planet center regardless
// of t. Pure — unit-tested for determinism (same t → same point) and for the
// fixed-radius guarantee (never drifts, since nothing here reads velocity/gravity).
export function moonPosition(planetX, planetY, moon, t) {
    const ang = moon.ang0 + (t / moon.period) * Math.PI * 2;
    return { x: planetX + Math.cos(ang) * moon.orbitR, y: planetY + Math.sin(ang) * moon.orbitR };
}

// ---- Stardust rings (ORB-4), Explore only ---------------------------------------
// A seeded pickup ring inside a planet's orbit-capture band (ORBIT_MIN_GAP..
// ORBIT_MAX_GAP past the surface) — riding the orbit (Orbit Magnet ON) sweeps
// every dot. Black holes never get one (dots near a warp radius would read as
// bait). Rolled last in getChunkBodies' rng stream, same convention as every
// other chunk-generator roll.
export const STARDUST_RING_CHANCE = 0.25;                     // odds a non-blackhole planet gets a ring
export const STARDUST_RING_COUNT_MIN = 5, STARDUST_RING_COUNT_MAX = 8; // dots per ring
export const STARDUST_RING_GAP_MIN = 0.3, STARDUST_RING_GAP_MAX = 0.7; // fraction of the orbit band past ORBIT_MIN_GAP

// ---- Star map fast travel (MAP-2) -----------------------------------------------
// Picks the closest hit target within its own radius of (mx,my), else null. Targets
// carry their own screen coords + hit radius — set by ui.js's renderStarMap() at
// draw time for Town + each discovered black hole — so this needs no canvas/DOM
// access itself and is unit-tested directly, same as every other pure helper here.
export function hitTestMapTargets(mx, my, targets) {
    let best = null, bestD = Infinity;
    for (const t of targets) {
        const d = Math.hypot(mx - t.x, my - t.y);
        if (d <= t.r && d < bestD) { best = t; bestD = d; }
    }
    return best;
}

// ---- Editor overview mode (MM-16) -----------------------------------------------
// Full-canvas coarse-placement view for the map editor — opened when a map is big
// enough that the 1:1 view can't show it all at once (the 'large' tier MM-6
// introduced). Pure fit-to-container + center transform, same approach as every
// other canvas view in this game (renderStarMap's cell grid, ui.resize()'s
// letterbox scale); kept here so the coordinate math is unit-tested without a
// DOM canvas. Dragging in overview converts straight to/from these same world
// coordinates, so it reuses editor.js's existing pointerDown/Move/Up unchanged —
// overview-placed and 1:1-placed bodies are identical on the wire.
export function overviewAvailable(sizeKey) { return sizeKey === 'large'; }
export function overviewTransform(w, h, cw, ch) {
    if (!(cw > 0) || !(ch > 0) || !(w > 0) || !(h > 0)) return { scale: 1, ox: 0, oy: 0 };
    const scale = Math.min(cw / w, ch / h);
    return { scale, ox: (cw - w * scale) / 2, oy: (ch - h * scale) / 2 };
}
export function overviewToWorld(px, py, t) { return { x: (px - t.ox) / t.scale, y: (py - t.oy) / t.scale }; }
export function worldToOverview(wx, wy, t) { return { x: t.ox + wx * t.scale, y: t.oy + wy * t.scale }; }

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
    { key: 'orbitMagnet', icon: '🧲', label: 'Orbit Magnet',
      desc: 'Planets catch you automatically. Tap a nearby planet to land. Tap it again to swing into orbit.',
      defaultOn: true },
];

// ---- Settings persistence keys (HUD-1) ---------------------------------------
// Shared between main.js (reads at boot) and ui.js (writes from the in-game
// ☰ Menu's Settings/Inventory tabs, which own this UI now that it's out of the
// shared arcade-settings drawer) so the two never drift apart on the key string.
export const LS_KEYS = {
    muted: 'blackHoleInOne_muted',
    freezeAim: 'blackHoleInOne_freezeAim',
    inventory: 'blackHoleInOne_inventory',
};

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
