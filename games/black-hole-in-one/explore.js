// Black Hole in One — Explore mode (OW-1)
'use strict';

import { MAX_LAUNCH, MAX_DRAG, MIN_SHOT, rand, PALETTES, COMET_R, ORBIT_COOLDOWN, mulberry32, seedFromString } from './constants.js';
import { S, world, comet } from './state.js';
import { stepBody, collide, orbitCapture } from './physics.js';

let shownPushHint = false;   // OW-0: one-time mid-flight push toast

export const camera = { x: 50, y: 85 };
export let fuel = 100;

export let hooks = {
    toast() {}, bar() {}, burst() {},
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

export function getChunkPickups(cx, cy, seed) {
    if (cx < -SECTOR_LIMIT/CHUNK_SIZE - 2 || cx > SECTOR_LIMIT/CHUNK_SIZE + 2) return [];
    if (cy < -SECTOR_LIMIT/CHUNK_SIZE - 2 || cy > SECTOR_LIMIT/CHUNK_SIZE + 2) return [];

    const rng = mulberry32(seedFromString('pickups_' + seed + '_' + cx + '_' + cy));
    const chunkPickups = [];
    const numPickups = Math.floor(rng() * 4); // 0 to 3 pickups per chunk
    
    for (let i = 0; i < numPickups; i++) {
        const px = cx * CHUNK_SIZE + rng() * CHUNK_SIZE;
        const py = cy * CHUNK_SIZE + rng() * CHUNK_SIZE;
        chunkPickups.push({ x: px, y: py, r: 1.8, id: `p${cx}_${cy}_${i}` });
    }
    return chunkPickups;
}

export function updateActiveChunks() {
    const cx = Math.floor(camera.x / CHUNK_SIZE);
    const cy = Math.floor(camera.y / CHUNK_SIZE);
    if (cx === lastChunkX && cy === lastChunkY) return;
    
    activeBodies = [];
    pickups = [];
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            activeBodies.push(...getChunkBodies(cx + dx, cy + dy, worldSeed));
            pickups.push(...getChunkPickups(cx + dx, cy + dy, worldSeed));
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
    fuel = 100;
    
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
    
    fuel -= 15;
    if (fuel < 0) fuel = 0;
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
    
    // Check fuel pickups
    for (let i = world.pickups.length - 1; i >= 0; i--) {
        const p = world.pickups[i];
        const dx = comet.x - p.x;
        const dy = comet.y - p.y;
        if (Math.hypot(dx, dy) < COMET_R + p.r) {
            world.pickups.splice(i, 1);
            fuel = Math.min(100, fuel + 20);
            hooks.burst(p.x, p.y, 14, '#20e657', 20);
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
    
    if (fuel <= 0 && S.phase === 'rest') {
        respawnTown();
    }
}

function respawnTown() {
    hooks.toast('Empty tank! Towed back to town.');
    fuel = 100;
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
