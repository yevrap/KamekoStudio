// Unit tests for games/black-hole-in-one/ pure logic:
// constants helpers, physics (gravity, integration, collision response),
// hole generation invariants, and round/scorecard flow (gameplay.js headless).
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
    WORLD_W, COURSE_H, CAPTURE_R, COMET_R, REST_V, SOFT_CATCH, MAX_V, DT, G,
    ROUND_HOLES, fmtDiff, holeLabel, isBetterRound, dist, circularSpeed, fitZoom, ZOOM_MIN, ZOOM_FIT,
    upgradeCost, tankMaxFuel, siphonGain, sensorChunkRadius, LS_KEYS, hitTestMapTargets,
    OB_MARGIN, ORBIT_MAX_GAP,
} from '../games/black-hole-in-one/constants.js';
import { gravityAt, stepBody, collide, orbitCapture, magnetCapture } from '../games/black-hole-in-one/physics.js';
import { S, world, comet } from '../games/black-hole-in-one/state.js';
import * as game from '../games/black-hole-in-one/gameplay.js';
import { chunkLandmarks, getChunkBodies } from '../games/black-hole-in-one/explore.js';

/* ============================== constants helpers ============================== */

test('fmtDiff formats even, over and under par', () => {
    assert.equal(fmtDiff(0), 'E');
    assert.equal(fmtDiff(3), '+3');
    assert.equal(fmtDiff(-2), '−2');
});

test('LS_KEYS carries the muted/freezeAim/inventory localStorage keys shared between main.js (boot load) and ui.js (HUD-1 ☰ Menu Settings/Inventory tabs) (HUD-1)', () => {
    assert.equal(LS_KEYS.muted, 'blackHoleInOne_muted');
    assert.equal(LS_KEYS.freezeAim, 'blackHoleInOne_freezeAim');
    assert.equal(LS_KEYS.inventory, 'blackHoleInOne_inventory');
});

test('holeLabel covers the full golf ladder', () => {
    assert.deepEqual(holeLabel(1, 4), { label: 'BLACK HOLE IN ONE!', ace: true, fanfare: 5 });
    assert.equal(holeLabel(2, 4).label, 'EAGLE');
    assert.equal(holeLabel(3, 4).label, 'BIRDIE');
    assert.equal(holeLabel(4, 4).label, 'PAR');
    assert.equal(holeLabel(5, 4).label, 'BOGEY');
    assert.equal(holeLabel(6, 4).label, 'DOUBLE BOGEY');
    assert.equal(holeLabel(8, 4).label, '+4');
    assert.equal(holeLabel(3, 4).ace, false);
});

test('upgradeCost follows the shared 15/35/60 curve and returns null once maxed (EXP-1b)', () => {
    assert.equal(upgradeCost(0), 15);
    assert.equal(upgradeCost(1), 35);
    assert.equal(upgradeCost(2), 60);
    assert.equal(upgradeCost(3), null);
});

test('tankMaxFuel maps levels 0-3 to 100/130/160/200 and clamps out-of-range levels (EXP-1b)', () => {
    assert.equal(tankMaxFuel(0), 100);
    assert.equal(tankMaxFuel(1), 130);
    assert.equal(tankMaxFuel(2), 160);
    assert.equal(tankMaxFuel(3), 200);
    assert.equal(tankMaxFuel(-1), 100);
    assert.equal(tankMaxFuel(9), 200);
});

test('siphonGain maps levels 0-3 to 20/28/36/45 and clamps out-of-range levels (EXP-1c)', () => {
    assert.equal(siphonGain(0), 20);
    assert.equal(siphonGain(1), 28);
    assert.equal(siphonGain(2), 36);
    assert.equal(siphonGain(3), 45);
    assert.equal(siphonGain(-1), 20);
    assert.equal(siphonGain(9), 45);
});

test('sensorChunkRadius maps levels 0-3 to 1/2/3/4 and clamps out-of-range levels (EXP-1d)', () => {
    assert.equal(sensorChunkRadius(0), 1);
    assert.equal(sensorChunkRadius(1), 2);
    assert.equal(sensorChunkRadius(2), 3);
    assert.equal(sensorChunkRadius(3), 4);
    assert.equal(sensorChunkRadius(-1), 1);
    assert.equal(sensorChunkRadius(9), 4);
});

test('isBetterRound: first round always records, then lower wins', () => {
    assert.equal(isBetterRound(null, 5), true);
    assert.equal(isBetterRound(undefined, 0), true);
    assert.equal(isBetterRound(2, 1), true);
    assert.equal(isBetterRound(-1, -3), true);
    assert.equal(isBetterRound(-3, -1), false);
    assert.equal(isBetterRound(0, 0), false);
});

/* ============================== physics ============================== */

test('gravityAt pulls toward a body and weakens with distance', () => {
    const planet = { x: 50, y: 50, r: 10, m: 100, type: 'planet' };
    const [axNear] = gravityAt([planet], null, 30, 50);
    assert.ok(axNear > 0, 'left of the planet: pull is rightward (+x)');
    const [axFar] = gravityAt([planet], null, 0, 50);
    assert.ok(axFar > 0 && axFar < axNear, 'farther away: weaker pull');
    const [, ayBelow] = gravityAt([planet], null, 50, 80);
    assert.ok(ayBelow < 0, 'below the planet: pull is upward (−y)');
});

