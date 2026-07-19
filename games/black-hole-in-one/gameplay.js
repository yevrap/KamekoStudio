// Black Hole in One — game logic: hole generation, flight, scoring, rounds.
// DOM-free: all presentation goes through the injected `hooks` object, so this
// module (plus physics.js/constants.js) runs headless under node --test.
'use strict';

import {
    WORLD_W as W, COURSE_H, DT, MAX_LAUNCH, MAX_DRAG, MIN_SHOT, COMET_R, CAPTURE_R,
    OB_MARGIN, DUST_T, FLIGHT_CAP, SLING_ANG, ROUND_HOLES, PALETTES,
    ORBIT_COOLDOWN, ORBIT_ARM_T, LIFTOFF_T, LIFTOFF_MIN, DEFAULT_MAP_SIZE, mapBounds,
    rand, dist, holeLabel,
} from './constants.js';
import { S, world, comet } from './state.js';
import { stepBody, collide, orbitCapture } from './physics.js';

// Presentation hooks — main.js swaps in the real UI; defaults are no-ops.
export let hooks = {
    toast() {}, chip() {}, bar() {}, holeStart() {}, roundEnd() {}, editorReturn() {},
    showSurvivalGameOver() {}, burst() {}, stardust() {},
    sfx: { flick() {}, bounce() {}, sling() {}, lost() {}, land() {}, sink() {}, score() {} },
};
export function setHooks(h) { hooks = Object.assign(hooks, h); }

let resultTimer = null;

// setTimeout that doesn't hold the Node test process open (no-op in browsers)
function schedule(fn, ms) {
    const t = setTimeout(fn, ms);
    if (t && typeof t.unref === 'function') t.unref();
    return t;
}

/* ============================== HOLE GENERATION ============================== */

