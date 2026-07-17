// Black Hole in One — Explore mode (OW-1)
'use strict';

import { MAX_LAUNCH, MAX_DRAG, MIN_SHOT, rand, dist, PALETTES, COMET_R, ORBIT_COOLDOWN, mulberry32, seedFromString, upgradeCost, tankMaxFuel, siphonGain, sensorChunkRadius, THRUST_A, THRUST_BURN, STICK_R_PX, STICK_DEAD_PX, REFUEL_STATION_CHANCE, EXPLORE_BLACKHOLE_CHANCE, EXPLORE_BLACKHOLE_R, EXPLORE_RETURN_NUDGE, exploreBlackHoleWarpR, MOON_RING_CHANCE, MOON_VS_RING_CHANCE, MOON_ORBIT_R_MIN, MOON_ORBIT_R_MAX, MOON_SIZE_MIN, MOON_SIZE_MAX, MOON_PERIOD_MIN, MOON_PERIOD_MAX, RING_RADIUS_MIN, RING_RADIUS_MAX, RING_ARC_MIN, RING_ARC_MAX, RING_TILT_MIN, RING_TILT_MAX } from './constants.js';
import { S, world, comet } from './state.js';
import { stepBody, collide, orbitCapture } from './physics.js';

let shownPushHint = false;   // OW-0: one-time mid-flight push toast

export const camera = { x: 50, y: 85 };
export let fuel = 100;