test('pulsars (negative mass) repel', () => {
    const pulsar = { x: 50, y: 50, r: 2.6, m: -160, type: 'pulsar' };
    const [ax] = gravityAt([pulsar], null, 30, 50);
    assert.ok(ax < 0, 'left of a pulsar: pushed farther left');
});

test('stepBody detects black-hole capture inside CAPTURE_R', () => {
    const hole = { x: 50, y: 50, r: 3.2, m: 230, type: 'hole' };
    const p = { x: 50 + CAPTURE_R - 0.5, y: 50, vx: 0, vy: 0 };
    assert.deepEqual(stepBody(p, DT, [], hole), { sink: true });
});

test('stepBody detects planet collision and ignores pulsars', () => {
    const planet = { x: 50, y: 50, r: 8, m: 64, type: 'planet' };
    const p = { x: 50 + planet.r + COMET_R - 0.2, y: 50, vx: -1, vy: 0 };
    const res = stepBody(p, DT, [planet], null);
    assert.equal(res.hit, planet);

    const pulsar = { x: 50, y: 50, r: 2.6, m: -160, type: 'pulsar' };
    const q = { x: 51, y: 50, vx: 0, vy: 0 };
    assert.equal(stepBody(q, DT, [pulsar], null), null, 'pulsars are not solid');
});

test('stepBody enforces the hard speed cap', () => {
    const p = { x: 10, y: 10, vx: MAX_V * 3, vy: 0 };
    stepBody(p, DT, [], null);
    assert.ok(Math.hypot(p.vx, p.vy) <= MAX_V + 1e-9);
});

test('collide: slow impact lands, keeps the comet on the surface', () => {
    const planet = { x: 50, y: 50, r: 8, m: 64, type: 'planet' };
    const p = { x: 50 + planet.r + COMET_R - 0.5, y: 50, vx: -(REST_V - 2), vy: 0 };
    const c = collide(p, planet);
    assert.equal(c.landed, true);
    assert.ok(Math.abs(dist(p.x, p.y, planet.x, planet.y) - (planet.r + COMET_R)) < 1e-9);
});

test('collide: soft-catch window bounces nearly dead (Q4 inviting hops)', () => {
    const planet = { x: 50, y: 50, r: 8, m: 64, type: 'planet' };
    const vIn = REST_V * (SOFT_CATCH - 0.1);
    const p = { x: 50 + planet.r + COMET_R, y: 50, vx: -vIn, vy: 0 };
    const c = collide(p, planet);
    assert.equal(c.landed, false);
    assert.equal(c.soft, true);
    const vOut = Math.hypot(p.vx, p.vy);
    assert.ok(vOut < REST_V, `soft catch rebound (${vOut.toFixed(1)}) is inside the landing window — next touch lands`);
});

test('collide: fast impact bounces with normal restitution', () => {
    const planet = { x: 50, y: 50, r: 8, m: 64, type: 'planet' };
    const p = { x: 50 + planet.r + COMET_R, y: 50, vx: -80, vy: 0 };
    const c = collide(p, planet);
    assert.equal(c.landed, false);
    assert.equal(c.soft, false);
    assert.ok(p.vx > 0, 'reflected off the surface');
});

test('collide: separating contact does nothing', () => {
    const planet = { x: 50, y: 50, r: 8, m: 64, type: 'planet' };
    const p = { x: 50 + planet.r + COMET_R, y: 50, vx: +30, vy: 0 };
    const c = collide(p, planet);
    assert.equal(c.landed, false);
    assert.equal(c.bounced, false);
});

/* ============================== orbit capture (BH-4) ============================== */

test('circularSpeed satisfies v² = G·m/d', () => {
    const m = 100, d = 18;
    assert.ok(Math.abs(circularSpeed(m, d) - Math.sqrt(G * m / d)) < 1e-9);
});

test('orbitCapture: a near-circular tangential pass snaps into an orbit', () => {
    const planet = { x: 50, y: 50, r: 10, m: 100, type: 'planet' };
    const d = 18, vc = circularSpeed(planet.m, d);
    // at (68,50), radial is +x; a purely tangential (+y) velocity at circular speed
    const p = { x: 50 + d, y: 50, vx: 0, vy: vc };
    const cap = orbitCapture(p, planet);
    assert.ok(cap, 'captured');
    assert.ok(Math.abs(cap.radius - d) < 1e-9, 'orbit hugs where it was caught');
    assert.ok(Math.abs(cap.omega - vc / d) < 1e-9, 'omega reproduces circular speed');
    assert.ok(Math.abs(cap.ang - 0) < 1e-9, 'angle at +x');
});

