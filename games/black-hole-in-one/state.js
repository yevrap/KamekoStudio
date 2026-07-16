// Black Hole in One — shared mutable state (DOM-free)
'use strict';

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
    orbit: null,      // { b, radius, ang, omega } while orbiting a planet (BH-4)
    launchBody: null, // planet the comet just flicked off, for the liftoff grace (STAB-1)
    trail: [],
    slingTrack: new Map(),
    hoppedBodies: new Set(),
    orbitedThisHole: new Set(),  // planets orbited this hole (first-per-hole toast)
};

export const comet = { x: 0, y: 0, vx: 0, vy: 0, rest: null };
