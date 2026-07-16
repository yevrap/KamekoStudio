// Black Hole in One — Explore mode (OW-1)
'use strict';

import { MAX_LAUNCH, MAX_DRAG, MIN_SHOT, rand, PALETTES, COMET_R, ORBIT_COOLDOWN, mulberry32, seedFromString, upgradeCost, tankMaxFuel, siphonGain, sensorChunkRadius } from './constants.js';
import { S, world, comet } from './state.js';
import { stepBody, collide, orbitCapture } from './physics.js';

let shownPushHint = false;   // OW-0: one-time mid-flight push toast

export const camera = { x: 50, y: 85 };
export let fuel = 100;

export let hooks = {
    toast() {}, bar() {}, burst() {}, stardust() {}, upgrades() {},
    sfx: { flick() {}, bounce() {}, land() {}, sling() {} },
};
export function setHooks(h) { hooks = Object.assign(hooks, h); }

export function screenToWorld(sx, sy, scale, vw, vh, camX, camY) {
    return [
        sx / scale - vw / 2 + camX,
        sy / scale - vh / 2 + camY
    ];
}

export function worldToScreen(wx, wy, scale, vw, vh, camX, camY) {
    return [
        (wx - camX + vw / 2) * scale,
        (wy - camY + vh / 2) * scale
    ];
}

export let worldSeed = 'explore-1';
export const CHUNK_SIZE = 400; // Size of a chunk in world units
export const SECTOR_LIMIT = 3000; // Bounded sector size

let activeBodies = [];
export let pickups = [];
let lastChunkX = null;
let lastChunkY = null;

export function getChunkBodies(cx, cy, seed) {
    // Exclude chunks way outside the sector
    if (cx < -SECTOR_LIMIT/CHUNK_SIZE - 2 || cx > SECTOR_LIMIT/CHUNK_SIZE + 2) return [];
    if (cy < -SECTOR_LIMIT/CHUNK_SIZE - 2 || cy > SECTOR_LIMIT/CHUNK_SIZE + 2) return [];

    const rng = mulberry32(seedFromString(seed + '_' + cx + '_' + cy));
    const bodies = [];
    const numBodies = Math.floor(rng() * 4) + 2; // 2 to 5 bodies per chunk
    
    for (let i = 0; i < numBodies; i++) {
        const typeRand = rng();
        let r, m;
        if (typeRand < 0.1) {
            r = 25 + rng() * 15; m = r * r * 1.5; // Giant
        } else if (typeRand < 0.3) {
            r = 4 + rng() * 4; m = r * r * 2.0; // Dwarf
        } else if (typeRand < 0.4) {
            // Binary pair
            r = 10 + rng() * 8; m = r * r;
            const dist = r * 2.5 + rng() * 20;
            const ang = rng() * Math.PI * 2;
            const bx = cx * CHUNK_SIZE + rng() * CHUNK_SIZE;
            const by = cy * CHUNK_SIZE + rng() * CHUNK_SIZE;
            const pal1 = PALETTES[Math.floor(rng() * PALETTES.length)];
            const pal2 = PALETTES[Math.floor(rng() * PALETTES.length)];
            bodies.push({ x: bx, y: by, r, m, type: 'planet', pal: pal1, spin: rng() * Math.PI * 2, id: `c${cx}_${cy}_${i}_a` });
            bodies.push({ x: bx + Math.cos(ang) * dist, y: by + Math.sin(ang) * dist, r, m, type: 'planet', pal: pal2, spin: rng() * Math.PI * 2, id: `c${cx}_${cy}_${i}_b` });
            continue;
        } else {
            r = 8 + rng() * 12; m = r * r; // Normal
        }
        
        const px = cx * CHUNK_SIZE + rng() * CHUNK_SIZE;
        const py = cy * CHUNK_SIZE + rng() * CHUNK_SIZE;
        const pal = PALETTES[Math.floor(rng() * PALETTES.length)];
        bodies.push({ x: px, y: py, r, m, type: 'planet', pal, spin: rng() * Math.PI * 2, id: `c${cx}_${cy}_${i}` });
    }
    
    // Intra-chunk overlap resolution (deterministic)
    for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
            const b1 = bodies[i], b2 = bodies[j];
            if (!b1 || !b2) continue;
            if (Math.hypot(b1.x - b2.x, b1.y - b2.y) < b1.r + b2.r + 5) bodies[j] = null;
        }
    }
    return bodies.filter(b => b !== null);
}