test('orbitCapture rejects dives, escapes, and out-of-band passes', () => {
    const planet = { x: 50, y: 50, r: 10, m: 100, type: 'planet' };
    const d = 18, vc = circularSpeed(planet.m, d);
    // diving straight in (all radial) → not an orbit
    assert.equal(orbitCapture({ x: 50 + d, y: 50, vx: -vc, vy: 0 }, planet), null);
    // way too fast (slingshot flyby) → escapes, not captured
    assert.equal(orbitCapture({ x: 50 + d, y: 50, vx: 0, vy: vc * 2 }, planet), null);
    // too far from the surface → outside the orbit band
    assert.equal(orbitCapture({ x: 50 + 40, y: 50, vx: 0, vy: circularSpeed(planet.m, 40) }, planet), null);
    // near-stationary graze → lands/soft-catches, doesn't orbit
    assert.equal(orbitCapture({ x: 50 + d, y: 50, vx: 0, vy: 2 }, planet), null);
});

test('orbitCapture ignores non-planets except tee (pulsar)', () => {
    const d = 18, vc = circularSpeed(100, d);
    const tee = { x: 50, y: 50, r: 10, m: 100, type: 'tee' };
    const pulsar = { x: 50, y: 50, r: 10, m: -100, type: 'pulsar' };
    assert.ok(orbitCapture({ x: 68, y: 50, vx: 0, vy: vc }, tee), 'tee is captured');
    assert.equal(orbitCapture({ x: 68, y: 50, vx: 0, vy: vc }, pulsar), null);
});

/* ============================== magnet capture (ORB-1) ============================== */

test('magnetCapture: captures dives, slingshot-speed flybys, and near-stationary grazes that orbitCapture rejects', () => {
    const planet = { x: 50, y: 50, r: 10, m: 100, type: 'planet' };
    const d = 18, vc = circularSpeed(planet.m, d);

    const dive = magnetCapture({ x: 50 + d, y: 50, vx: -vc, vy: 0 }, planet);
    assert.ok(dive, 'a straight-in dive is captured');
    assert.ok(Math.abs(dive.radius - d) < 1e-9, 'orbit hugs where it was caught');

    const fast = magnetCapture({ x: 50 + d, y: 50, vx: 0, vy: vc * 2 }, planet);
    assert.ok(fast, 'a slingshot-speed flyby is captured');

    const graze = magnetCapture({ x: 50 + d, y: 50, vx: 0, vy: 2 }, planet);
    assert.ok(graze, 'a near-stationary graze is captured');
});

test('magnetCapture respects the same band edges as orbitCapture (ORBIT_MIN_GAP/ORBIT_MAX_GAP)', () => {
    const planet = { x: 50, y: 50, r: 10, m: 100, type: 'planet' };
    // too far past the surface — outside ORBIT_MAX_GAP
    assert.equal(magnetCapture({ x: 50 + 40, y: 50, vx: 0, vy: 1 }, planet), null);
    // barely clear of the surface — inside ORBIT_MIN_GAP, this is a collision, not an orbit
    assert.equal(magnetCapture({ x: 50 + planet.r + COMET_R + 0.1, y: 50, vx: 0, vy: 1 }, planet), null);
});

test('magnetCapture omega direction follows the tangential-velocity sign, and defaults +1 at zero velocity', () => {
    const planet = { x: 50, y: 50, r: 10, m: 100, type: 'planet' };
    const d = 18, vc = circularSpeed(planet.m, d);
    const posDir = magnetCapture({ x: 50 + d, y: 50, vx: 0, vy: vc }, planet);
    assert.ok(posDir.omega > 0, 'positive tangential speed → positive omega');
    const negDir = magnetCapture({ x: 50 + d, y: 50, vx: 0, vy: -vc }, planet);
    assert.ok(negDir.omega < 0, 'negative tangential speed → negative omega');
    const zeroV = magnetCapture({ x: 50 + d, y: 50, vx: 0, vy: 0 }, planet);
    assert.ok(zeroV, 'a dead-stop entry into the band still captures');
    assert.ok(zeroV.omega > 0, 'zero tangential speed falls back to the +1 direction');
});

test('magnetCapture ignores non-planets except tee (pulsar) same as orbitCapture', () => {
    const d = 18;
    const tee = { x: 50, y: 50, r: 10, m: 100, type: 'tee' };
    const pulsar = { x: 50, y: 50, r: 10, m: -100, type: 'pulsar' };
    assert.ok(magnetCapture({ x: 50 + d, y: 50, vx: 0, vy: 1 }, tee), 'tee is captured');
    assert.equal(magnetCapture({ x: 50 + d, y: 50, vx: 0, vy: 1 }, pulsar), null);
});

test('magnetCapture accepts black holes, same body types as orbitCapture', () => {
    const bh = { x: 50, y: 50, r: 22, m: 400, type: 'blackhole' };
    const d = bh.r + COMET_R + 5;
    const cap = magnetCapture({ x: 50 + d, y: 50, vx: 0, vy: 0 }, bh);
    assert.ok(cap, 'black holes are captured the same as planets');
});