export function genHole(n) {
    world.bodies = [];
    world.teeRock = { x: rand(28, 72), y: COURSE_H * rand(0.84, 0.9), r: 3.4, m: 8, type: 'tee' };
    world.blackHole = { x: rand(18, 82), y: COURSE_H * rand(0.1, 0.17), r: 3.2, m: 230, type: 'hole' };
    const teeRock = world.teeRock, blackHole = world.blackHole;

    const nP = Math.min(1 + Math.floor(n / 2), 4);
    let placed = 0;
    for (let i = 0; i < nP; i++) {
        // the guard planet (i===0 on holes 2+) sits on the tee→hole line and is a
        // size up — it doubles as an inviting stepping stone to land on (Q4)
        const guard = i === 0 && n >= 2;
        const r = guard ? rand(9, 13) : rand(7, 12 + Math.min(n * 0.4, 3));
        let ok = false, px = 0, py = 0;
        for (let tries = 0; tries < 70 && !ok; tries++) {
            if (guard) {
                const t = rand(0.35, 0.65);
                px = teeRock.x + (blackHole.x - teeRock.x) * t + rand(-9, 9);
                py = teeRock.y + (blackHole.y - teeRock.y) * t + rand(-7, 7);
            } else {
                px = rand(12, 88);
                py = rand(COURSE_H * 0.24, COURSE_H * 0.72);
            }
            px = Math.min(Math.max(px, r + 4), W - r - 4);
            py = Math.min(Math.max(py, COURSE_H * 0.2), COURSE_H * 0.76);
            ok = dist(px, py, teeRock.x, teeRock.y) > r + 15 &&
                 dist(px, py, blackHole.x, blackHole.y) > r + 14 &&
                 world.bodies.every(b => dist(px, py, b.x, b.y) > r + b.r + 7);
        }
        if (!ok) continue;
        const pal = PALETTES[(n + i) % PALETTES.length];
        world.bodies.push({ x: px, y: py, r, m: r * r, type: 'planet', pal, spin: rand(0, Math.PI * 2) });
        placed++;
    }

    let pulsar = false;
    if (n >= 6 && Math.random() < Math.min(0.15 + (n - 6) * 0.06, 0.5)) {
        for (let tries = 0; tries < 50; tries++) {
            const px = rand(14, 86), py = rand(COURSE_H * 0.28, COURSE_H * 0.68);
            if (dist(px, py, blackHole.x, blackHole.y) > 26 &&
                dist(px, py, teeRock.x, teeRock.y) > 22 &&
                world.bodies.every(b => dist(px, py, b.x, b.y) > b.r + 11)) {
                world.bodies.push({ x: px, y: py, r: 2.6, m: -160, type: 'pulsar' });
                pulsar = true;
                break;
            }
        }
    }

    world.pickups = [];
    if (S.mode === 'endless') {
        const nPickups = rand(1, 3);
        for (let i = 0; i < nPickups; i++) {
            for (let tries = 0; tries < 50; tries++) {
                const px = rand(14, 86), py = rand(COURSE_H * 0.2, COURSE_H * 0.8);
                if (dist(px, py, blackHole.x, blackHole.y) > 15 &&
                    dist(px, py, teeRock.x, teeRock.y) > 15 &&
                    world.bodies.every(b => dist(px, py, b.x, b.y) > b.r + 5) &&
                    world.pickups.every(p => dist(px, py, p.x, p.y) > 8)) {
                    world.pickups.push({ x: px, y: py, r: 1.8, type: 'fuel' });
                    break;
                }
            }
        }

        // Gravity Traps (0 to 1)
        if (n >= 2 && Math.random() < 0.35) {
            for (let tries = 0; tries < 50; tries++) {
                const px = rand(14, 86), py = rand(COURSE_H * 0.3, COURSE_H * 0.7);
                if (dist(px, py, blackHole.x, blackHole.y) > 22 &&
                    dist(px, py, teeRock.x, teeRock.y) > 22 &&
                    world.bodies.every(b => dist(px, py, b.x, b.y) > b.r + 14)) {
                    world.bodies.push({ x: px, y: py, r: 2.8, m: 200, type: 'trap' });
                    break;
                }
            }
        }

        // Mines (1 to 4)
        const nMines = n >= 3 ? rand(1, 4) : 0;
        for (let i = 0; i < nMines; i++) {
            for (let tries = 0; tries < 50; tries++) {
                const px = rand(10, 90), py = rand(COURSE_H * 0.2, COURSE_H * 0.8);
                if (dist(px, py, blackHole.x, blackHole.y) > 15 &&
                    dist(px, py, teeRock.x, teeRock.y) > 15 &&
                    world.bodies.every(b => dist(px, py, b.x, b.y) > b.r + 7) &&
                    world.pickups.every(p => dist(px, py, p.x, p.y) > 7)) {
                    // Mines have 0 mass (no gravity)
                    world.bodies.push({ x: px, y: py, r: 2, m: 0, type: 'mine' });
                    break;
                }
            }
        }

        world.asteroids = [];
        // Moving Asteroids (1 to 4) starting from hole 4
        const nAsteroids = n >= 4 ? rand(1, 4) : 0;
        for (let i = 0; i < nAsteroids; i++) {
            const r = rand(1.2, 2.5);
            // spawn them slightly off-screen or near the edge so they drift through
            const side = Math.floor(rand(0, 4)); // 0: left, 1: right, 2: top, 3: bottom
            let px, py, vx, vy;
            const speed = rand(1.5, 4.5);
            if (side === 0) { px = -10; py = rand(0, COURSE_H); vx = speed; vy = rand(-speed, speed); }
            else if (side === 1) { px = 110; py = rand(0, COURSE_H); vx = -speed; vy = rand(-speed, speed); }
            else if (side === 2) { px = rand(0, 100); py = -10; vx = rand(-speed, speed); vy = speed; }
            else { px = rand(0, 100); py = COURSE_H + 10; vx = rand(-speed, speed); vy = -speed; }
            
            world.asteroids.push({ x: px, y: py, r, vx, vy, type: 'asteroid' });
        }
    }

    world.bodies.push(teeRock);
    S.par = Math.min(2 + (placed >= 3 ? 1 : 0) + (pulsar ? 1 : 0), 4);
    S.strokes = 0;
    S.tFlight = 0;
    S.hopsThisHole = 0;

    comet.vx = comet.vy = 0;
    comet.rest = { b: teeRock, ang: -Math.PI / 2 };
    placeOnRest();
    world.lastRest = { rest: comet.rest };

    world.trail = [];
    world.slingTrack = new Map();
    world.hoppedBodies = new Set();
    world.orbitedThisHole = new Set();
    world.orbit = null;
    world.sink = null;
    world.launchBody = null;
    S.orbitCooldown = 0;
    S.liftoff = 0;

    hooks.holeStart();
    hooks.bar();
}