// A pickup at (px,py) with radius `r` is unreachable if it overlaps a planet's
// collision boundary — the comet can never get closer to a planet's center
// than b.r + COMET_R (stepBody() stops it there), so the pickup must clear
// that plus its own radius. PICKUP_CLEARANCE adds a small gap so pickups
// aren't spawned flush against the boundary either.
const PICKUP_CLEARANCE = 2;
export function pickupBlockedByBody(px, py, r, bodies) {
    return bodies.some(b => Math.hypot(px - b.x, py - b.y) < b.r + COMET_R + r + PICKUP_CLEARANCE);
}

export function getChunkPickups(cx, cy, seed, bodies = []) {
    if (cx < -SECTOR_LIMIT/CHUNK_SIZE - 2 || cx > SECTOR_LIMIT/CHUNK_SIZE + 2) return [];
    if (cy < -SECTOR_LIMIT/CHUNK_SIZE - 2 || cy > SECTOR_LIMIT/CHUNK_SIZE + 2) return [];

    const rng = mulberry32(seedFromString('pickups_' + seed + '_' + cx + '_' + cy));
    const chunkPickups = [];

    // Reject-and-resample: reroll a candidate spot up to 10 times if it lands
    // inside a planet; skip the pickup entirely if a chunk is too crowded to
    // find a clear spot (rare — e.g. a giant planet filling most of the chunk).
    function placeClear(r) {
        for (let attempt = 0; attempt < 10; attempt++) {
            const px = cx * CHUNK_SIZE + rng() * CHUNK_SIZE;
            const py = cy * CHUNK_SIZE + rng() * CHUNK_SIZE;
            if (!pickupBlockedByBody(px, py, r, bodies)) return [px, py];
        }
        return null;
    }

    // 0 to 2 fuel pickups per chunk
    const numFuel = Math.floor(rng() * 3);
    for (let i = 0; i < numFuel; i++) {
        const pos = placeClear(1.8);
        if (!pos) continue;
        chunkPickups.push({ x: pos[0], y: pos[1], r: 1.8, type: 'fuel', id: `pf${cx}_${cy}_${i}` });
    }
    // 0 to 4 stardust pickups per chunk
    const numStardust = Math.floor(rng() * 5);
    for (let i = 0; i < numStardust; i++) {
        const pos = placeClear(1.2);
        if (!pos) continue;
        chunkPickups.push({ x: pos[0], y: pos[1], r: 1.2, type: 'stardust', id: `ps${cx}_${cy}_${i}` });
    }
    return chunkPickups;
}

export function updateActiveChunks() {
    const cx = Math.floor(camera.x / CHUNK_SIZE);
    const cy = Math.floor(camera.y / CHUNK_SIZE);
    if (cx === lastChunkX && cy === lastChunkY) return;

    const radius = sensorChunkRadius(S.upgrades.sensor);
    activeBodies = [];
    pickups = [];

    // Cache per-chunk bodies (pure fn of cx,cy,seed) so the 3x3 neighbor lookup
    // below doesn't recompute chunks we've already generated.
    const bodyCache = new Map();
    function bodiesAt(bcx, bcy) {
        const key = bcx + '_' + bcy;
        let b = bodyCache.get(key);
        if (!b) { b = getChunkBodies(bcx, bcy, worldSeed); bodyCache.set(key, b); }
        return b;
    }

    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
            const ccx = cx + dx, ccy = cy + dy;
            activeBodies.push(...bodiesAt(ccx, ccy));

            // Bodies aren't confined to their own chunk's bounds (a binary pair's
            // second body, or a giant planet's radius, can bleed into a neighbor) —
            // so pickup placement checks the surrounding 3x3 chunks, not just this one.
            const neighborBodies = [];
            for (let nx = -1; nx <= 1; nx++) {
                for (let ny = -1; ny <= 1; ny++) {
                    neighborBodies.push(...bodiesAt(ccx + nx, ccy + ny));
                }
            }
            pickups.push(...getChunkPickups(ccx, ccy, worldSeed, neighborBodies));
        }
    }
    
    if (cx >= -1 && cx <= 1 && cy >= -1 && cy <= 1) {
        if (!world.teeRock) world.teeRock = { x: 50, y: 85, r: 3.4, m: 8, type: 'tee', id: 'tee' };
        activeBodies.push(world.teeRock);
    }
    
    if (world.teeRock) {
        activeBodies = activeBodies.filter(b => b.type === 'tee' || Math.hypot(b.x - world.teeRock.x, b.y - world.teeRock.y) >= b.r + 30);
    }
    
    world.bodies = activeBodies;
    world.pickups = pickups;
    lastChunkX = cx;
    lastChunkY = cy;
}