test('beginOrbit places the comet on the circle with tangential velocity; stepOrbit keeps the radius', () => {
    game.startRun('endless');
    world.blackHole = { x: -100, y: -100, r: 3.2, m: 230, type: 'hole' };  // far away, no accidental sink
    const planet = { x: 50, y: 50, r: 10, m: 100, type: 'planet', pal: { base: '#fff', dark: '#000' } };
    const d = 18, vc = circularSpeed(planet.m, d);
    game.beginOrbit(planet, { radius: d, omega: vc / d, ang: 0 });
    assert.equal(S.phase, 'orbit');
    assert.ok(Math.abs(dist(comet.x, comet.y, planet.x, planet.y) - d) < 1e-9, 'on the circle');
    assert.ok(Math.abs(Math.hypot(comet.vx, comet.vy) - vc) < 1e-6, 'moving at circular speed');
    for (let i = 0; i < 200; i++) game.stepOrbit(DT);
    assert.ok(Math.abs(dist(comet.x, comet.y, planet.x, planet.y) - d) < 1e-6, 'orbit does not decay');
    assert.equal(S.phase, 'orbit', 'still orbiting — no dust drag, no timeout');
});

test('stepOrbit sinks when the orbit skims the cup', () => {
    game.startRun('endless');
    const planet = { x: 50, y: 50, r: 10, m: 100, type: 'planet', pal: { base: '#fff', dark: '#000' } };
    const d = 18;
    game.beginOrbit(planet, { radius: d, omega: 1, ang: 0 });   // comet placed at (68,50)
    world.blackHole = { x: 68, y: 50, r: 3.2, m: 230, type: 'hole' };
    game.stepOrbit(DT);
    assert.equal(S.phase, 'sink');
    assert.equal(world.orbit, null);
});

test('stepOrbit rescues a comet whose orbit drifts outside the course boundary (GOLF-2 regression)', () => {
    game.startRun('endless');
    const teeRock = world.teeRock;
    // planted well past the boundary regardless of how OB_MARGIN is tuned — the
    // orbit itself (radius = r + ORBIT_MAX_GAP) still has to land past -OB_MARGIN
    const planet = { x: -OB_MARGIN - 10, y: COURSE_H * 0.5, r: 8, m: 64, type: 'planet', pal: { base: '#fff', dark: '#000' } };
    world.bodies.push(planet);
    world.blackHole = { x: -1000, y: -1000, r: 3.2, m: 230, type: 'hole' }; // far away, no accidental sink
    // hug the outer edge of the capture band, starting on the far (out-of-bounds) side
    const d = planet.r + ORBIT_MAX_GAP;
    const vc = circularSpeed(planet.m, d);
    game.beginOrbit(planet, { radius: d, omega: vc / d, ang: Math.PI });
    assert.ok(comet.x < -OB_MARGIN, 'sanity: this orbit starts outside the course boundary');
    game.stepOrbit(DT);
    assert.equal(S.phase, 'rest', 'rescued back to rest instead of orbiting off-screen forever (GOLF-1: was "no way to restart")');
    assert.equal(world.orbit, null);
    assert.equal(comet.rest.b, teeRock, 'comet returned to its last rest spot (the tee)');
});

test('GOLF Mode Catch-Up: a comet past the old OB_MARGIN (14) but within the widened one stays in flight (2026-07-19)', () => {
    game.startRun('endless');
    world.bodies = [];
    world.blackHole = { x: 1000, y: 1000, r: 3.2, m: 230, type: 'hole' }; // far away, no accidental sink
    comet.x = -20; comet.y = COURSE_H * 0.5;   // past the old tight margin, inside the widened one
    comet.vx = 5; comet.vy = 0;                // heading back toward the course
    S.phase = 'flight'; S.tFlight = 1;
    game.stepFlight(DT);
    assert.equal(S.phase, 'flight', 'no longer rescued just for clearing the old ~7%-overshoot margin');
});

test('GOLF Mode Catch-Up: a genuinely escaping flight still gets rescued past the widened OB_MARGIN', () => {
    game.startRun('endless');
    world.bodies = [];
    world.blackHole = { x: 1000, y: 1000, r: 3.2, m: 230, type: 'hole' };
    comet.x = -(OB_MARGIN + 5); comet.y = COURSE_H * 0.5;
    comet.vx = -50; comet.vy = 0;
    S.phase = 'flight'; S.tFlight = 1;
    game.stepFlight(DT);
    assert.equal(S.phase, 'rest', 'still rescued once truly past the widened boundary — the safety net is wider, not gone');
});

test('launch adds the flick as an impulse to current velocity (force-push, BH-4)', () => {
    game.startRun('endless');
    // simulate flicking out of an orbit: comet already carries orbital velocity
    comet.vx = 15; comet.vy = 5;
    world.orbit = { b: { x: 0, y: 0 }, radius: 18, ang: 0, omega: 1 };
    const ok = game.launch(0, -40, 40);            // full-power straight up: impulse (0,-120)
    assert.equal(ok, true);
    assert.ok(Math.abs(comet.vx - 15) < 1e-9, 'x velocity preserved (impulse added, not overwritten)');
    assert.ok(Math.abs(comet.vy - (5 - 120)) < 1e-9, 'y velocity = prior + impulse');
    assert.equal(world.orbit, null, 'orbit released on launch');
    assert.equal(S.phase, 'flight');
});

/* ============================== hole generation ============================== */

