// Black Hole in One — shared mutable state (DOM-free)
'use strict';

export const S = {
    phase: 'menu',    // menu | rest | aiming | flight | orbit | sink | result | roundover
    mode: 'endless',  // 'endless' | 'round' (9 holes + scorecard)
    hole: 1,
    strokes: 0,
    totalDiff: 0,
    par: 2,
    paused: false,
    tFlight: 0,
    time: 0,          // cosmetic clock (twinkle, accretion spin)
    hopsThisHole: 0,  // distinct planets landed on during the current hole
    orbitCooldown: 0, // s remaining before another orbit can be captured (BH-4)
    roundCard: [],    // per finished hole: { hole, strokes, par, hopped }
};

export const world = {
    bodies: [],       // planets + tee + pulsars (black hole kept separately)
    blackHole: null,
    teeRock: null,
    lastRest: null,   // rest descriptor to return lost shots to
    sink: null,       // { r0, a0, t } while spiralling in
    orbit: null,      // { b, radius, ang, omega } while orbiting a planet (BH-4)
    trail: [],
    slingTrack: new Map(),
    hoppedBodies: new Set(),
    orbitedThisHole: new Set(),  // planets orbited this hole (first-per-hole toast)
};

export const comet = { x: 0, y: 0, vx: 0, vy: 0, rest: null };
