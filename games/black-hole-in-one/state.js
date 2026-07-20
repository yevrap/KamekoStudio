// Black Hole in One — shared mutable state (DOM-free)
'use strict';

import { ITEMS, DEFAULT_MAP_SIZE, GLOSSARY_OBJECTS, GLOSSARY_MECHANICS } from './constants.js';

// Fresh default inventory, derived from the ITEMS registry so a new item never
// needs its default hand-duplicated here (INV-1).
export function defaultInventory() {
    const inv = {};
    for (const item of ITEMS) inv[item.key] = { owned: true, enabled: item.defaultOn ?? false };
    return inv;
}

// Merge a saved (possibly stale, corrupt, or null) inventory payload over fresh
// defaults, so an item added after a save was written is never left `undefined`
// at a call site — it just keeps its default until the player opts in.
export function mergeInventory(saved) {
    const merged = defaultInventory();
    if (saved && typeof saved === 'object') Object.assign(merged, saved);
    return merged;
}

// ---- Object glossary "seen" tracking (MM-18) -----------------------------------
// One boolean per GLOSSARY_OBJECTS/GLOSSARY_MECHANICS/ITEMS key, flipped true the
// first time a player actually encounters that thing in play (see markGlossarySeen
// call sites in gameplay.js/explore.js/ui.js) — a play-guide, not a flat list.
export function defaultGlossarySeen() {
    const seen = {};
    for (const e of GLOSSARY_OBJECTS) seen[e.key] = false;
    for (const e of GLOSSARY_MECHANICS) seen[e.key] = false;
    for (const item of ITEMS) seen[item.key] = false;
    return seen;
}

// Merge a saved (possibly stale, corrupt, or null) seen-map over fresh defaults —
// only known keys are carried over, so a glossary entry removed later can't leave
// a phantom `true` behind, and one added later starts unseen until earned.
export function mergeGlossarySeen(saved) {
    const merged = defaultGlossarySeen();
    if (saved && typeof saved === 'object') {
        for (const k of Object.keys(merged)) if (saved[k]) merged[k] = true;
    }
    return merged;
}

export const S = {
    phase: 'menu',    // menu | rest | aiming | flight | orbit | sink | result | roundover
    prevPhase: null,   // phase before 'aiming' started (mid-flight push return, OW-0)
    freezeAim: true,  // freeze comet during mid-flight aim (Explore)
    mode: 'endless',  // 'endless' | 'round' | 'explore' | 'survival'
    hole: 1,
    strokes: 0,
    totalDiff: 0,
    par: 2,
    fuel: 100,        // Survival mode fuel
    stardust: 0,      // Currency collected in Explore mode
    upgrades: { tank: 0, siphon: 0, sensor: 0 }, // Town Shop upgrade levels (EXP-1b), Explore only
    inventory: defaultInventory(), // Item toggles (INV-1), Explore only
    glossarySeen: defaultGlossarySeen(), // Object glossary "seen" flags (MM-18)
    paused: false,
    tFlight: 0,
    time: 0,          // cosmetic clock (twinkle, accretion spin)
    hopsThisHole: 0,  // distinct planets landed on during the current hole
    orbitCooldown: 0, // s remaining before another orbit can be captured (BH-4)
    liftoff: 0,       // s remaining of damped launch-planet gravity after liftoff (STAB-1)
    roundCard: [],    // per finished hole: { hole, strokes, par, hopped }
};

export const world = {
    bodies: [],       // planets + tee + pulsars (black hole kept separately)
    pickups: [],      // fuel pickups (Survival mode)
    asteroids: [],    // moving asteroids (Survival mode)
    blackHole: null,
    teeRock: null,
    lastRest: null,   // rest descriptor to return lost shots to
    sink: null,       // { r0, a0, t } while spiralling in
    warp: null,       // { b, r0, a0, t } while an Explore black-hole warp spirals to Town (OW-3)
    orbit: null,      // { b, radius, ang, omega } while orbiting a planet (BH-4)
    launchBody: null, // planet the comet just flicked off, for the liftoff grace (STAB-1)
    trail: [],
    slingTrack: new Map(),
    hoppedBodies: new Set(),
    orbitedThisHole: new Set(),  // planets orbited this hole (first-per-hole toast)
    mapSizeKey: DEFAULT_MAP_SIZE, // 'small' | 'large' — current editor/custom map canvas tier (MM-6);
                                   // always DEFAULT_MAP_SIZE outside editor/custom, so golf/endless are untouched
    activeMapData: null, // the mapData object last passed to startCustomMap(), so a
                          // restart while S.mode === 'custom' can reload the same map
                          // instead of falling through to golf's genHole() (FUEL-4)
};

export const comet = { x: 0, y: 0, vx: 0, vy: 0, rest: null };

// Flip one glossary key true the first time it's earned; returns whether it was
// newly set (false if already seen) so callers only re-persist/re-hook on an
// actual change, same convention as explore.js's markDiscovered.
export function markGlossarySeen(key) {
    if (S.glossarySeen[key]) return false;
    S.glossarySeen[key] = true;
    return true;
}