export let hooks = {
    toast() {}, bar() {}, burst() {}, stardust() {}, upgrades() {}, exploreHome() {}, discovery() {},
    sfx: { flick() {}, bounce() {}, land() {}, sling() {}, sink() {} },
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

// OW-3: the Return Portal's bookmark — which black hole (id, for reference) and the
// exact world position the comet warped in from, so the portal can send it back to
// that same spot. Persisted across reload (blackHoleInOne_exploreHome) the same way
// as upgrades/stardust — set via loadExploreHome() at boot, NOT reset by startRun()
// (same lifetime as upgrades, cleared only by "Clear All Game Data").
export let exploreHome = null; // { blackHoleId, bhX, bhY, x, y }
export function loadExploreHome(h) { exploreHome = (h && typeof h === 'object') ? h : null; }

// OW-9: fog-of-war discovery — the set of chunk keys ("cx_cy") the comet has
// physically flown through, backing the zoom-out star map (ui.js). Persisted
// across reload (blackHoleInOne_discoveredChunks), same lifetime as the Return
// Portal bookmark above — set via loadDiscoveredChunks() at boot, NOT reset by
// startRun(), cleared only by "Clear All Game Data".
export let discoveredChunks = new Set();
export function loadDiscoveredChunks(arr) {
    discoveredChunks = new Set(Array.isArray(arr) ? arr : []);
}

export function chunkKeyAt(x, y) {
    return Math.floor(x / CHUNK_SIZE) + '_' + Math.floor(y / CHUNK_SIZE);
}

// Marks the chunk under (x,y) discovered, once. step()/stepOrbit() call this every
// physics tick while flying/orbiting, so hooks.discovery only fires — and only then
// persists — on an actual new discovery, not every frame.
function markDiscovered(x, y) {
    const key = chunkKeyAt(x, y);
    if (discoveredChunks.has(key)) return;
    discoveredChunks.add(key);
    hooks.discovery(Array.from(discoveredChunks));
}

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
        let r, m, isGiant = false;
        if (typeRand < 0.1) {
            isGiant = true;
            r = 25 + rng() * 15; m = r * r; // Giant (INV-3c: dropped the 1.5x density
            // bump — mass already scales r², so a giant is still up to 100x a dwarf's
            // mass on size alone. The bump pushed surface gravity as high as ~555 u/s²,
            // above any THRUST_A a "beats every planet unconditionally" guarantee could
            // survive tuning down to. See the Thruster & Flight Controls note.
        } else if (typeRand < 0.3) {
            r = 4 + rng() * 4; m = r * r; // Dwarf (INV-3c: dropped the 2.0x density bump, same reason)
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
        bodies.push({ x: px, y: py, r, m, type: 'planet', pal, spin: rng() * Math.PI * 2, id: `c${cx}_${cy}_${i}`, giant: isGiant });
    }
    
    // Intra-chunk overlap resolution (deterministic)
    for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
            const b1 = bodies[i], b2 = bodies[j];
            if (!b1 || !b2) continue;
            if (Math.hypot(b1.x - b2.x, b1.y - b2.y) < b1.r + b2.r + 5) bodies[j] = null;
        }
    }
    const survivors = bodies.filter(b => b !== null);

    // Refuel stations (FUEL-2): rolled after body generation/overlap-resolution so
    // it never perturbs the giant/dwarf/binary/normal mix or positions above — same
    // rng stream, just consumed last, so a chunk's body layout is unchanged whether
    // or not it happens to get a station.
    if (survivors.length > 0 && rng() < REFUEL_STATION_CHANCE) {
        survivors[Math.floor(rng() * survivors.length)].refuelStation = true;
    }

    // Explore black holes (OW-3): a rare, seeded landmark — its own body (not a flag
    // on an existing planet like the refuel roll above) so it gets independent
    // gravity + rendering. Rolled last, after everything above, so neither the body
    // mix nor the refuel odds for any given chunk change from adding this — same rng
    // stream, just consumed after everything else already decided. Retries a few
    // clear spots (reject-and-resample, same pattern as getChunkPickups' placeClear)
    // and simply skips the chunk if none open up — rare enough that losing an
    // occasional one to a crowded chunk doesn't matter.
    if (rng() < EXPLORE_BLACKHOLE_CHANCE) {
        const r = EXPLORE_BLACKHOLE_R;
        for (let attempt = 0; attempt < 6; attempt++) {
            const bx = cx * CHUNK_SIZE + rng() * CHUNK_SIZE;
            const by = cy * CHUNK_SIZE + rng() * CHUNK_SIZE;
            if (survivors.some(b => Math.hypot(b.x - bx, b.y - by) < b.r + r + 10)) continue;
            survivors.push({ x: bx, y: by, r, m: r * r, type: 'blackhole', id: `bh${cx}_${cy}` });
            break;
        }
    }

    // Moons & rings (OW-5): decorative only — rolled last, after everything above,
    // so neither the body mix nor the refuel/black-hole odds change from adding
    // this — same rng stream, just consumed after everything else already decided.
    // Giants only (the natural candidate per spec — big enough to carry a moon/ring
    // without reading as clutter on a small dwarf/normal planet). Set as a property
    // (b.moon / b.ring) on the planet object already in `survivors`, never pushed
    // as its own entry — see constants.js's moonPosition doc for why that makes
    // gravity/collision interaction structurally impossible, not just untested.
    for (const b of survivors) {
        if (!b.giant) continue;
        if (rng() >= MOON_RING_CHANCE) continue;
        if (rng() < MOON_VS_RING_CHANCE) {
            b.moon = {
                orbitR: b.r * (MOON_ORBIT_R_MIN + rng() * (MOON_ORBIT_R_MAX - MOON_ORBIT_R_MIN)),
                size: b.r * (MOON_SIZE_MIN + rng() * (MOON_SIZE_MAX - MOON_SIZE_MIN)),
                period: MOON_PERIOD_MIN + rng() * (MOON_PERIOD_MAX - MOON_PERIOD_MIN),
                ang0: rng() * Math.PI * 2,
                pal: PALETTES[Math.floor(rng() * PALETTES.length)],
            };
        } else {
            b.ring = {
                radius: b.r * (RING_RADIUS_MIN + rng() * (RING_RADIUS_MAX - RING_RADIUS_MIN)),
                arcStart: rng() * Math.PI * 2,
                arcLen: RING_ARC_MIN + rng() * (RING_ARC_MAX - RING_ARC_MIN),
                tilt: RING_TILT_MIN + rng() * (RING_TILT_MAX - RING_TILT_MIN),
            };
        }
    }

    return survivors;
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

// Spend fuel, unless Endless Flight (INV-1) has the tank locked. Every fuel cost
// in Explore goes through here so item N+1 (the Thruster's per-second burn) gets
// the fuel-lock interaction for free instead of re-checking it at each call site.
function burnFuel(amount) {
    if (S.inventory.endlessFlight?.enabled) return;
    fuel = Math.max(0, fuel - amount);
}