export function placeOnRest() {
    const r = comet.rest;
    comet.x = r.b.x + Math.cos(r.ang) * (r.b.r + COMET_R + 0.25);
    comet.y = r.b.y + Math.sin(r.ang) * (r.b.r + COMET_R + 0.25);
}

/* ============================== FLIGHT ============================== */

export function launch(dx, dy, len) {
    if (S.mode === 'endless' && S.fuel <= 0) return false;
    const speed = Math.min(len / MAX_DRAG, 1) * MAX_LAUNCH;
    // weak drag = cancelled shot; resume the orbit if we were flicking out of one
    if (speed < MIN_SHOT) { S.phase = world.orbit ? 'orbit' : 'rest'; return false; }

    if (S.mode === 'endless') {
        S.fuel -= 15;
        if (S.fuel < 0) S.fuel = 0;
    }

    // Liftoff grace (STAB-1): if we're flicking off a planet's surface (not the tee,
    // not out of an orbit), briefly damp that planet's pull so the shot gets clear
    // instead of being dragged straight back. Captured before world.orbit is cleared.
    const fromPlanet = !world.orbit && comet.rest && comet.rest.b && comet.rest.b.type === 'planet';
    world.launchBody = fromPlanet ? comet.rest.b : null;
    S.liftoff = fromPlanet ? LIFTOFF_T : 0;
    // Force-push impulse (BH-4): ADD to current velocity, don't overwrite it. At
    // rest the comet's velocity is 0 so tee shots are unchanged; flicking out of
    // an orbit adds the impulse to the orbital velocity, bending the motion.
    comet.vx += dx / len * speed;
    comet.vy += dy / len * speed;
    world.orbit = null;
    S.orbitCooldown = ORBIT_COOLDOWN;   // don't re-capture the moment we break away
    S.strokes++;
    S.tFlight = 0;
    world.trail = [];
    world.slingTrack = new Map();
    S.phase = 'flight';
    hooks.sfx.flick();
    hooks.bar();
    return true;
}

function checkSurvivalGameOver() {
    if (S.mode === 'endless' && S.fuel <= 0) {
        S.phase = 'roundover';
        hooks.showSurvivalGameOver(S.hole);
        return true;
    }
    return false;
}

function triggerHazardDeath(hit) {
    hooks.burst(comet.x, comet.y, 25, hit.type === 'trap' ? '#9933ff' : '#ff4444', 30);
    hooks.sfx.lost();
    hooks.toast(hit.type === 'trap' ? '🌀 Crushed in a Gravity Trap' : (hit.type === 'asteroid' ? '☄️ Smashed by an Asteroid' : '💥 Hit a Space Mine'));
    S.fuel = 0;
    checkSurvivalGameOver();
}

export function stepAsteroids(dt) {
    for (const a of world.asteroids) {
        a.x += a.vx * dt;
        a.y += a.vy * dt;

        // Wrap around screen boundaries for endless drift
        if (a.x < -15) a.x = 115;
        if (a.x > 115) a.x = -15;
        if (a.y < -15) a.y = COURSE_H + 15;
        if (a.y > COURSE_H + 15) a.y = -15;

        // Check collision with comet if flying/aiming/orbiting
        if (S.phase === 'flight' || S.phase === 'orbit' || S.phase === 'aiming' || S.phase === 'rest') {
            if (dist(comet.x, comet.y, a.x, a.y) < COMET_R + a.r) {
                triggerHazardDeath(a);
            }
        }
    }
}

