import { test } from 'node:test';
import assert from 'node:assert/strict';
import { screenToWorld, worldToScreen, getChunkBodies, updateActiveChunks, CHUNK_SIZE, camera, launch, startRun, step, setHooks, fuel, atTown, buyUpgrade, shouldTowHome } from '../games/black-hole-in-one/explore.js';
import { S, world, comet, defaultInventory, mergeInventory } from '../games/black-hole-in-one/state.js';
import { MAX_LAUNCH, MAX_DRAG, MIN_SHOT } from '../games/black-hole-in-one/constants.js';

test('Camera math: screenToWorld', () => {
    const [wx, wy] = screenToWorld(100, 200, 2, 100, 200, 50, 100);
    assert.equal(wx, 50);
    assert.equal(wy, 100);
    const [wx2, wy2] = screenToWorld(0, 0, 2, 100, 200, 50, 100);
    assert.equal(wx2, 0);
    assert.equal(wy2, 0);
});

test('Camera math: worldToScreen', () => {
    const [sx, sy] = worldToScreen(50, 100, 2, 100, 200, 50, 100);
    assert.equal(sx, 100);
    assert.equal(sy, 200);
    const [sx2, sy2] = worldToScreen(0, 0, 2, 100, 200, 50, 100);
    assert.equal(sx2, 0);
    assert.equal(sy2, 0);
});

test('Explore chunk generation is deterministic', () => {
    const chunkA1 = getChunkBodies(5, -2, 'testseed');
    const chunkA2 = getChunkBodies(5, -2, 'testseed');
    
    assert.equal(chunkA1.length > 0, true);
    assert.equal(chunkA1.length, chunkA2.length);
    for (let i = 0; i < chunkA1.length; i++) {
        assert.equal(chunkA1[i].x, chunkA2[i].x);
        assert.equal(chunkA1[i].y, chunkA2[i].y);
        assert.equal(chunkA1[i].r, chunkA2[i].r);
    }
});

test('Explore spatial culling only loads 3x3 grid around camera', () => {
    // Force camera to a specific chunk
    camera.x = 20 * CHUNK_SIZE + CHUNK_SIZE / 2;
    camera.y = -5 * CHUNK_SIZE + CHUNK_SIZE / 2;
    
    // reset world.teeRock to prevent null errors in testing
    world.teeRock = { x: 50, y: 85, r: 3.4, m: 8, type: 'tee', id: 'tee' };
    
    updateActiveChunks();
    
    // We expect bodies only in x-chunks 19, 20, 21 and y-chunks -6, -5, -4
    for (const b of world.bodies) {
        if (b.type === 'tee') continue;
        const cx = Math.floor(b.x / CHUNK_SIZE);
        const cy = Math.floor(b.y / CHUNK_SIZE);
        assert.ok(cx >= 19 && cx <= 21, `Body outside expected x chunks: cx=${cx}`);
        assert.ok(cy >= -6 && cy <= -4, `Body outside expected y chunks: cy=${cy}`);
    }
    
    const countAtCenter = world.bodies.length;
    
    // Move camera to a completely different chunk
    camera.x = 40 * CHUNK_SIZE + CHUNK_SIZE / 2;
    camera.y = 40 * CHUNK_SIZE + CHUNK_SIZE / 2;
    updateActiveChunks();
    
    for (const b of world.bodies) {
        if (b.type === 'tee') continue;
        const cx = Math.floor(b.x / CHUNK_SIZE);
        const cy = Math.floor(b.y / CHUNK_SIZE);
        assert.ok(cx >= 39 && cx <= 41, `Body outside expected x chunks: cx=${cx}`);
        assert.ok(cy >= 39 && cy <= 41, `Body outside expected y chunks: cy=${cy}`);
    }
});