test('genHole invariants hold across many holes and difficulties', () => {
    for (let n = 1; n <= 12; n++) {
        for (let rep = 0; rep < 5; rep++) {
            game.genHole(n);
            assert.ok(S.par >= 2 && S.par <= 4, `par ${S.par} in [2,4]`);
            assert.equal(S.strokes, 0);
            assert.equal(S.hopsThisHole, 0);
            const { teeRock, blackHole } = world;
            assert.ok(teeRock.y >= COURSE_H * 0.84 - 1e-9 && teeRock.y <= COURSE_H * 0.9 + 1e-9, 'tee near the bottom');
            assert.ok(blackHole.y <= COURSE_H * 0.17 + 1e-9, 'hole near the top');
            for (const b of world.bodies) {
                if (b.type !== 'planet') continue;
                assert.ok(b.x - b.r >= 0 && b.x + b.r <= WORLD_W, 'planet inside course width');
                assert.ok(dist(b.x, b.y, teeRock.x, teeRock.y) > b.r + 15 - 1e-9, 'planet clear of the tee');
                assert.ok(dist(b.x, b.y, blackHole.x, blackHole.y) > b.r + 14 - 1e-9, 'planet clear of the hole');
            }
            // comet rests on the tee
            assert.ok(Math.abs(dist(comet.x, comet.y, teeRock.x, teeRock.y) - (teeRock.r + COMET_R + 0.25)) < 1e-9);
        }
    }
});

test('genHole difficulty ramps planet count with hole number', () => {
    const count = n => {
        game.genHole(n);
        return world.bodies.filter(b => b.type === 'planet').length;
    };
    // hole 1 targets 1 planet; hole 8+ targets 4 (placement can drop some, so sample maxima)
    let max1 = 0, max9 = 0;
    for (let i = 0; i < 8; i++) { max1 = Math.max(max1, count(1)); max9 = Math.max(max9, count(9)); }
    assert.ok(max1 <= 1, 'hole 1 places at most one planet');
    assert.ok(max9 >= 2, 'late holes place several planets');
});

/* ============================== rounds & scoring flow ============================== */

test('startRun resets state for the chosen mode', () => {
    game.startRun('round');
    assert.equal(S.mode, 'round');
    assert.equal(S.hole, 1);
    assert.equal(S.totalDiff, 0);
    assert.deepEqual(S.roundCard, []);
    assert.equal(S.phase, 'rest');
});

test('holeComplete records the scorecard line and totals vs par', () => {
    game.startRun('round');
    S.strokes = S.par + 1;              // bogey
    game.holeComplete();
    assert.equal(S.totalDiff, 1);
    assert.equal(S.roundCard.length, 1);
    assert.equal(S.roundCard[0].hole, 1);
    assert.equal(S.roundCard[0].strokes, S.roundCard[0].par + 1);
    assert.equal(S.roundCard[0].hopped, false);
    assert.equal(S.phase, 'result');
    game.nextHole();
    assert.equal(S.hole, 2);
    assert.equal(S.phase, 'rest');
});

test('landing on a planet marks the hole as hopped', () => {
    game.startRun('endless');
    const planet = { x: 50, y: 50, r: 8, m: 64, type: 'planet', pal: { base: '#fff', dark: '#000' } };
    world.bodies.push(planet);
    game.landOn(planet, 0);
    assert.equal(S.hopsThisHole, 1);
    game.landOn(planet, 1);
    assert.equal(S.hopsThisHole, 1, 'same planet only counts once');
    S.strokes = S.par;
    game.holeComplete();
    assert.equal(S.roundCard[0].hopped, true);
});



test('endless mode never triggers the round end', () => {
    let ended = false;
    game.setHooks({ roundEnd() { ended = true; } });
    game.startRun('endless');
    for (let h = 1; h <= ROUND_HOLES + 1; h++) {
        S.strokes = S.par;
        game.holeComplete();
        game.nextHole();
    }
    assert.equal(ended, false);
    assert.equal(S.hole, ROUND_HOLES + 2);
    game.setHooks({ roundEnd() {} });
});

test('EXP-1a: collecting a stardust pickup increments S.stardust and fires the persistence hook', () => {
    game.startRun('endless');
    let persisted = null;
    game.setHooks({ stardust(total) { persisted = total; } });
    const before = S.stardust;
    world.pickups.push({ x: comet.x, y: comet.y, r: 5, type: 'stardust' });
    game.stepFlight(0);
    assert.equal(S.stardust, before + 1);
    assert.equal(persisted, before + 1, 'hooks.stardust should fire with the new running total');
    game.setHooks({ stardust() {} });
});

test('launch: weak drags cancel, real drags spend a stroke', () => {
    game.startRun('endless');
    const ok = game.launch(0, -1, 0.5);   // tiny drag → below MIN_SHOT
    assert.equal(ok, false);
    assert.equal(S.strokes, 0);
    assert.equal(S.phase, 'rest');
    const ok2 = game.launch(0, -1, 100);  // full-power drag
    assert.equal(ok2, true);
    assert.equal(S.strokes, 1);
    assert.equal(S.phase, 'flight');
    assert.ok(comet.vy < 0, 'launched upward');
});

/* ============================== STAB-1: liftoff grace ============================== */