export function launch(dx, dy, len) {
    if (fuel <= 0) return false;
    const speed = Math.min(len / MAX_DRAG, 1) * MAX_LAUNCH;
    if (speed < MIN_SHOT) {
        // Cancelled shot: return to whatever we were in before aiming
        if (S.phase === 'aiming') S.phase = world.orbit ? 'orbit' : (S.prevPhase === 'flight' ? 'flight' : 'rest');
        return false;
    }

    burnFuel(15);
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

// ---- Thruster (INV-3a/b): keyboard + floating-stick input, thrust vector ---
// Transient input state, not game state — module scope, not `S` (nothing here
// persists or serializes).
const MOVE_KEYS = new Map([
    ['ArrowUp', [0, -1]], ['KeyW', [0, -1]],
    ['ArrowDown', [0, 1]], ['KeyS', [0, 1]],
    ['ArrowLeft', [-1, 0]], ['KeyA', [-1, 0]],
    ['ArrowRight', [1, 0]], ['KeyD', [1, 0]],
]);
const keys = new Set(); // held movement key codes

export function keyDown(code) { if (MOVE_KEYS.has(code)) keys.add(code); }
export function keyUp(code) { keys.delete(code); }
export function clearKeys() { keys.clear(); }

// Sum of held movement keys into a unit vector; diagonals normalized so they
// aren't √2 faster, opposite keys cancel to zero (T7). Pure — unit-tested.
export function keysToVector(keySet) {
    let x = 0, y = 0;
    for (const code of keySet) {
        const v = MOVE_KEYS.get(code);
        if (v) { x += v[0]; y += v[1]; }
    }
    const len = Math.hypot(x, y);
    return len > 0 ? { x: x / len, y: y / len } : { x: 0, y: 0 };
}

// Deadzone-then-linear throttle ramp from stick displacement in CSS px (T5).
// Pure — unit-tested.
export function stickThrottle(d) {
    if (d <= STICK_DEAD_PX) return 0;
    return Math.min((d - STICK_DEAD_PX) / (STICK_R_PX - STICK_DEAD_PX), 1);
}

// CSS-px-per-view-unit ratio (ui.js's view.scale), pushed in on every resize so
// stickVector() below can convert the stored view-unit drag distance into the CSS
// px stickThrottle() expects. Defaults to 1 (matches ui.js's own default) until
// the first resize runs.
let viewScale = 1;
export function setViewScale(s) { viewScale = s; }

// Floating stick (T5/T9): origin = the first touch point, in VIEW units — screen-
// anchored, NOT world units, which would slide out from under the thumb as the
// camera follows the comet and the STAB-2 zoom eases (see ui.toView()). One stick
// at a time; a second pointer while one is already live is ignored.
export let stick = null; // { ox, oy, cx, cy, id }

export function stickDown(vx, vy, id) {
    if (stick) return;
    stick = { ox: vx, oy: vy, cx: vx, cy: vy, id };
}
export function stickMove(vx, vy, id) {
    if (!stick || stick.id !== id) return;
    stick.cx = vx; stick.cy = vy;
}
export function stickUp(id) {
    if (stick && stick.id === id) stick = null;
}
export function stickCancel() { stick = null; }

// Direction (unit vector) × analog throttle from the stick's displacement (T1/T9:
// push toward, how far out = throttle). Pure given the module's own `stick` state.
function stickVector() {
    if (!stick) return { x: 0, y: 0 };
    const dx = stick.cx - stick.ox, dy = stick.cy - stick.oy;
    const d = Math.hypot(dx, dy);
    if (d === 0) return { x: 0, y: 0 };
    const throttle = stickThrottle(d * viewScale);
    return throttle > 0 ? { x: dx / d * throttle, y: dy / d * throttle } : { x: 0, y: 0 };
}

// Combine keyboard and stick into one thrust vector. Keyboard alone stays exactly
// INV-3a's behavior: a unit vector at throttle 1. The stick alone carries its own
// analog throttle in its magnitude. Both summed and clamped to magnitude 1 so stick
// and keys can drive at once without exceeding full thrust. Inert unless the
// Thruster item is on in Explore — the single gate behind T6/T7's "all of the above
// is inert when off."
export function thrustVec() {
    if (!(S.mode === 'explore' && S.inventory.thruster?.enabled)) return { x: 0, y: 0, throttle: 0 };
    const kv = keysToVector(keys);
    const sv = stickVector();
    let x = kv.x + sv.x, y = kv.y + sv.y;
    const mag = Math.hypot(x, y);
    if (mag > 1) { x /= mag; y /= mag; }
    const throttle = Math.min(mag, 1);
    return throttle > 0 ? { x, y, throttle } : { x: 0, y: 0, throttle: 0 };
}

export function hasThrust() { return thrustVec().throttle > 0; }

export function step(dt) {
    if (S.orbitCooldown > 0) S.orbitCooldown = Math.max(0, S.orbitCooldown - dt);

    const t = thrustVec();
    if (t.throttle > 0 && fuel > 0) {
        // Thrust lifts off under power — no flick to leave with, so a resting
        // comet just starts flying the instant any throttle is applied (T6).
        if (S.phase === 'rest') S.phase = 'flight';
        comet.vx += t.x * THRUST_A * dt;
        comet.vy += t.y * THRUST_A * dt;
        burnFuel(THRUST_BURN * t.throttle * dt);
        // Exhaust: a few particles opposite the thrust vector each step, in the
        // comet's own trail color (#ffcf8a) — reuses the existing burst(). INV-3c:
        // tuned down from 0.15 (placeholder) — at 240 steps/s and ~0.65s average
        // particle life that was ~23 particles trailing the comet at full throttle,
        // a dense smear rather than a wisp; 0.06 settles to ~9.
        if (Math.random() < t.throttle * 0.06) {
            const tm = Math.hypot(t.x, t.y) || 1;
            hooks.burst(comet.x - (t.x / tm) * COMET_R, comet.y - (t.y / tm) * COMET_R, 1, '#ffcf8a', 12);
        }
    }

    const res = stepBody(comet, dt, world.bodies, null);

    // OW-3: seeded black holes sit in world.bodies (so they get real gravity, same
    // m=r² convention as every other body), but flying into one should warp to Town,
    // not bounce/land like a planet — checked before res.hit is handled below. The
    // warp radius is comfortably bigger than stepBody()'s r+COMET_R collision radius
    // for the same body (see exploreBlackHoleWarpR), so this always preempts a
    // planet-style hit rather than racing it.
    for (const b of world.bodies) {
        if (b.type !== 'blackhole') continue;
        if (dist(comet.x, comet.y, b.x, b.y) < exploreBlackHoleWarpR(b.r)) {
            beginWarp(b);
            return;
        }
    }

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
            if (isRefuelStation(res.hit)) {
                refuelFull();
                hooks.burst(comet.x, comet.y, 14, '#20e657', 24);
                hooks.toast('⛽ Refueled!');
            }
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
    
    if (S.orbitCooldown <= 0 && S.phase === 'flight' && t.throttle === 0) {
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
    markDiscovered(comet.x, comet.y);

    // Bounded sector for OW-2
    if (comet.x < -SECTOR_LIMIT || comet.x > SECTOR_LIMIT || comet.y < -SECTOR_LIMIT || comet.y > SECTOR_LIMIT) {
        // Soft nudge back
        comet.vx -= (comet.x > 0 ? 1 : -1) * dt * 20;
        comet.vy -= (comet.y > 0 ? 1 : -1) * dt * 20;
    }
    
    updateCamera(dt);
}

/* ============================== OW-3: black-hole warp → Town → return ============================== */

// Begin the warp: bookmark where we came from (persisted so the Return Portal
// survives reload), then spiral the comet into the black hole's position over ~1s.
// Reuses the *visual pattern* of golf's inward spiral (gameplay.js beginSink/
// stepSink), not the functions themselves — Explore has no strokes/par/scorecard,
// so golf's holeComplete() scoring machinery doesn't apply here.
function beginWarp(b) {
    exploreHome = { blackHoleId: b.id, bhX: b.x, bhY: b.y, x: comet.x, y: comet.y };
    hooks.exploreHome(exploreHome);
    const dx = comet.x - b.x, dy = comet.y - b.y;
    world.warp = { b, r0: Math.max(Math.hypot(dx, dy), 1.5), a0: Math.atan2(dy, dx), t: 0 };
    S.phase = 'warp';
    world.trail = [];
    hooks.sfx.sink();
    hooks.toast('🌀 Pulled into a black hole...');
}

export function stepWarp(dt) {
    const w = world.warp;
    if (!w) return;
    w.t += dt * 1.1;
    const t = Math.min(w.t, 1);
    const r = w.r0 * (1 - t) * (1 - t);
    const a = w.a0 + t * 7;
    comet.x = w.b.x + Math.cos(a) * r;
    comet.y = w.b.y + Math.sin(a) * r;
    if (Math.random() < 0.5) hooks.burst(comet.x, comet.y, 1, '#ffd98a', 8);
    if (w.t >= 1) completeWarp();
    else updateCamera(dt);
}

function completeWarp() {
    world.warp = null;
    if (!world.teeRock) world.teeRock = { x: 50, y: 85, r: 3.4, m: 8, type: 'tee', id: 'tee' };
    comet.vx = comet.vy = 0;
    comet.rest = { b: world.teeRock, ang: -Math.PI / 2 };
    placeOnRest();
    world.lastRest = { rest: comet.rest };
    world.trail = [];
    camera.x = 50;
    camera.y = 85;
    S.phase = 'rest';
    lastChunkX = null;
    lastChunkY = null; // force a chunk refresh at Town, however far the warp origin was
    updateActiveChunks();
    hooks.burst(comet.x, comet.y, 20, '#ffd98a', 30);
    hooks.toast('🏪 Warped to Town!');
    hooks.bar();
}

// Return Portal: send the comet back to the exact black hole + location it warped
// in from. No-op away from Town or before any warp has happened yet. Free (no fuel
// cost) — it's a trip back to where you were, not a flight action. Lands the comet
// EXPLORE_RETURN_NUDGE past the warp radius, along the same direction it approached
// from, so arriving doesn't instantly re-trigger the same warp (the bookmarked spot
// sits right at the trigger boundary by definition).
export function useReturnPortal() {
    if (!atTown() || !exploreHome) return false;
    const { bhX, bhY, x, y } = exploreHome;
    const dx = x - bhX, dy = y - bhY;
    const d = Math.hypot(dx, dy) || 1;
    const safeR = exploreBlackHoleWarpR(EXPLORE_BLACKHOLE_R) + EXPLORE_RETURN_NUDGE;
    comet.x = bhX + (dx / d) * safeR;
    comet.y = bhY + (dy / d) * safeR;
    comet.vx = comet.vy = 0;
    comet.rest = null;
    S.phase = 'flight';
    world.trail = [];
    camera.x = comet.x;
    camera.y = comet.y;
    lastChunkX = null;
    lastChunkY = null;
    updateActiveChunks();
    hooks.burst(comet.x, comet.y, 20, '#ffd98a', 30);
    hooks.sfx.sling();
    hooks.toast('🌀 Returned to the black hole');
    hooks.bar();
    return true;
}

// True when landing on `body` should fully refuel the tank (FUEL-2) — landing only,
// not a bounce trickle; Yev's ask was "fully refuel you when you land on them."
// Pure — unit-tested separately from the landing side effects it gates.
export function isRefuelStation(body) {
    return !!(body && body.refuelStation);
}

// True when an empty tank leaves the comet stranded (FUEL-1: no auto-tow, in
// any phase, Thruster on or off — launch()/thrust already refuse to fire on an
// empty tank on their own, so "stranded, wherever you are" needs no new physics).
// Endless Flight (INV-1) locks the tank so this never fires while it's on.
// Pure and unit-tested.
export function isStranded(fuel, inventory) {
    return fuel <= 0 && !inventory.endlessFlight?.enabled;
}

// Instantly tops the tank off. Endless Flight (INV-1) is a fuel-lock: switching
// it on shouldn't require draining first, so the toggle calls this immediately.
export function refuelFull() {
    fuel = tankMaxFuel(S.upgrades.tank);
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

    // Thrust ejects out of a live orbit on any throttle (T1/table). No velocity
    // fixup needed — the tangential velocity this function writes every tick is
    // already correct, so live physics (step()) picks up right where station-
    // keeping left off, one tick later.
    if (thrustVec().throttle > 0) {
        world.orbit = null;
        S.orbitCooldown = ORBIT_COOLDOWN;
        S.phase = 'flight';
        return;
    }

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
    markDiscovered(comet.x, comet.y);
}

function updateCamera(dt) {
    // Smooth camera follow
    camera.x += (comet.x - camera.x) * dt * 4;
    camera.y += (comet.y - camera.y) * dt * 4;
}