export function startRun() {
    S.mode = 'explore';
    S.phase = 'rest';
    
    worldSeed = 'explore-1'; // Hardcoded for Sprint 1 until persists
    lastChunkX = null;
    lastChunkY = null;
    fuel = tankMaxFuel(S.upgrades.tank);
    
    world.teeRock = { x: 50, y: 85, r: 3.4, m: 8, type: 'tee', id: 'tee' };
    camera.x = 50;
    camera.y = 85;
    
    updateActiveChunks();
    
    world.blackHole = null;
    
    comet.vx = comet.vy = 0;
    comet.rest = { b: world.teeRock, ang: -Math.PI / 2 };
    placeOnRest();
    world.lastRest = { rest: comet.rest };
    
    world.trail = [];
    world.slingTrack = new Map();
    world.hoppedBodies = new Set();
    world.orbitedThisHole = new Set();
    world.orbit = null;
    S.orbitCooldown = 0;
    
    hooks.bar();
}

function placeOnRest() {
    const r = comet.rest;
    comet.x = r.b.x + Math.cos(r.ang) * (r.b.r + COMET_R + 0.25);
    comet.y = r.b.y + Math.sin(r.ang) * (r.b.r + COMET_R + 0.25);
}

export function launch(dx, dy, len) {
    if (fuel <= 0) return false;
    const speed = Math.min(len / MAX_DRAG, 1) * MAX_LAUNCH;
    if (speed < MIN_SHOT) {
        // Cancelled shot: return to whatever we were in before aiming
        if (S.phase === 'aiming') S.phase = world.orbit ? 'orbit' : (S.prevPhase === 'flight' ? 'flight' : 'rest');
        return false;
    }

    // Endless Flight (INV-1) is a fuel-lock, not just a no-tow toggle: the tank
    // doesn't drain at all while it's enabled.
    if (!S.inventory.endlessFlight?.enabled) {
        fuel -= 15;
        if (fuel < 0) fuel = 0;
    }
    hooks.bar();
    
    // OW-0: one-time mid-flight push hint
    if (S.prevPhase === 'flight' && !shownPushHint) {
        shownPushHint = true;
        hooks.toast('🚀 Mid-flight push!');
    }
    
    comet.vx += dx / len * speed;
    comet.vy += dy / len * speed;
    world.orbit = null;
    S.orbitCooldown = ORBIT_COOLDOWN;
    S.phase = 'flight';
    if (S.prevPhase !== 'flight') world.trail = [];  // Keep trail on mid-flight pushes
    hooks.sfx.flick();
    return true;
}

export function step(dt) {
    if (S.orbitCooldown > 0) S.orbitCooldown = Math.max(0, S.orbitCooldown - dt);
    
    const res = stepBody(comet, dt, world.bodies, null);
    
    if (res && res.hit) {
        const c = collide(comet, res.hit);
        if (c.landed) {
            comet.rest = { b: res.hit, ang: c.ang };
            placeOnRest();
            comet.vx = comet.vy = 0;
            world.lastRest = { rest: comet.rest };
            world.orbit = null;
            S.phase = 'rest';
            world.trail = [];
            hooks.sfx.land();
            hooks.burst(comet.x, comet.y, 5, '#fff', 10);
        } else if (c.bounced) {
            hooks.sfx.bounce(c.k);
            hooks.burst(comet.x, comet.y, 7, res.hit.pal ? res.hit.pal.base : '#aaa', 18);
        }
    }
    
    // Check pickups
    for (let i = world.pickups.length - 1; i >= 0; i--) {
        const p = world.pickups[i];
        const dx = comet.x - p.x;
        const dy = comet.y - p.y;
        if (Math.hypot(dx, dy) < COMET_R + p.r) {
            world.pickups.splice(i, 1);
            if (p.type === 'fuel') {
                fuel = Math.min(tankMaxFuel(S.upgrades.tank), fuel + siphonGain(S.upgrades.siphon));
                hooks.burst(p.x, p.y, 14, '#20e657', 20);
            } else if (p.type === 'stardust') {
                S.stardust += 1;
                hooks.stardust(S.stardust);
                hooks.burst(p.x, p.y, 8, '#ffd98a', 15);
            }
            hooks.bar();
        }
    }
    
    if (S.orbitCooldown <= 0 && S.phase === 'flight') {
        for (const b of world.bodies) {
            const cap = orbitCapture(comet, b);
            if (cap) {
                world.orbit = { b, radius: cap.radius, ang: cap.ang, omega: cap.omega };
                comet.x = b.x + Math.cos(cap.ang) * cap.radius;
                comet.y = b.y + Math.sin(cap.ang) * cap.radius;
                const spd = cap.omega * cap.radius;
                comet.vx = -Math.sin(cap.ang) * spd;
                comet.vy = Math.cos(cap.ang) * spd;
                S.phase = 'orbit';
                world.trail = [];
                hooks.sfx.sling();
                hooks.burst(comet.x, comet.y, 12, (b.pal && b.pal.base) || '#9fe3d8', 26);
                break;
            }
        }
    }
    
    updateActiveChunks();
    
    // Bounded sector for OW-2
    if (comet.x < -SECTOR_LIMIT || comet.x > SECTOR_LIMIT || comet.y < -SECTOR_LIMIT || comet.y > SECTOR_LIMIT) {
        // Soft nudge back
        comet.vx -= (comet.x > 0 ? 1 : -1) * dt * 20;
        comet.vy -= (comet.y > 0 ? 1 : -1) * dt * 20;
    }
    
    updateCamera(dt);

    if (S.phase === 'rest' && shouldTowHome(fuel, S.inventory)) {
        respawnTown();
    }
}