export function stepFlight(dt) {
    S.tFlight += dt;
    if (S.orbitCooldown > 0) S.orbitCooldown = Math.max(0, S.orbitCooldown - dt);
    if (S.tFlight > DUST_T) {
        const k = Math.min((S.tFlight - DUST_T) / 3, 1);
        const f = 1 - k * 0.0022;
        comet.vx *= f; comet.vy *= f;
    }
    // Liftoff grace (STAB-1): while the window is open, weaken the launch planet's
    // pull, ramping from LIFTOFF_MIN back up to full over LIFTOFF_T seconds.
    let damp = null;
    if (S.liftoff > 0 && world.launchBody) {
        S.liftoff = Math.max(0, S.liftoff - dt);
        const k = 1 - S.liftoff / LIFTOFF_T;            // 0 at liftoff → 1 when the window closes
        damp = { body: world.launchBody, factor: LIFTOFF_MIN + (1 - LIFTOFF_MIN) * k };
    }
    const res = stepBody(comet, dt, world.bodies, world.blackHole, damp);

    // Pickups collision
    if (S.mode === 'endless') {
        for (let i = world.pickups.length - 1; i >= 0; i--) {
            const p = world.pickups[i];
            const d = dist(comet.x, comet.y, p.x, p.y);
            if (d < COMET_R + p.r) {
                world.pickups.splice(i, 1);
                if (p.type === 'fuel' || !p.type) {
                    S.fuel = Math.min(100, S.fuel + 20);
                    hooks.burst(p.x, p.y, 14, '#20e657', 20);
                } else if (p.type === 'stardust') {
                    S.stardust += 1;
                    hooks.stardust(S.stardust);
                    hooks.burst(p.x, p.y, 8, '#ffd98a', 15);
                }
                hooks.bar();
            }
        }
    }

    if (res && res.sink) { beginSink(); return; }

    if (res && res.hit) {
        if (res.hit.type === 'mine' || res.hit.type === 'trap') {
            triggerHazardDeath(res.hit);
            return;
        }

        const c = collide(comet, res.hit);
        if (c.landed) { landOn(res.hit, c.ang); return; }
        if (c.bounced) {
            hooks.sfx.bounce(c.k);
            hooks.burst(comet.x, comet.y, 7, res.hit.pal ? res.hit.pal.base : '#aaa', 18);
        }
    }

    // Orbit capture (BH-4): a near-circular pass around a planet snaps into a live
    // orbit. Armed after the launch instant and gated by a post-break cooldown so
    // flicking out of one orbit doesn't immediately drop into another.
    if (S.orbitCooldown <= 0 && S.tFlight > ORBIT_ARM_T) {
        for (const b of world.bodies) {
            const cap = orbitCapture(comet, b);
            if (cap) { beginOrbit(b, cap); return; }
        }
    }

    // slingshot detection — big swings around one planet get celebrated
    for (const b of world.bodies) {
        if (b.type !== 'planet') continue;
        const d = dist(comet.x, comet.y, b.x, b.y);
        let tr = world.slingTrack.get(b);
        if (d < b.r + 16) {
            const ang = Math.atan2(comet.y - b.y, comet.x - b.x);
            if (!tr) { tr = { prev: ang, acc: 0, fired: false }; world.slingTrack.set(b, tr); }
            let da = ang - tr.prev;
            while (da > Math.PI) da -= Math.PI * 2;
            while (da < -Math.PI) da += Math.PI * 2;
            tr.acc += da; tr.prev = ang;
            if (!tr.fired && Math.abs(tr.acc) > SLING_ANG) {
                tr.fired = true;
                hooks.toast('☄️ SLINGSHOT!');
                hooks.sfx.sling();
                hooks.burst(comet.x, comet.y, 14, '#ffd98a', 30);
            }
        } else if (tr) {
            world.slingTrack.delete(b);
        }
    }

    const bnd = mapBounds(world.mapSizeKey);
    const oob = comet.x < -OB_MARGIN || comet.x > bnd.w + OB_MARGIN ||
                comet.y < -OB_MARGIN || comet.y > bnd.h + OB_MARGIN;
    if (oob || S.tFlight > FLIGHT_CAP) {
        comet.rest = world.lastRest.rest;
        placeOnRest();
        comet.vx = comet.vy = 0;
        world.trail = [];
        S.phase = 'rest';
        hooks.sfx.lost();
        hooks.toast(oob ? '🌌 Lost in space — replay from your last spot' : '🛰 Drifting too long — back you come');
        checkSurvivalGameOver();
    }
}

export function landOn(b, ang) {
    comet.rest = { b, ang };
    placeOnRest();
    comet.vx = comet.vy = 0;
    world.lastRest = { rest: comet.rest };
    world.orbit = null;
    world.launchBody = null; S.liftoff = 0;
    S.phase = 'rest';
    world.trail = [];
    hooks.sfx.land();
    hooks.burst(comet.x, comet.y, 5, '#fff', 10);
    if (b.type === 'planet' && !world.hoppedBodies.has(b)) {
        world.hoppedBodies.add(b);
        S.hopsThisHole++;
        if (S.hopsThisHole === 1) hooks.toast('🪐 HOP! Teed up on a planet');
    }
    checkSurvivalGameOver();
}