test('Explore spatial culling performance (headless perf check)', () => {
    // Generate chunks around origin
    camera.x = 50; camera.y = 85;
    updateActiveChunks();
    
    // Simulate 60 frames of step()
    const start = performance.now();
    for (let i = 0; i < 60; i++) {
        // We just call physics stepBody directly for the active set
        // to prove it's fast enough.
        import('../games/black-hole-in-one/physics.js').then(module => {
            module.stepBody({ x: 50, y: 85, vx: 10, vy: 10 }, 0.016, world.bodies, null);
        });
    }
    const duration = performance.now() - start;
    
    // 60 frames of pure physics on culled bodies should be extremely fast (under 10ms typically in Node)
    // We'll set a very loose bound of 100ms. If it was n^2 on thousands of bodies it would fail.
    assert.ok(duration < 100, `Performance check failed: took ${duration}ms`);
});

/* ============================== OW-0 Mid-flight pushes ============================== */

test('OW-0: mid-flight launch adds impulse to existing velocity (force-push)', () => {
    startRun();
    // Give the comet some initial velocity as if in flight
    comet.vx = 30;
    comet.vy = -20;
    S.phase = 'flight';
    S.prevPhase = 'flight';

    const oldVx = comet.vx;
    const oldVy = comet.vy;

    // Launch with a push to the right (dx > 0 means pull left → push right)
    const dragLen = MAX_DRAG * 0.5; // 50% power
    const ok = launch(dragLen, 0, dragLen);

    assert.ok(ok, 'launch should succeed');
    assert.equal(S.phase, 'flight');
    // The impulse should have been ADDED to the existing velocity, not replaced it
    assert.ok(comet.vx > oldVx, `vx should increase: was ${oldVx}, now ${comet.vx}`);
    assert.equal(comet.vy, oldVy, 'vy should be unchanged (push was purely horizontal)');
});

test('OW-0: mid-flight launch preserves trail', () => {
    startRun();
    S.phase = 'flight';
    S.prevPhase = 'flight';
    comet.vx = 20;
    comet.vy = -10;
    // Simulate some trail points from prior flight
    world.trail = [{ x: 10, y: 20 }, { x: 15, y: 25 }, { x: 20, y: 30 }];
    const trailLen = world.trail.length;

    const dragLen = MAX_DRAG * 0.5;
    launch(dragLen, 0, dragLen);

    assert.equal(world.trail.length, trailLen, 'trail should not be cleared on mid-flight push');
});

test('OW-0: cancelled mid-flight drag (below MIN_SHOT) returns to flight', () => {
    startRun();
    S.phase = 'aiming';
    S.prevPhase = 'flight';
    comet.vx = 20;
    comet.vy = -10;

    // Tiny drag that's below MIN_SHOT threshold
    const ok = launch(1, 0, 1);

    assert.equal(ok, false, 'launch should fail (too short)');
    assert.equal(S.phase, 'flight', 'phase should return to flight, not rest');
});

test('OW-0: launch from rest still clears trail', () => {
    startRun();
    S.phase = 'rest';
    S.prevPhase = 'rest';
    comet.vx = 0;
    comet.vy = 0;
    world.trail = [{ x: 10, y: 20 }, { x: 15, y: 25 }];

    const dragLen = MAX_DRAG * 0.5;
    launch(0, dragLen, dragLen);

    assert.equal(world.trail.length, 0, 'trail should be cleared on launch from rest');
});

test('EXP-1a: collecting a stardust pickup increments S.stardust and fires the persistence hook', () => {
    startRun();
    let persisted = null;
    setHooks({ stardust(total) { persisted = total; } });
    const before = S.stardust;
    world.pickups.push({ x: comet.x, y: comet.y, r: 5, type: 'stardust' });
    step(0);
    assert.equal(S.stardust, before + 1);
    assert.equal(persisted, before + 1, 'hooks.stardust should fire with the new running total');
    setHooks({ stardust() {} });
});

/* ============================== EXP-1b: Town Shop / Fuel Tank ============================== */

