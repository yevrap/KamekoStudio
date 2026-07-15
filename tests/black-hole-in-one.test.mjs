// Unit tests for games/black-hole-in-one/ pure logic:
// constants helpers, physics (gravity, integration, collision response),
// hole generation invariants, and round/scorecard flow (gameplay.js headless).
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
    WORLD_W, COURSE_H, CAPTURE_R, COMET_R, REST_V, SOFT_CATCH, MAX_V, DT,
    ROUND_HOLES, fmtDiff, holeLabel, isBetterRound, dist,
} from '../games/black-hole-in-one/constants.js';
import { gravityAt, stepBody, collide } from '../games/black-hole-in-one/physics.js';
import { S, world, comet } from '../games/black-hole-in-one/state.js';
import * as game from '../games/black-hole-in-one/gameplay.js';

/* ============================== constants helpers ============================== */

test('fmtDiff formats even, over and under par', () => {
    assert.equal(fmtDiff(0), 'E');
    assert.equal(fmtDiff(3), '+3');
    assert.equal(fmtDiff(-2), '−2');
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

test('a 9-hole round ends with a scorecard callback instead of hole 10', () => {
    let roundResult = null;
    game.setHooks({ roundEnd(r) { roundResult = r; } });
    game.startRun('round');
    for (let h = 1; h <= ROUND_HOLES; h++) {
        S.strokes = S.par;              // par every hole
        game.holeComplete();
        if (h < ROUND_HOLES) game.nextHole();
        else game.endRound();
    }
    assert.equal(S.phase, 'roundover');
    assert.equal(roundResult.total, 0);
    assert.equal(roundResult.card.length, ROUND_HOLES);
    assert.ok(roundResult.card.every((c, i) => c.hole === i + 1));
    game.setHooks({ roundEnd() {} });
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