// True when an empty tank at rest should force a tow back to Town — today's
// default, unless Endless Flight (INV-1) is enabled. Pure and unit-tested;
// `fuel` has no exported setter, so the respawnTown() wiring itself is
// verified in-browser rather than driven through this predicate in a test.
export function shouldTowHome(fuel, inventory) {
    return fuel <= 0 && !inventory.endlessFlight?.enabled;
}

// Instantly tops the tank off. Endless Flight (INV-1) is a fuel-lock: switching
// it on shouldn't require draining first, so the toggle calls this immediately.
export function refuelFull() {
    fuel = tankMaxFuel(S.upgrades.tank);
    hooks.bar();
}

function respawnTown() {
    hooks.toast('Empty tank! Towed back to town.');
    fuel = tankMaxFuel(S.upgrades.tank);
    camera.x = 50;
    camera.y = 85;
    comet.vx = comet.vy = 0;
    comet.rest = { b: world.teeRock, ang: -Math.PI / 2 };
    placeOnRest();
    world.lastRest = { rest: comet.rest };
    world.orbit = null;
    S.phase = 'rest';
    world.trail = [];
    hooks.bar();
}

// True when the comet is at rest on the Town tee rock — the Town Shop (EXP-1b)
// is only offered here, not mid-flight or elsewhere in the sector.
export function atTown() {
    return S.mode === 'explore' && S.phase === 'rest'
        && !!(comet.rest && comet.rest.b && comet.rest.b.type === 'tee');
}

// Buy the next level of upgrade `key` ('tank', 'siphon', or 'sensor'). Returns false
// without side effects if not at Town, maxed out, or short on stardust. Fuel Tank
// purchases add the capacity delta to the current tank rather than topping it off,
// so buying doesn't grant a free full refill.
export function buyUpgrade(key) {
    if (!atTown()) return false;
    const level = S.upgrades[key] || 0;
    const cost = upgradeCost(level);
    if (cost === null || S.stardust < cost) return false;

    S.stardust -= cost;
    S.upgrades[key] = level + 1;
    hooks.stardust(S.stardust);
    hooks.upgrades(S.upgrades);

    if (key === 'tank') {
        const oldMax = tankMaxFuel(level);
        const newMax = tankMaxFuel(level + 1);
        fuel = Math.min(newMax, fuel + (newMax - oldMax));
        hooks.toast(`⬆️ Fuel Tank upgraded to L${S.upgrades.tank}`);
    } else if (key === 'siphon') {
        hooks.toast(`⬆️ Fuel Siphon upgraded to L${S.upgrades.siphon}`);
    } else if (key === 'sensor') {
        // Force an immediate chunk reload so the wider net is visible right away —
        // updateActiveChunks() otherwise only recomputes when the camera crosses
        // into a new chunk, which won't happen while resting at Town post-purchase.
        lastChunkX = null;
        lastChunkY = null;
        updateActiveChunks();
        hooks.toast(`⬆️ Long-Range Sensor upgraded to L${S.upgrades.sensor}`);
    }
    hooks.bar();
    return true;
}

export function stepOrbit(dt) {
    if (!world.orbit) return;
    const o = world.orbit;
    o.ang += o.omega * dt;
    comet.x = o.b.x + Math.cos(o.ang) * o.radius;
    comet.y = o.b.y + Math.sin(o.ang) * o.radius;
    const spd = o.omega * o.radius;
    comet.vx = -Math.sin(o.ang) * spd;
    comet.vy =  Math.cos(o.ang) * spd;

    // Centre the camera on the orbited body (not the comet whipping around the rim)
    // so the whole orbit is framed — this, plus the STAB-2 zoom-out, makes a giant's
    // orbit readable instead of running off-screen. Also kills the MM-4 dizzy spin.
    camera.x += (o.b.x - camera.x) * Math.min(1, dt * 3);
    camera.y += (o.b.y - camera.y) * Math.min(1, dt * 3);

    updateActiveChunks();
}

function updateCamera(dt) {
    // Smooth camera follow
    camera.x += (comet.x - camera.x) * dt * 4;
    camera.y += (comet.y - camera.y) * dt * 4;
}