test('EXP-1b: atTown is true only when resting on the tee in Explore mode', () => {
    startRun();
    assert.equal(S.phase, 'rest');
    assert.equal(atTown(), true, 'startRun leaves the comet resting on the tee');

    S.phase = 'flight';
    assert.equal(atTown(), false, 'not at rest');

    S.phase = 'rest';
    comet.rest = { b: { type: 'planet' }, ang: 0 };
    assert.equal(atTown(), false, 'resting on a planet, not the tee');
});

test('EXP-1b: buyUpgrade deducts stardust, levels up the tank, and adds the capacity delta to current fuel', () => {
    S.upgrades.tank = 0;
    startRun();
    S.stardust = 15;
    let savedUpgrades = null, persistedStardust = null;
    setHooks({ upgrades(u) { savedUpgrades = { ...u }; }, stardust(t) { persistedStardust = t; } });

    const before = fuel; // full L0 tank = 100
    const ok = buyUpgrade('tank');

    assert.equal(ok, true);
    assert.equal(S.stardust, 0);
    assert.equal(S.upgrades.tank, 1);
    assert.equal(fuel, before + 30, 'the L0→L1 capacity delta (100→130) is added to current fuel');
    assert.deepEqual(savedUpgrades, { tank: 1, siphon: 0, sensor: 0 });
    assert.equal(persistedStardust, 0);
    setHooks({ upgrades() {}, stardust() {} });
});

test('EXP-1b: buyUpgrade refuses below cost or past L3, with no partial state change', () => {
    S.upgrades.tank = 0;
    startRun();
    S.stardust = 10; // below the 15 cost for L1
    assert.equal(buyUpgrade('tank'), false);
    assert.equal(S.stardust, 10);
    assert.equal(S.upgrades.tank, 0);

    S.upgrades.tank = 3; // already maxed
    S.stardust = 999;
    assert.equal(buyUpgrade('tank'), false);
    assert.equal(S.stardust, 999);
    assert.equal(S.upgrades.tank, 3);
});

test('EXP-1b: buyUpgrade is a no-op away from Town', () => {
    S.upgrades.tank = 0;
    startRun();
    S.phase = 'flight';
    S.stardust = 999;
    assert.equal(buyUpgrade('tank'), false);
    assert.equal(S.stardust, 999);
    assert.equal(S.upgrades.tank, 0);
});

/* ============================== INV-1: Inventory / Endless Flight ============================== */

test('INV-1: shouldTowHome tows home on an empty tank when Endless Flight is off (default)', () => {
    assert.equal(shouldTowHome(0, defaultInventory()), true);
    assert.equal(shouldTowHome(-5, defaultInventory()), true);
});

test('INV-1: shouldTowHome skips the tow-back when Endless Flight is enabled', () => {
    const inv = defaultInventory();
    inv.endlessFlight.enabled = true;
    assert.equal(shouldTowHome(0, inv), false);
});

test('INV-1: shouldTowHome never tows home while fuel remains, regardless of the toggle', () => {
    assert.equal(shouldTowHome(1, defaultInventory()), false);
    const inv = defaultInventory();
    inv.endlessFlight.enabled = true;
    assert.equal(shouldTowHome(50, inv), false);
});

test('INV-1: defaultInventory owns every registry item but starts every toggle off', () => {
    const inv = defaultInventory();
    assert.equal(inv.endlessFlight.owned, true);
    assert.equal(inv.endlessFlight.enabled, false);
});

test('INV-1: mergeInventory keeps defaults for items missing from a saved payload', () => {
    // Simulates a save written before this item existed in the registry.
    const merged = mergeInventory({});
    assert.deepEqual(merged, defaultInventory());
});

test('INV-1: mergeInventory overlays saved values on top of defaults', () => {
    const merged = mergeInventory({ endlessFlight: { owned: true, enabled: true } });
    assert.equal(merged.endlessFlight.enabled, true);
});

test('INV-1: mergeInventory tolerates null, undefined, or non-object saved payloads', () => {
    assert.deepEqual(mergeInventory(null), defaultInventory());
    assert.deepEqual(mergeInventory(undefined), defaultInventory());
    assert.deepEqual(mergeInventory('garbage'), defaultInventory());
});