/* ============================== ORBIT (BH-4) ============================== */

// Snap the comet onto the captured circular orbit and hold it there as a live
// state the player flicks out of. DUST_T / FLIGHT_CAP are irrelevant here — the
// orbit is stepped by stepOrbit(), not stepFlight(), so it never decays.
export function beginOrbit(b, cap) {
    world.orbit = { b, radius: cap.radius, ang: cap.ang, omega: cap.omega };
    applyOrbit(0);                       // place exactly on the circle + set tangential velocity
    S.phase = 'orbit';
    world.trail = [];
    world.slingTrack = new Map();
    hooks.sfx.sling();                   // reuse the slingshot whoosh
    hooks.burst(comet.x, comet.y, 12, (b.pal && b.pal.base) || '#9fe3d8', 26);
    if (!world.orbitedThisHole.has(b)) {
        world.orbitedThisHole.add(b);
        hooks.toast('🛰 ORBIT! Flick to break away');
    }
    checkSurvivalGameOver();
}

// Advance the orbit angle by omega·dt and derive the comet's position + tangential
// velocity, so a flick-out impulse adds to a physically correct current velocity.
function applyOrbit(dt) {
    const o = world.orbit;
    o.ang += o.omega * dt;
    comet.x = o.b.x + Math.cos(o.ang) * o.radius;
    comet.y = o.b.y + Math.sin(o.ang) * o.radius;
    const spd = o.omega * o.radius;      // signed tangential speed
    comet.vx = -Math.sin(o.ang) * spd;
    comet.vy =  Math.cos(o.ang) * spd;
}

export function stepOrbit(dt) {
    if (!world.orbit) return;
    applyOrbit(dt);
    // an orbit that skims the cup still sinks — emergent, and delightful when it happens
    if (world.blackHole && dist(comet.x, comet.y, world.blackHole.x, world.blackHole.y) < CAPTURE_R) {
        world.orbit = null;
        beginSink();
        return;
    }
    // GOLF-2: a planet placed near the course edge (reachable via Map Maker/custom
    // maps — the editor only auto-deletes past W+10/COURSE_H+10) can carry its orbit
    // band outside the playfield. stepFlight has an OOB escape; stepOrbit never did,
    // so the comet was stranded off-screen forever with no way to see or flick it
    // back (GOLF-1: reads as "eaten, no way out" from the player's side).
    const bnd = mapBounds(world.mapSizeKey);
    const oob = comet.x < -OB_MARGIN || comet.x > bnd.w + OB_MARGIN ||
                comet.y < -OB_MARGIN || comet.y > bnd.h + OB_MARGIN;
    if (oob) {
        world.orbit = null;
        comet.rest = world.lastRest.rest;
        placeOnRest();
        comet.vx = comet.vy = 0;
        world.trail = [];
        S.phase = 'rest';
        hooks.sfx.lost();
        hooks.toast('🌌 Lost in space — replay from your last spot');
        checkSurvivalGameOver();
    }
}

/* ============================== SINK & SCORING ============================== */

export function beginSink() {
    const dx = comet.x - world.blackHole.x, dy = comet.y - world.blackHole.y;
    world.sink = { r0: Math.max(Math.hypot(dx, dy), 1.5), a0: Math.atan2(dy, dx), t: 0 };
    S.phase = 'sink';
    hooks.sfx.sink();
}

export function stepSink(dt) {
    const sink = world.sink;
    sink.t += dt * 1.1;
    const t = Math.min(sink.t, 1);
    const r = sink.r0 * (1 - t) * (1 - t);
    const a = sink.a0 + t * 7;
    comet.x = world.blackHole.x + Math.cos(a) * r;
    comet.y = world.blackHole.y + Math.sin(a) * r;
    if (Math.random() < 0.5) hooks.burst(comet.x, comet.y, 1, '#ffd98a', 8);
    if (sink.t >= 1) holeComplete();
}

