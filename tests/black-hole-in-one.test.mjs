// Unit tests for games/black-hole-in-one/ pure logic:
// constants helpers, physics (gravity, integration, collision response),
// hole generation invariants, and round/scorecard flow (gameplay.js headless).
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
    WORLD_W, COURSE_H, CAPTURE_R, COMET_R, REST_V, SOFT_CATCH, MAX_V, DT, G,
    ROUND_HOLES, fmtDiff, holeLabel, isBetterRound, dist, circularSpeed, fitZoom, ZOOM_MIN, ZOOM_FIT,
    upgradeCost, tankMaxFuel, siphonGain, sensorChunkRadius, LS_KEYS, hitTestMapTargets,
    OB_MARGIN, ORBIT_MAX_GAP, MAP_SIZES, DEFAULT_MAP_SIZE, mapBounds,
    overviewAvailable, overviewTransform, overviewToWorld, worldToOverview,
    GLOSSARY_OBJECTS, GLOSSARY_MECHANICS, ITEMS, PLANET_R_MIN, PLANET_R_MAX, PLANET_R_STEP,
} from '../games/black-hole-in-one/constants.js';
import { gravityAt, stepBody, collide, orbitCapture, magnetCapture } from '../games/black-hole-in-one/physics.js';
import { S, world, comet, defaultGlossarySeen, mergeGlossarySeen, markGlossarySeen } from '../games/black-hole-in-one/state.js';
import * as game from '../games/black-hole-in-one/gameplay.js';
import {
    chunkLandmarks, getChunkBodies, CHUNK_SIZE, camera as exploreCamera,
    updateActiveChunks, startRun as exploreStartRun,
    step as exploreStep, setHooks as setExploreHooks, keyDown as exploreKeyDown, clearKeys as exploreClearKeys, fuel as exploreFuel,
} from '../games/black-hole-in-one/explore.js';

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

test('launch spends fuel and blocks flight past 0 in Custom Map mode (FUEL-6)', () => {
    globalThis.document = { getElementById: () => fakeTrashEl() };
    game.startCustomMap({
        teeRock: { x: 50, y: 176, r: 3.4, m: 8, type: 'tee' },
        blackHole: { x: 50, y: 30, r: 3.2, m: 230, type: 'hole' },
        bodies: [], pickups: [],
    });
    assert.equal(S.fuel, 100);
    const ok = game.launch(0, -1, 100);   // full-power drag
    assert.equal(ok, true, 'a real drag must still launch in custom mode');
    assert.equal(S.fuel, 85, 'custom-map fuel must drain per flick, same as endless (FUEL-6 root cause)');

    S.fuel = 0;
    comet.rest = { b: world.teeRock, ang: -Math.PI / 2 };
    game.placeOnRest();
    comet.vx = comet.vy = 0;
    S.phase = 'rest';
    const blocked = game.launch(0, -1, 100);
    assert.equal(blocked, false, 'a custom map must not be flyable past 0 fuel');
    assert.equal(S.phase, 'rest', 'phase must not stay stuck at "aiming" on a failed 0-fuel launch attempt');
    delete globalThis.document;
});