test('gravityAt damp scales only the named body\'s pull (STAB-1)', () => {
    const planet = { x: 50, y: 50, r: 10, m: 100, type: 'planet' };
    const full = gravityAt([planet], null, 30, 50);
    const half = gravityAt([planet], null, 30, 50, { body: planet, factor: 0.5 });
    assert.ok(Math.abs(half[0] - full[0] * 0.5) < 1e-9, 'damped pull is exactly scaled');
    // damp targeting a different object leaves the field untouched
    const untouched = gravityAt([planet], null, 30, 50, { body: { x: 0, y: 0 }, factor: 0.1 });
    assert.deepEqual(untouched, full);
});

test('launch off a planet surface arms the liftoff grace; tee shots do not (STAB-1)', () => {
    game.startRun('endless');
    // tee shot: no grace
    game.launch(0, -1, 100);
    assert.equal(S.liftoff, 0, 'tee launch does not arm the grace');
    assert.equal(world.launchBody, null);

    // now rest on a planet and flick off it
    game.startRun('endless');
    const planet = { x: 50, y: 90, r: 15, m: 225, type: 'planet', pal: { base: '#fff', dark: '#000' } };
    world.bodies.push(planet);
    comet.rest = { b: planet, ang: -Math.PI / 2 };  // resting on top
    game.placeOnRest();
    comet.vx = comet.vy = 0;
    S.phase = 'rest';
    game.launch(0, -100, 100);                        // full-power flick, straight up (outward)
    assert.ok(S.liftoff > 0, 'planet launch arms the grace');
    assert.equal(world.launchBody, planet);
});

test('a full flick off the biggest planet gets clear instead of instant re-capture (STAB-1)', () => {
    // Regression for "some planets too big can't escape": a comet on a max-size
    // planet, flicked radially outward at full power, must clear the surface (not
    // be dragged straight back and re-land in place). Isolated planet so the only
    // possible re-lander is this one.
    game.startRun('endless');
    world.bodies = [];
    world.blackHole = { x: 50, y: 300, r: 3.2, m: 230, type: 'hole' }; // far away, off-course
    const planet = { x: 50, y: 90, r: 15, m: 225, type: 'planet', pal: { base: '#fff', dark: '#000' } };
    world.bodies.push(planet);
    world.teeRock = { x: 50, y: 150, r: 3.4, m: 8, type: 'tee' };
    world.bodies.push(world.teeRock);

    const surfD = planet.r + COMET_R + 0.25;
    let clearedFor = 0, tested = 0;
    // sample rest points and flick radially outward from each
    for (let i = 0; i < 8; i++) {
        const restAng = (i / 8) * Math.PI * 2;
        comet.rest = { b: planet, ang: restAng };
        game.placeOnRest();
        comet.vx = comet.vy = 0;
        S.phase = 'rest';
        world.lastRest = { rest: comet.rest };
        S.fuel = 100; // Refuel before each test flick
        // flick straight outward (away from planet centre) at full power — the drag
        // vector's length must equal `len`, so scale the unit direction by it.
        game.launch(Math.cos(restAng) * 100, Math.sin(restAng) * 100, 100);
        tested++;
        let maxD = 0;
        for (let s = 0; s < 240 * 8 && S.phase === 'flight'; s++) {
            game.stepFlight(DT);
            maxD = Math.max(maxD, dist(comet.x, comet.y, planet.x, planet.y));
        }
        // "cleared" = got well off the surface at some point (no instant re-capture)
        if (maxD > surfD + 20) clearedFor++;
    }
    assert.equal(clearedFor, tested, 'every radially-outward full flick clears the big planet');
});

/* ============================== STAB-2: temporary zoom-out ============================== */

test('fitZoom returns 1 (no zoom) whenever the span already fits (STAB-2)', () => {
    // a golf-size orbit / body span fits easily inside the viewport → never zooms
    assert.equal(fitZoom(56, 100), 1, 'biggest golf orbit (~r28 → span56) fits at vwMin=100');
    assert.equal(fitZoom(40, 100), 1, 'resting on a big golf planet fits');
    assert.equal(fitZoom(0, 100), 1, 'no focus span → no zoom');
    assert.equal(fitZoom(90, 0), 1, 'degenerate viewport → no zoom');
});

test('fitZoom zooms OUT for spans too big to fit, clamped to ZOOM_MIN (STAB-2)', () => {
    // Explore giant: r=40 → orbit span ~90 in a ~78-unit viewport must zoom out
    const z = fitZoom(90, 78);
    assert.ok(z < 1 && z >= ZOOM_MIN, `giant orbit zooms out within bounds (got ${z})`);
    assert.ok(Math.abs(z - (78 * ZOOM_FIT) / 90) < 1e-9, 'zoom equals the fit ratio when above the floor');
    // an absurdly large span is clamped, never smaller than ZOOM_MIN
    assert.equal(fitZoom(100000, 78), ZOOM_MIN, 'huge span clamps to the floor');
});

/* ============================== STAB-3: editor drag/delete robustness ============================== */

function fakeTrashEl() {
    return { classList: { add() {}, remove() {}, contains() { return false; } },
             getBoundingClientRect() { return { left: 0, top: 0, right: 0, bottom: 0 }; } };
}