export function holeComplete() {
    const diff = S.strokes - S.par;
    S.totalDiff += diff;
    S.roundCard.push({ hole: S.hole, strokes: S.strokes, par: S.par, hopped: S.hopsThisHole > 0 });
    const lab = holeLabel(S.strokes, S.par);
    const hopTag = S.hopsThisHole > 0 ? ' · 🪐' : '';
    hooks.chip(lab, `Hole ${S.hole} · ${S.strokes} flick${S.strokes === 1 ? '' : 's'} · Par ${S.par}${hopTag}`);
    hooks.sfx.score(lab.fanfare);
    hooks.burst(world.blackHole.x, world.blackHole.y, 36, '#ffd98a', 40);
    S.phase = 'result';
    hooks.bar();
    hooks.bar();
    const isEditor = S.mode === 'editor';
    const isCustom = S.mode === 'custom';
    resultTimer = schedule((isEditor || isCustom ? () => {} : nextHole), 1900);
}

export function nextHole() {
    if (S.phase !== 'result') return;
    clearTimeout(resultTimer); resultTimer = null;
    hooks.chip(null);
    S.hole++;
    genHole(S.hole);
    S.phase = 'rest';
}

export function endRound() {
    // legacy, unused but keeping signature for now
}

// Advance out of the result chip early (tap): last round hole → scorecard, else next hole.
export function advance() {
    if (S.phase !== 'result') return;
    if (S.mode === 'editor') {
        clearTimeout(resultTimer); resultTimer = null;
        hooks.chip(null);
        hooks.editorReturn();
        return;
    }
    if (S.mode === 'custom') {
        clearTimeout(resultTimer); resultTimer = null;
        hooks.chip(null);
        comet.vx = comet.vy = 0;
        comet.rest = { b: world.teeRock, ang: -Math.PI / 2 };
        placeOnRest();
        world.lastRest = { rest: comet.rest };
        S.strokes = 0;
        S.tFlight = 0;
        world.trail = [];
        world.orbit = null;
        world.sink = null;
        S.orbitCooldown = 0;
        S.phase = 'rest';
        hooks.bar();
        return;
    }
    nextHole();
}

export function startRun(mode) {
    clearTimeout(resultTimer); resultTimer = null;
    hooks.chip(null);
    S.mode = mode;
    S.hole = 1;
    S.totalDiff = 0;
    S.roundCard = [];
    world.mapSizeKey = DEFAULT_MAP_SIZE; // golf/endless always play at the default scale
    if (mode === 'endless') S.fuel = 100;
    genHole(1);
    S.phase = 'rest';
}

export function startCustomMap(mapData) {
    clearTimeout(resultTimer); resultTimer = null;
    hooks.chip(null);
    S.mode = 'custom';
    S.hole = 1;
    S.totalDiff = 0;
    S.roundCard = [];
    // Pre-sprint saved/shared maps have no `size` field — default to small so they
    // keep exactly their current on-disk behavior (MM-6 "no silent breakage").
    world.mapSizeKey = mapData.size === 'large' ? 'large' : DEFAULT_MAP_SIZE;

    world.bodies = mapData.bodies;
    world.teeRock = mapData.teeRock;
    world.blackHole = mapData.blackHole;
    
    // Ensure tee is in bodies
    world.bodies = world.bodies.filter(b => b.type !== 'tee');
    world.bodies.push(world.teeRock);

    S.par = 0; // Not tracked for custom maps really, but we can set to 0 to hide "PAR X" or it will just show PAR 0
    S.strokes = 0;
    S.tFlight = 0;
    S.hopsThisHole = 0;

    comet.vx = comet.vy = 0;
    comet.rest = { b: world.teeRock, ang: -Math.PI / 2 };
    placeOnRest();
    world.lastRest = { rest: comet.rest };

    world.trail = [];
    world.slingTrack = new Map();
    world.hoppedBodies = new Set();
    world.orbitedThisHole = new Set();
    world.orbit = null;
    world.sink = null;
    world.launchBody = null;
    S.orbitCooldown = 0;
    S.liftoff = 0;

    hooks.holeStart();
    
    // Hide UI elements not relevant for custom
    document.getElementById('exploreBar').classList.add('hidden');
    document.getElementById('editorBar').classList.add('hidden');
    document.getElementById('customBar').classList.remove('hidden');
    document.getElementById('bar').classList.remove('hidden');
    document.getElementById('howto').classList.add('hidden');
    document.getElementById('scorecard').classList.add('hidden');

    hooks.bar();
    hooks.toast('📂 Custom map loaded');
    S.phase = 'rest';
}