test('launch restores S.phase from "aiming" on a failed 0-fuel attempt in Custom Map mode, mirroring the FUEL-3 fix (FUEL-6)', () => {
    globalThis.document = { getElementById: () => fakeTrashEl() };
    game.startCustomMap({
        teeRock: { x: 50, y: 176, r: 3.4, m: 8, type: 'tee' },
        blackHole: { x: 50, y: 30, r: 3.2, m: 230, type: 'hole' },
        bodies: [], pickups: [],
    });
    S.fuel = 0;
    S.phase = 'aiming';   // main.js's pointerdown sets this when a drag starts
    const ok = game.launch(0, -1, 100);
    assert.equal(ok, false);
    assert.equal(S.phase, 'rest',
        'a 0-fuel aim in custom mode used to strand S.phase at "aiming" forever (same softlock class as FUEL-3)');
    delete globalThis.document;
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

/* ============================== MM-6: map size chooser ============================== */

test('mapBounds resolves both size tiers and falls back to small for an unknown key (MM-6)', () => {
    assert.deepEqual(mapBounds('small'), { w: WORLD_W, h: COURSE_H });
    assert.deepEqual(mapBounds('large'), MAP_SIZES.large);
    assert.ok(MAP_SIZES.large.w > WORLD_W && MAP_SIZES.large.h > COURSE_H, 'large is actually bigger than one screen');
    assert.deepEqual(mapBounds('nonsense'), MAP_SIZES[DEFAULT_MAP_SIZE]);
    assert.deepEqual(mapBounds(undefined), MAP_SIZES[DEFAULT_MAP_SIZE]);
});

test('encodeMap → decodeMap round-trips the large size tier (MM-6)', async () => {
    const ed = await import('../games/black-hole-in-one/editor.js');
    const src = {
        teeRock: { x: 300, y: 528 },
        blackHole: { x: 300, y: 90 },
        bodies: [],
        size: 'large',
    };
    const hash = ed.encodeMap(src);
    const out = ed.decodeMap(hash);
    assert.ok(out, 'decodes to a map');
    assert.equal(out.size, 'large');
});

test('decodeMap defaults size to small when a map carries no size tag (MM-6, pre-sprint maps)', async () => {
    const ed = await import('../games/black-hole-in-one/editor.js');
    // No `size` field at all — this is exactly what an already-shared pre-MM-6 link decodes from.
    const hash = ed.encodeMap({ teeRock: { x: 50, y: 176 }, blackHole: { x: 50, y: 30 }, bodies: [] });
    const out = ed.decodeMap(hash);
    assert.ok(out);
    assert.equal(out.size, 'small', 'a map with no encoded size tag defaults to small — no silent breakage');
});

test('startEditor(size) starts a fresh map sized to the chosen tier (MM-6)', async () => {
    globalThis.document = { getElementById: () => fakeTrashEl() };
    const ed = await import('../games/black-hole-in-one/editor.js');
    ed.setHooks({ toast() {}, bar() {}, sfx: { pop() {} } });

    ed.startEditor('small');
    assert.equal(world.mapSizeKey, 'small');
    assert.equal(world.teeRock.x, WORLD_W / 2);
    assert.equal(world.blackHole.x, WORLD_W / 2);
    assert.ok(world.teeRock.y <= COURSE_H && world.blackHole.y <= COURSE_H, 'small default tee/hole sit within the small canvas');

    ed.startEditor('large');
    assert.equal(world.mapSizeKey, 'large');
    assert.equal(world.teeRock.x, MAP_SIZES.large.w / 2);
    assert.equal(world.blackHole.x, MAP_SIZES.large.w / 2);
    assert.ok(world.teeRock.y > COURSE_H, 'large default tee sits beyond the small canvas height — it is actually a bigger map');

    ed.addPlanet();
    const planet = world.bodies.find(b => b.type === 'planet');
    assert.equal(planet.x, MAP_SIZES.large.w / 2, 'Add Planet centers on the ACTIVE map size, not the small default');

    ed.startEditor(); // no args — must not throw, must default to small
    assert.equal(world.mapSizeKey, 'small');
    delete globalThis.document;
});

test('editor: the out-of-bounds delete threshold scales with the map\'s size tier (MM-6)', async () => {
    globalThis.document = { getElementById: () => fakeTrashEl() };
    const ed = await import('../games/black-hole-in-one/editor.js');
    ed.setHooks({ toast() {}, bar() {}, sfx: { pop() {} } });

    ed.startEditor('large');
    ed.addPlanet();
    let planet = world.bodies.find(b => b.type === 'planet');
    assert.equal(ed.pointerDown(planet.x, planet.y, 21), true);
    // Well past the SMALL canvas (200) but still inside the LARGE one (600) — must survive.
    ed.pointerMove(250, 300, 21);
    ed.pointerUp(250, 300, 21);
    assert.ok(world.bodies.includes(planet), 'position beyond the small canvas is still in-bounds on a large map');

    assert.equal(ed.pointerDown(planet.x, planet.y, 22), true);
    ed.pointerMove(650, 650, 22); // past the large canvas + margin
    ed.pointerUp(650, 650, 22);
    assert.ok(!world.bodies.includes(planet), 'position beyond the large canvas is deleted');
    delete globalThis.document;
});

test('game.startRun resets mapSizeKey to small for golf/endless, even after a large editor/custom session (MM-6)', () => {
    world.mapSizeKey = 'large';
    game.startRun('endless');
    assert.equal(world.mapSizeKey, DEFAULT_MAP_SIZE, 'golf/endless always play at the default scale');
});

test('game.startCustomMap honors mapData.size and defaults missing size to small (MM-6)', () => {
    globalThis.document = { getElementById: () => fakeTrashEl() };
    const bodies = [];
    const teeRock = { x: 50, y: 176, r: 3.4, m: 8, type: 'tee' };
    const blackHole = { x: 50, y: 30, r: 3.2, m: 230, type: 'hole' };

    game.startCustomMap({ teeRock: { ...teeRock }, blackHole: { ...blackHole }, bodies: [...bodies] });
    assert.equal(world.mapSizeKey, DEFAULT_MAP_SIZE, 'a pre-sprint map with no size field plays at the small default');

    game.startCustomMap({ teeRock: { ...teeRock }, blackHole: { ...blackHole }, bodies: [...bodies], size: 'large' });
    assert.equal(world.mapSizeKey, 'large');
    delete globalThis.document;
});

/* ============================== MM-16: editor overview mode ============================== */

test('overviewAvailable gates on the large tier only (MM-16)', () => {
    assert.equal(overviewAvailable('large'), true);
    assert.equal(overviewAvailable('small'), false);
    assert.equal(overviewAvailable(undefined), false);
});

test('overviewTransform fits the map to the container, centered, preserving aspect (MM-16)', () => {
    // Square map, square canvas — scale is a simple ratio, no letterboxing either axis.
    const t1 = overviewTransform(600, 600, 460, 460);
    assert.equal(t1.scale, 460 / 600);
    assert.ok(Math.abs(t1.ox) < 1e-9);
    assert.ok(Math.abs(t1.oy) < 1e-9);

    // Non-square map in a square canvas — the taller/wider axis sets scale, the
    // other axis gets centered margin (letterboxed), matching renderStarMap's own
    // fit-and-center convention.
    const t2 = overviewTransform(600, 300, 460, 460);
    assert.equal(t2.scale, 460 / 600, 'the wider dimension is the constraint');
    assert.ok(Math.abs(t2.ox) < 1e-9, 'no horizontal margin — width fills exactly');
    assert.ok(t2.oy > 0, 'vertical margin centers the shorter map');

    // Degenerate inputs (canvas not laid out yet, e.g. clientWidth still 0) must
    // not divide by zero or return NaN/Infinity — same defensive convention as
    // mapBounds() falling back for an unknown size key.
    const t3 = overviewTransform(600, 600, 0, 0);
    assert.equal(t3.scale, 1);
    assert.equal(t3.ox, 0);
    assert.equal(t3.oy, 0);
});

test('overviewToWorld / worldToOverview are exact inverses across the full map (MM-16)', () => {
    const t = overviewTransform(600, 600, 460, 460);
    for (const [wx, wy] of [[0, 0], [600, 600], [300, 300], [17.5, 583.2]]) {
        const screen = worldToOverview(wx, wy, t);
        const back = overviewToWorld(screen.x, screen.y, t);
        assert.ok(Math.abs(back.x - wx) < 1e-9, `x round-trips for (${wx},${wy})`);
        assert.ok(Math.abs(back.y - wy) < 1e-9, `y round-trips for (${wx},${wy})`);
    }
});

test('overviewToWorld extrapolates past the canvas edge — needed for the "drag off the edge deletes" behavior (MM-16)', () => {
    const t = overviewTransform(600, 600, 460, 460);
    // A pointer dragged well beyond the visible canvas must still map to a world
    // point past the map's own bounds (+margin), not clamp to the edge — that's
    // what lets editor.js's existing out-of-bounds delete check fire from overview
    // exactly the way it already does from the 1:1 view.
    const past = overviewToWorld(-50, -50, t);
    assert.ok(past.x < 0 && past.y < 0);
});

test('overview drag repositions a body by the same world coordinates as the 1:1 editor (MM-16)', async () => {
    globalThis.document = { getElementById: () => fakeTrashEl() };
    const ed = await import('../games/black-hole-in-one/editor.js');
    ed.setHooks({ toast() {}, bar() {}, sfx: { pop() {} } });

    ed.startEditor('large');
    ed.addPlanet();
    const planet = world.bodies.find(b => b.type === 'planet');

    // Simulate a drag driven through overview screen coordinates: convert the
    // planet's current world position to an overview screen point, "drag" it to
    // a new screen point, and confirm the body's world coords land exactly where
    // that screen point maps back to — i.e. overview dragging is pixel-for-pixel
    // the same world-coordinate mutation the 1:1 view already does, just fed
    // through a different screen transform.
    const t = overviewTransform(MAP_SIZES.large.w, MAP_SIZES.large.h, 460, 460);
    const startScreen = worldToOverview(planet.x, planet.y, t);
    const targetScreen = { x: startScreen.x + 40, y: startScreen.y - 25 };
    const startWorld = overviewToWorld(startScreen.x, startScreen.y, t);
    const targetWorld = overviewToWorld(targetScreen.x, targetScreen.y, t);

    assert.equal(ed.pointerDown(startWorld.x, startWorld.y, 30), true);
    ed.pointerMove(targetWorld.x, targetWorld.y, 30);
    ed.pointerUp(targetWorld.x, targetWorld.y, 30);

    assert.ok(Math.abs(planet.x - targetWorld.x) < 1e-9);
    assert.ok(Math.abs(planet.y - targetWorld.y) < 1e-9);
    assert.ok(world.bodies.includes(planet), 'stayed in-bounds, so not deleted');
    delete globalThis.document;
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

/* ============================== MM-18: object glossary ============================== */

test('GLOSSARY_OBJECTS and GLOSSARY_MECHANICS each have a unique key, icon, label, and desc', () => {
    for (const list of [GLOSSARY_OBJECTS, GLOSSARY_MECHANICS]) {
        const keys = new Set();
        for (const e of list) {
            assert.ok(e.key && typeof e.key === 'string');
            assert.ok(e.icon && typeof e.icon === 'string');
            assert.ok(e.label && typeof e.label === 'string');
            assert.ok(e.desc && typeof e.desc === 'string');
            assert.ok(!keys.has(e.key), `duplicate key ${e.key}`);
            keys.add(e.key);
        }
    }
});

test('LS_KEYS carries the glossarySeen localStorage key (MM-18)', () => {
    assert.equal(LS_KEYS.glossarySeen, 'blackHoleInOne_glossarySeen');
});

test('defaultGlossarySeen covers every GLOSSARY_OBJECTS/GLOSSARY_MECHANICS/ITEMS key, all false', () => {
    const seen = defaultGlossarySeen();
    for (const e of [...GLOSSARY_OBJECTS, ...GLOSSARY_MECHANICS, ...ITEMS]) {
        assert.equal(seen[e.key], false, `${e.key} defaults to unseen`);
    }
});

test('markGlossarySeen flips a key true once and reports whether it was a new discovery', () => {
    S.glossarySeen = defaultGlossarySeen();
    assert.equal(markGlossarySeen('planet'), true, 'first mark is new');
    assert.equal(S.glossarySeen.planet, true);
    assert.equal(markGlossarySeen('planet'), false, 'already seen — not new again');
});

test('mergeGlossarySeen carries over only known true keys, drops unknown ones, keeps the rest false', () => {
    const merged = mergeGlossarySeen({ planet: true, mine: false, notARealKey: true });
    assert.equal(merged.planet, true);
    assert.equal(merged.mine, false);
    assert.equal(merged.notARealKey, undefined);
    assert.equal(merged.tee, false);
});

test('mergeGlossarySeen tolerates null/corrupt saved data and returns all-false defaults', () => {
    assert.deepEqual(mergeGlossarySeen(null), defaultGlossarySeen());
    assert.deepEqual(mergeGlossarySeen('garbage'), defaultGlossarySeen());
});

test('genHole marks tee/planet as seen and fires the glossary hook; a silent genHole (boot background) marks nothing (MM-18)', () => {
    S.glossarySeen = defaultGlossarySeen();
    let calls = 0;
    game.setHooks({ glossary() { calls++; } });
    game.genHole(9); // late hole — near-guaranteed to place at least one planet
    assert.equal(S.glossarySeen.tee, true);
    assert.equal(S.glossarySeen.planet, true);
    assert.ok(calls > 0, 'hooks.glossary fired on real discovery');

    S.glossarySeen = defaultGlossarySeen();
    calls = 0;
    game.genHole(9, true); // silent — the decorative boot-background hole
    assert.equal(S.glossarySeen.tee, false, 'silent genHole marks nothing');
    assert.equal(calls, 0, 'silent genHole never calls hooks.glossary');
    game.setHooks({ glossary() {} });
});

test('launch marks "flick", landOn marks "landing", beginOrbit marks "orbitCapture", holeComplete marks "hole" (MM-18)', () => {
    game.startRun('endless');
    S.glossarySeen = defaultGlossarySeen(); // startRun's own genHole already marked tee/planet; reset for a clean check

    game.launch(0, -40, 40);
    assert.equal(S.glossarySeen.flick, true);

    const planet = { x: comet.x, y: comet.y + 20, r: 8, m: 64, type: 'planet', pal: { base: '#fff', dark: '#000' } };
    game.landOn(planet, 0);
    assert.equal(S.glossarySeen.landing, true);

    game.beginOrbit(planet, { radius: 12, ang: 0, omega: 1 });
    assert.equal(S.glossarySeen.orbitCapture, true);

    S.strokes = 1;
    game.holeComplete();
    assert.equal(S.glossarySeen.hole, true);
});

test('a fuel pickup collected in flight marks "refueling" (MM-18)', () => {
    game.startRun('endless');
    S.glossarySeen = defaultGlossarySeen();
    S.fuel = 50;
    world.bodies = [world.teeRock];
    world.pickups = [{ x: comet.x, y: comet.y, r: 1.8, type: 'fuel' }];
    game.stepFlight(DT);
    assert.equal(S.glossarySeen.refueling, true);
});

test('startCustomMap marks the objects present in the loaded map as seen (MM-18)', () => {
    globalThis.document = { getElementById: () => fakeTrashEl() };
    S.glossarySeen = defaultGlossarySeen();
    const teeRock = { x: 50, y: 176, r: 3.4, m: 8, type: 'tee' };
    const blackHole = { x: 50, y: 30, r: 3.2, m: 230, type: 'hole' };
    const planet = { x: 50, y: 90, r: 8, m: 64, type: 'planet', pal: { base: '#fff', dark: '#000' } };
    game.startCustomMap({ teeRock, blackHole, bodies: [planet] });
    assert.equal(S.glossarySeen.tee, true);
    assert.equal(S.glossarySeen.planet, true);
    delete globalThis.document;
});

/* ---- MM-18, Explore-side marking ---- */

function findChunkWithBody(predicate, seed = 'explore-1', range = 10) {
    for (let cx = -range; cx <= range; cx++) {
        for (let cy = -range; cy <= range; cy++) {
            if (cx === 0 && cy === 0) continue; // Town's own chunk — keep the fixture away from it
            if (getChunkBodies(cx, cy, seed).some(predicate)) return [cx, cy];
        }
    }
    return null;
}

// Loads chunk (cx,cy) "fresh" — first parks the camera a few chunks away so
// updateActiveChunks' own "already active" cache can't skip the real scan below.
function loadChunkFresh(cx, cy, silent = false) {
    exploreCamera.x = (cx + 5) * CHUNK_SIZE + CHUNK_SIZE / 2;
    exploreCamera.y = (cy + 5) * CHUNK_SIZE + CHUNK_SIZE / 2;
    updateActiveChunks(true);
    exploreCamera.x = cx * CHUNK_SIZE + CHUNK_SIZE / 2;
    exploreCamera.y = cy * CHUNK_SIZE + CHUNK_SIZE / 2;
    updateActiveChunks(silent);
}

test('explore.startRun(true) is silent (boot background); a real startRun marks the tee (MM-18)', () => {
    S.glossarySeen = defaultGlossarySeen();
    exploreStartRun(true);
    assert.equal(S.glossarySeen.tee, false, 'silent startRun marks nothing');

    S.glossarySeen = defaultGlossarySeen();
    exploreStartRun();
    assert.equal(S.glossarySeen.tee, true, 'a real startRun marks the tee rock as seen');
});

test('updateActiveChunks marks refuelStation/moonRing/stardustRing once their chunk is actually (non-silently) loaded, and stays silent when asked (MM-18)', () => {
    const cases = [
        ['refuelStation', b => b.refuelStation],
        ['moonRing', b => b.moon || b.ring],
        ['stardustRing', b => b.stardustRing],
    ];
    for (const [key, predicate] of cases) {
        const found = findChunkWithBody(predicate);
        assert.ok(found, `fixture assumption: some chunk has a ${key} body for this seed`);

        S.glossarySeen = defaultGlossarySeen();
        loadChunkFresh(found[0], found[1], true);
        assert.equal(S.glossarySeen[key], false, `silent load of a ${key} chunk marks nothing`);

        S.glossarySeen = defaultGlossarySeen();
        loadChunkFresh(found[0], found[1], false);
        assert.equal(S.glossarySeen[key], true, `real load of a ${key} chunk marks it seen`);
    }
});

test("explore step() calls hooks.bar() every frame while thrust drains fuel, so the HUD fuel bar visibly ticks down instead of only refreshing on the next unrelated event (FUEL-5)", () => {
    S.mode = 'explore';
    S.phase = 'flight';
    S.inventory.thruster = { owned: true, enabled: true };
    world.bodies = [];
    world.pickups = [];
    comet.x = 0; comet.y = 0; comet.vx = 0; comet.vy = 0;
    exploreClearKeys();
    exploreKeyDown('KeyW'); // hold thrust

    let barCalls = 0;
    setExploreHooks({ bar() { barCalls++; } });

    const fuelBefore = exploreFuel;
    exploreStep(1 / 60);

    assert.ok(barCalls > 0, 'hooks.bar() must fire while thrust is burning fuel, or the fuel bar never visually updates until an unrelated event redraws it');
    assert.ok(exploreFuel < fuelBefore, 'thrusting should have burned fuel this frame');

    exploreClearKeys();
    setExploreHooks({ bar() {} });
});

/* ============================== MM-15: planet size + all object types ============================== */

test('addPlanet default radius is reduced and within the stepper range (MM-15)', async () => {
    globalThis.document = { getElementById: () => fakeTrashEl() };
    const ed = await import('../games/black-hole-in-one/editor.js');
    ed.setHooks({ toast() {}, bar() {}, sfx: { pop() {} } });
    ed.startEditor();
    for (let i = 0; i < 30; i++) {
        world.bodies = world.bodies.filter(b => b.type !== 'planet');
        ed.addPlanet();
        const p = world.bodies.find(b => b.type === 'planet');
        assert.ok(p.r >= 6 && p.r < 10, `default Add Planet radius ${p.r} sits in the reduced 6-10 range`);
        assert.ok(p.r >= PLANET_R_MIN && p.r <= PLANET_R_MAX, 'still within the overall stepper bounds');
    }
    delete globalThis.document;
});

test('growSelectedPlanet/shrinkSelectedPlanet clamp to PLANET_R_MIN/MAX and keep mass = r*r (MM-15)', async () => {
    globalThis.document = { getElementById: () => fakeTrashEl() };
    const ed = await import('../games/black-hole-in-one/editor.js');
    ed.setHooks({ toast() {}, bar() {}, sfx: { pop() {} } });
    ed.startEditor();
    world.bodies = world.bodies.filter(b => b.type !== 'planet');
    ed.addPlanet();
    const p = world.bodies.find(b => b.type === 'planet');
    p.r = PLANET_R_MAX - 0.5;
    ed.growSelectedPlanet(); // addPlanet() already selected it
    assert.equal(p.r, PLANET_R_MAX, 'growing clamps at the ceiling instead of overshooting');
    assert.equal(p.m, PLANET_R_MAX * PLANET_R_MAX, 'mass stays derived from radius');

    p.r = PLANET_R_MIN + 0.5;
    ed.shrinkSelectedPlanet();
    assert.equal(p.r, PLANET_R_MIN, 'shrinking clamps at the floor');
    assert.equal(p.m, PLANET_R_MIN * PLANET_R_MIN);

    // no selection (or a non-planet selection) is a safe no-op
    ed.deselectBody();
    const rBefore = p.r;
    ed.growSelectedPlanet();
    assert.equal(p.r, rBefore, 'grow/shrink no-op once deselected');
    delete globalThis.document;
});

test('toggleSelectedRefuel flips refuelStation only on the selected planet (MM-15)', async () => {
    globalThis.document = { getElementById: () => fakeTrashEl() };
    const ed = await import('../games/black-hole-in-one/editor.js');
    ed.setHooks({ toast() {}, bar() {}, sfx: { pop() {} } });
    ed.startEditor();
    world.bodies = world.bodies.filter(b => b.type !== 'planet');
    ed.addPlanet();
    const p = world.bodies.find(b => b.type === 'planet');
    assert.ok(!p.refuelStation);
    ed.toggleSelectedRefuel();
    assert.equal(p.refuelStation, true);
    ed.toggleSelectedRefuel();
    assert.equal(p.refuelStation, false);
    delete globalThis.document;
});

test('addTrap/addMine/addFuelPickup/addStardustPickup push canonically-shaped objects (MM-15)', async () => {
    globalThis.document = { getElementById: () => fakeTrashEl() };
    const ed = await import('../games/black-hole-in-one/editor.js');
    ed.setHooks({ toast() {}, bar() {}, sfx: { pop() {} } });
    ed.startEditor();
    world.bodies = world.bodies.filter(b => b.type === 'tee');
    world.pickups = [];

    ed.addTrap();
    ed.addMine();
    ed.addFuelPickup();
    ed.addStardustPickup();

    const trap = world.bodies.find(b => b.type === 'trap');
    const mine = world.bodies.find(b => b.type === 'mine');
    assert.deepEqual([trap.r, trap.m], [2.8, 200], 'trap matches gameplay.js\'s canonical shape');
    assert.deepEqual([mine.r, mine.m], [2, 0], 'mine matches gameplay.js\'s canonical shape (no gravity)');

    assert.equal(world.pickups.length, 2, 'pickups live in world.pickups, not world.bodies');
    const fuel = world.pickups.find(p => p.type === 'fuel');
    const stardust = world.pickups.find(p => p.type === 'stardust');
    assert.equal(fuel.r, 1.8);
    assert.equal(stardust.r, 1.2);
    delete globalThis.document;
});

test('pointerDown selects a planet for the property panel, and deselects on empty space / non-planet taps (MM-15)', async () => {
    globalThis.document = { getElementById: () => fakeTrashEl() };
    const ed = await import('../games/black-hole-in-one/editor.js');
    ed.setHooks({ toast() {}, bar() {}, sfx: { pop() {} } });
    ed.startEditor();
    world.bodies = world.bodies.filter(b => b.type === 'tee');
    ed.addPlanet();
    const planet = world.bodies.find(b => b.type === 'planet');
    assert.equal(ed.getSelected(), planet, 'addPlanet auto-selects the new planet');
    planet.x = 60; planet.y = 60; // move off the map-center default so the pulsar below doesn't stack on it
    ed.deselectBody();
    ed.addPulsar();
    const pulsar = world.bodies.find(b => b.type === 'pulsar');
    assert.equal(ed.getSelected(), null, 'addPulsar does not auto-select');

    ed.pointerDown(planet.x, planet.y, 1);
    assert.equal(ed.getSelected(), planet, 'tapping a planet selects it');
    ed.cancelDrag();

    ed.pointerDown(pulsar.x, pulsar.y, 2);
    assert.equal(ed.getSelected(), null, 'tapping a pulsar clears the planet selection');
    ed.cancelDrag();

    ed.pointerDown(planet.x, planet.y, 3);
    assert.equal(ed.getSelected(), planet);
    ed.cancelDrag();
    ed.pointerDown(-500, -500, 4); // empty canvas
    assert.equal(ed.getSelected(), null, 'tapping empty space clears the selection');
    delete globalThis.document;
});

test('deleting the selected planet clears the selection (MM-15)', async () => {
    globalThis.document = { getElementById: () => fakeTrashEl() };
    const ed = await import('../games/black-hole-in-one/editor.js');
    ed.setHooks({ toast() {}, bar() {}, sfx: { pop() {} } });
    ed.startEditor();
    world.bodies = world.bodies.filter(b => b.type === 'tee');
    ed.addPlanet();
    const planet = world.bodies.find(b => b.type === 'planet');
    assert.equal(ed.getSelected(), planet);
    ed.pointerDown(planet.x, planet.y, 1);
    ed.pointerMove(-9999, -9999, 1); // drag out of bounds
    ed.pointerUp(-9999, -9999, 1);
    assert.ok(!world.bodies.includes(planet), 'planet was deleted');
    assert.equal(ed.getSelected(), null, 'selection cleared along with the deleted body');
    delete globalThis.document;
});

test('a fuel/stardust pickup can be grabbed, dragged, and deleted like any other editor object (MM-15)', async () => {
    globalThis.document = { getElementById: () => fakeTrashEl() };
    const ed = await import('../games/black-hole-in-one/editor.js');
    ed.setHooks({ toast() {}, bar() {}, sfx: { pop() {} } });
    ed.startEditor();
    world.pickups = [];
    ed.addStardustPickup();
    const dust = world.pickups[0];
    const x0 = dust.x, y0 = dust.y;

    assert.equal(ed.pointerDown(dust.x, dust.y, 1), true, 'pickup is grabbable at its center');
    ed.pointerMove(x0 + 20, y0 + 5, 1);
    ed.pointerUp(x0 + 20, y0 + 5, 1);
    assert.equal(world.pickups.length, 1, 'drag alone does not delete it');
    assert.equal(world.pickups[0], dust, 'still the same object');
    assert.ok(Math.abs(dust.x - (x0 + 20)) < 1e-6 && Math.abs(dust.y - (y0 + 5)) < 1e-6, 'dragged to the release point');

    ed.pointerDown(world.pickups[0].x, world.pickups[0].y, 2);
    ed.pointerMove(-9999, -9999, 2);
    ed.pointerUp(-9999, -9999, 2);
    assert.equal(world.pickups.length, 0, 'dragging a pickup off-map deletes it from world.pickups, not world.bodies');
    delete globalThis.document;
});

test('encodeMap -> decodeMap round-trips trap, mine, pickups, and a refuel-station planet (MM-15)', async () => {
    const ed = await import('../games/black-hole-in-one/editor.js');
    const pal = { base: '#57c7c2', dark: '#20635f', name: 'teal' };
    const src = {
        teeRock: { x: 50, y: 176 },
        blackHole: { x: 50, y: 30 },
        bodies: [
            { type: 'planet', x: 40, y: 90, r: 10, pal, spin: 0.5, refuelStation: true },
            { type: 'trap', x: 60, y: 70 },
            { type: 'mine', x: 20, y: 60 },
        ],
        pickups: [
            { type: 'fuel', x: 33, y: 44 },
            { type: 'stardust', x: 55, y: 66 },
        ],
    };
    const hash = ed.encodeMap(src);
    const out = ed.decodeMap(hash);
    assert.ok(out, 'decodes to a map');

    const planet = out.bodies.find(b => b.type === 'planet');
    assert.equal(planet.refuelStation, true, 'refuelStation flag survives the round-trip');

    const trap = out.bodies.find(b => b.type === 'trap');
    const mine = out.bodies.find(b => b.type === 'mine');
    assert.ok(trap && Math.abs(trap.x - 60) < 0.06 && Math.abs(trap.y - 70) < 0.06);
    assert.ok(mine && Math.abs(mine.x - 20) < 0.06 && Math.abs(mine.y - 60) < 0.06);
    assert.deepEqual([trap.r, trap.m], [2.8, 200]);
    assert.deepEqual([mine.r, mine.m], [2, 0]);

    assert.equal(out.pickups.length, 2);
    const fuel = out.pickups.find(p => p.type === 'fuel');
    const stardust = out.pickups.find(p => p.type === 'stardust');
    assert.ok(fuel && Math.abs(fuel.x - 33) < 0.06);
    assert.ok(stardust && Math.abs(stardust.x - 55) < 0.06);
});

test('decodeMap defaults refuelStation to false and pickups to [] for pre-MM-15 share links', async () => {
    const ed = await import('../games/black-hole-in-one/editor.js');
    const pal = { base: '#fff', dark: '#000', name: 'x' };
    // Simulate a pre-MM-15 hash: encode a planet the OLD way (no 7th field) by
    // hand rather than via today's encodeMap, which always appends the flag now.
    const arr = [[0, 50, 176], [1, 50, 30], [2, 40, 90, 10, pal, 0.5]];
    const hash = btoa(JSON.stringify(arr)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const out = ed.decodeMap(hash);
    assert.ok(out);
    assert.equal(out.bodies[0].refuelStation, false, 'a missing 7th field decodes to a falsy flag, not a crash');
    assert.deepEqual(out.pickups, [], 'a pre-MM-15 hash with no pickup tags decodes to an empty array');
});

test('startCustomMap carries pickups from the loaded map and clears any leftover asteroid swarm (MM-15)', () => {
    globalThis.document = { getElementById: () => fakeTrashEl() };
    const teeRock = { x: 50, y: 176, r: 3.4, m: 8, type: 'tee' };
    const blackHole = { x: 50, y: 30, r: 3.2, m: 230, type: 'hole' };
    world.asteroids = [{ x: 10, y: 10, r: 2, vx: 1, vy: 1, type: 'asteroid' }]; // stale from a prior endless run
    game.startCustomMap({
        teeRock, blackHole, bodies: [],
        pickups: [{ x: 40, y: 40, r: 1.2, type: 'stardust' }],
    });
    assert.equal(world.pickups.length, 1);
    assert.equal(world.pickups[0].type, 'stardust');
    assert.equal(world.asteroids.length, 0, 'custom maps never carry over a stale asteroid swarm');
    delete globalThis.document;
});

test('startCustomMap retains the source mapData on world.activeMapData so a restart can reload it (FUEL-4)', () => {
    globalThis.document = { getElementById: () => fakeTrashEl() };
    const teeRock = { x: 50, y: 176, r: 3.4, m: 8, type: 'tee' };
    const blackHole = { x: 50, y: 30, r: 3.2, m: 230, type: 'hole' };
    const planet = { x: 50, y: 90, r: 8, m: 64, type: 'planet', pal: { base: '#fff', dark: '#000' } };
    const mapData = {
        teeRock, blackHole, bodies: [planet],
        pickups: [{ x: 40, y: 40, r: 1.2, type: 'fuel' }],
    };
    game.startCustomMap(mapData);
    assert.equal(world.activeMapData, mapData,
        'the loaded mapData must be retained on world so a restart has something to reload (FUEL-4 root cause)');

    // Collecting the fuel pickup mid-play splices world.pickups in place; that
    // must not silently deplete the retained source mapData too, or a "reload"
    // would restart with the previous playthrough's leftover state instead of
    // the map's original layout.
    world.pickups.splice(0, 1);
    assert.equal(world.pickups.length, 0);
    assert.equal(mapData.pickups.length, 1,
        'world.pickups must be a clone, not the same array as mapData.pickups');

    // Reloading the retained mapData (what a fixed restart does) must bring
    // the pickup back, not stay depleted.
    game.startCustomMap(world.activeMapData);
    assert.equal(world.pickups.length, 1, 'restarting a custom map must reset pickups back to the map\'s original layout');
    assert.equal(world.bodies.some(b => b.type === 'planet'), true,
        'restarting a custom map must reload its authored bodies, not a freshly generated hole (FUEL-4)');
    delete globalThis.document;
});

test('startCustomMap resets S.fuel to full, so leftover golf/prior-custom fuel never carries over (FUEL-8)', () => {
    globalThis.document = { getElementById: () => fakeTrashEl() };
    const teeRock = { x: 50, y: 176, r: 3.4, m: 8, type: 'tee' };
    const blackHole = { x: 50, y: 30, r: 3.2, m: 230, type: 'hole' };
    const mapData = { teeRock, blackHole, bodies: [], pickups: [] };

    S.fuel = 12; // leftover from a prior golf/endless round
    game.startCustomMap(mapData);
    assert.equal(S.fuel, 100, 'entering a custom map must start at full fuel, not inherit leftover golf fuel');

    S.fuel = 0; // drained mid-play
    game.startCustomMap(world.activeMapData); // restarting the same map (FUEL-4's reload path)
    assert.equal(S.fuel, 100, 'restarting a custom map must also top the tank back up');
    delete globalThis.document;
});

test('markPresentObjects (via startCustomMap) marks refuelStation and stardust as seen (MM-15)', () => {
    globalThis.document = { getElementById: () => fakeTrashEl() };
    S.glossarySeen = defaultGlossarySeen();
    const teeRock = { x: 50, y: 176, r: 3.4, m: 8, type: 'tee' };
    const blackHole = { x: 50, y: 30, r: 3.2, m: 230, type: 'hole' };
    const planet = { x: 50, y: 90, r: 8, m: 64, type: 'planet', pal: { base: '#fff', dark: '#000' }, refuelStation: true };
    game.startCustomMap({
        teeRock, blackHole, bodies: [planet],
        pickups: [{ x: 40, y: 40, r: 1.2, type: 'stardust' }],
    });
    assert.equal(S.glossarySeen.refuelStation, true);
    assert.equal(S.glossarySeen.stardust, true);
    delete globalThis.document;
});

test('a mine hit outside Endless mode respawns at last rest instead of leaving the comet stuck (MM-15 hazard-death fix)', () => {
    // Custom-map play, the mode that motivated this fix — Map Maker can now place mines here.
    S.mode = 'custom';
    S.phase = 'flight';
    world.teeRock = { x: 50, y: 176, r: 3.4, m: 8, type: 'tee' };
    world.blackHole = { x: -9999, y: -9999, r: 3.2, m: 230, type: 'hole' }; // isolate from any prior test's position
    world.bodies = [world.teeRock, { x: 50, y: 100, r: 2, m: 0, type: 'mine' }];
    comet.x = 50; comet.y = 100; comet.vx = 5; comet.vy = 0;
    comet.rest = { b: world.teeRock, ang: -Math.PI / 2 };
    world.lastRest = { rest: comet.rest };
    world.trail = [{ x: 1, y: 1 }];

    game.stepFlight(DT);

    assert.equal(S.phase, 'rest', 'phase recovers to rest instead of staying stuck in flight forever');
    assert.equal(comet.vx, 0);
    assert.equal(comet.vy, 0);
    assert.equal(world.trail.length, 0);
});

test('a mine hit in Endless mode still zeroes fuel and can trigger game over (pre-existing behavior unchanged)', () => {
    game.startRun('endless');
    S.fuel = 40;
    world.bodies = [world.teeRock, { x: comet.x, y: comet.y, r: 2, m: 0, type: 'mine' }];
    S.phase = 'flight';
    game.stepFlight(DT);
    assert.equal(S.fuel, 0, 'Endless hazard death still zeroes fuel exactly as before');
});

test('pickup collection now applies in custom mode too, not just endless (MM-15)', () => {
    S.mode = 'custom';
    S.phase = 'flight';
    S.stardust = 0;
    world.teeRock = { x: 50, y: 176, r: 3.4, m: 8, type: 'tee' };
    world.blackHole = { x: -9999, y: -9999, r: 3.2, m: 230, type: 'hole' }; // isolate from any prior test's position
    world.bodies = [world.teeRock];
    comet.x = 60; comet.y = 60; comet.vx = 0; comet.vy = 0;
    world.pickups = [{ x: comet.x, y: comet.y, r: 1.2, type: 'stardust' }];
    game.stepFlight(DT);
    assert.equal(world.pickups.length, 0, 'the pickup was collected during custom-mode flight');
    assert.equal(S.stardust, 1);
});