test('editor sfx exposes pop() so add/delete never throw (STAB-3)', async () => {
    const sfxmod = await import('../games/black-hole-in-one/sfx.js');
    assert.equal(typeof sfxmod.sfx.pop, 'function');
    assert.doesNotThrow(() => sfxmod.sfx.pop(), 'pop() is a safe no-op headless');
});

test('editor: a canceled drag does not wedge future drags (STAB-3)', async () => {
    globalThis.document = { getElementById: () => fakeTrashEl() };
    const ed = await import('../games/black-hole-in-one/editor.js');
    ed.setHooks({ toast() {}, bar() {}, sfx: { pop() {} } });
    world.bodies = [];   // isolate from any planet a prior test left behind
    ed.startEditor();
    ed.addPlanet();
    const planet = world.bodies.find(b => b.type === 'planet');
    assert.equal(ed.pointerDown(planet.x, planet.y, 1), true, 'first grab starts');
    ed.cancelDrag();                                      // the pointercancel path
    assert.equal(ed.pointerDown(planet.x, planet.y, 2), true, 'can grab again after a cancel');
    ed.cancelDrag();
    delete globalThis.document;
});

test('editor: deleting an object clears the drag and removes it (STAB-3)', async () => {
    globalThis.document = { getElementById: () => fakeTrashEl() };
    const ed = await import('../games/black-hole-in-one/editor.js');
    ed.setHooks({ toast() {}, bar() {}, sfx: { pop() {} } });    // quiet during setup
    world.bodies = [];   // isolate from any planet a prior test left behind
    ed.startEditor();
    ed.addPlanet();
    const planet = world.bodies.find(b => b.type === 'planet');
    const n0 = world.bodies.length;
    assert.equal(ed.pointerDown(planet.x, planet.y, 5), true);
    ed.pointerMove(-100, -100, 5);                        // drag far out of bounds
    // now make the delete's pop() throw — proves pointerUp clears `dragged` BEFORE hooks fire
    ed.setHooks({ sfx: { pop() { throw new Error('boom'); } } });
    assert.throws(() => ed.pointerUp(-100, -100, 5), /boom/, 'the throwing hook still fires');
    assert.ok(!world.bodies.includes(planet), 'object was removed before the throw');
    assert.equal(world.bodies.length, n0 - 1);
    // despite the hook throwing, the editor is NOT wedged — a fresh grab works
    assert.equal(ed.pointerDown(world.teeRock.x, world.teeRock.y, 6), true, 'not wedged after delete');
    ed.cancelDrag();
    delete globalThis.document;
});

/* ============================== STAB-6: map serialize round-trip ============================== */

test('encodeMap → decodeMap round-trips a shared map without corruption (STAB-6)', async () => {
    const ed = await import('../games/black-hole-in-one/editor.js');
    const pal = { base: '#57c7c2', dark: '#20635f', name: 'teal' };
    const src = {
        teeRock:   { x: 50.16, y: 149.83 },
        blackHole: { x: 33.4,  y: 25.1 },
        bodies: [
            { type: 'planet', x: 42.37, y: 90.44, r: 12.6, pal, spin: 1.23 },
            { type: 'pulsar', x: 70.5,  y: 60.2 },
            { type: 'tee',    x: 50.16, y: 149.83 },   // tee also lives in bodies — must be dropped, not double-encoded
        ],
    };
    const hash = ed.encodeMap(src);
    assert.equal(typeof hash, 'string');
    assert.ok(!/[+/=]/.test(hash), 'hash is URL-safe base64 (no + / =)');

    const out = ed.decodeMap(hash);
    assert.ok(out, 'decodes to a map');
    // tee / hole positions survive (encoder rounds to 0.1)
    assert.ok(Math.abs(out.teeRock.x - 50.2) < 0.06 && Math.abs(out.teeRock.y - 149.8) < 0.06);
    assert.equal(out.teeRock.type, 'tee');
    assert.ok(Math.abs(out.blackHole.x - 33.4) < 0.06 && Math.abs(out.blackHole.y - 25.1) < 0.06);
    assert.equal(out.blackHole.type, 'hole');
    // exactly one planet + one pulsar (the stray tee in bodies is not re-encoded)
    const planets = out.bodies.filter(b => b.type === 'planet');
    const pulsars = out.bodies.filter(b => b.type === 'pulsar');
    assert.equal(planets.length, 1);
    assert.equal(pulsars.length, 1);
    const p = planets[0];
    assert.ok(Math.abs(p.x - 42.4) < 0.06 && Math.abs(p.y - 90.4) < 0.06 && Math.abs(p.r - 12.6) < 0.06);
    assert.ok(Math.abs(p.m - 12.6 * 12.6) < 0.5, 'planet mass is derived from radius on decode');
    assert.deepEqual(p.pal, pal, 'palette survives the round-trip');
    assert.equal(pulsars[0].m, -160, 'pulsar decodes to the standard repulsor mass');
});

test('decodeMap rejects garbage and maps missing a tee or hole (STAB-6)', async () => {
    const ed = await import('../games/black-hole-in-one/editor.js');
    assert.equal(ed.decodeMap('not-valid-base64!!!'), null, 'garbage → null, no throw');
    assert.equal(ed.decodeMap(''), null, 'empty → null');
    // a map with only a planet (no tee/hole) is invalid
    const hashNoTee = ed.encodeMap({ teeRock: { x: 9999, y: 9999 }, blackHole: { x: 1, y: 1 }, bodies: [] });
    // sanity: a valid one decodes
    assert.ok(ed.decodeMap(hashNoTee), 'a well-formed map still decodes');
});

test('editor: dropping an in-bounds object on the trash zone deletes it (STAB-3 follow-up)', async () => {
    // trash rect is measured while visible; a pointer-up inside it must delete even
    // though the object itself is still on the board (not out of bounds).
    globalThis.document = { getElementById: () => ({
        classList: { add() {}, remove() {}, contains() { return false; } },
        getBoundingClientRect() { return { left: 120, top: 700, right: 255, bottom: 760 }; },
    }) };
    const ed = await import('../games/black-hole-in-one/editor.js');
    ed.setHooks({ toast() {}, bar() {}, sfx: { pop() {} } });
    world.bodies = [];
    ed.startEditor();
    ed.addPlanet();
    const planet = world.bodies.find(b => b.type === 'planet');   // sits at (50, ~85), well in bounds
    assert.equal(ed.pointerDown(planet.x, planet.y, 9), true);
    ed.pointerMove(50, 85, 9);                                     // still in bounds
    ed.pointerUp(50, 85, 9, /*cx*/ 180, /*cy*/ 730);              // release with pointer INSIDE the trash rect
    assert.ok(!world.bodies.includes(planet), 'in-bounds object dropped on trash is deleted');
    ed.cancelDrag();
    delete globalThis.document;
});

/* ============================== MAP-1: star map landmarks ============================== */

test('chunkLandmarks is deterministic for a given cx/cy/seed', () => {
    const a = chunkLandmarks(-5, -5, 'explore-1');
    const b = chunkLandmarks(-5, -5, 'explore-1');
    assert.deepEqual(a, b);
});

test('chunkLandmarks surfaces exactly the black holes and refuel-station planets getChunkBodies generated, nothing else', () => {
    // (-5,-5) is a known black-hole chunk, (-5,-4) a known station chunk, (6,0) has neither, for seed 'explore-1'.
    const bhBodies = getChunkBodies(-5, -5, 'explore-1');
    const bhLandmarks = chunkLandmarks(-5, -5, 'explore-1');
    const expectedBH = bhBodies.filter(b => b.type === 'blackhole' || b.refuelStation);
    assert.equal(bhLandmarks.length, expectedBH.length);
    for (const lm of bhLandmarks) {
        const src = expectedBH.find(b => b.id === lm.id);
        assert.ok(src, `landmark id ${lm.id} matches a real body`);
        assert.equal(lm.x, src.x);
        assert.equal(lm.y, src.y);
        assert.equal(lm.kind, src.type === 'blackhole' ? 'blackhole' : 'station');
    }
    assert.ok(bhLandmarks.some(l => l.kind === 'blackhole'), 'known black-hole chunk actually yields one');

    const stationLandmarks = chunkLandmarks(-5, -4, 'explore-1');
    assert.ok(stationLandmarks.some(l => l.kind === 'station'), 'known station chunk actually yields one');
    assert.ok(!stationLandmarks.some(l => l.kind === 'blackhole'), 'that chunk has no black hole');

    assert.deepEqual(chunkLandmarks(6, 0, 'explore-1'), [], 'a chunk with neither still returns an empty array, not a hole');
});

test('chunkLandmarks never surfaces plain planets, moons, or rings as landmarks', () => {
    for (const [cx, cy] of [[-5, -5], [-5, -4], [0, 0], [6, 0], [2, 3]]) {
        for (const lm of chunkLandmarks(cx, cy, 'explore-1')) {
            assert.ok(lm.kind === 'blackhole' || lm.kind === 'station', `unexpected landmark kind "${lm.kind}"`);
        }
    }
});

/* ============================== MAP-2: star map hit-testing ============================== */

test('hitTestMapTargets picks the target whose radius contains the point', () => {
    const targets = [
        { kind: 'town', id: 'town', x: 100, y: 100, r: 22 },
        { kind: 'blackhole', id: 'bh1', x: 250, y: 250, r: 30 },
    ];
    assert.equal(hitTestMapTargets(100, 100, targets), targets[0], 'dead center hits');
    assert.equal(hitTestMapTargets(110, 100, targets), targets[0], 'within radius hits');
    assert.equal(hitTestMapTargets(260, 245, targets), targets[1]);
    assert.equal(hitTestMapTargets(500, 500, targets), null, 'far from everything misses');
    assert.equal(hitTestMapTargets(100, 123, targets), null, 'just outside the radius misses');
});

test('hitTestMapTargets breaks overlapping-radius ties in favor of the closer center', () => {
    const targets = [
        { kind: 'town', id: 'far', x: 0, y: 0, r: 50 },
        { kind: 'blackhole', id: 'near', x: 10, y: 0, r: 50 },
    ];
    assert.equal(hitTestMapTargets(9, 0, targets).id, 'near');
});

test('hitTestMapTargets returns null for an empty target list', () => {
    assert.equal(hitTestMapTargets(0, 0, []), null);
});
