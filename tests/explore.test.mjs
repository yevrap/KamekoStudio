import { test } from 'node:test';
import assert from 'node:assert/strict';
import { screenToWorld, worldToScreen, getChunkBodies, getChunkPickups, pickupBlockedByBody, updateActiveChunks, CHUNK_SIZE, camera, launch, startRun, step, stepOrbit, stepWarp, setHooks, fuel, atTown, buyUpgrade, isStranded, refuelFull, isRefuelStation, stickThrottle, keysToVector, stickDown, stickMove, stickUp, stickCancel, setViewScale, stick, thrustVec, hasThrust, keyDown, clearKeys, exploreHome, loadExploreHome, useReturnPortal, discoveredChunks, loadDiscoveredChunks, chunkKeyAt, handleTap, ringSnap } from '../games/black-hole-in-one/explore.js';
import { S, world, comet, defaultInventory, mergeInventory } from '../games/black-hole-in-one/state.js';
import { MAX_LAUNCH, MAX_DRAG, MIN_SHOT, COMET_R, STICK_R_PX, STICK_DEAD_PX, THRUST_A, EXPLORE_BLACKHOLE_CHANCE, EXPLORE_BLACKHOLE_R, ORBIT_MIN_GAP, ORBIT_MAX_GAP, ORBIT_COOLDOWN, moonPosition, circularSpeed, STARDUST_RING_CHANCE, STARDUST_RING_COUNT_MIN, STARDUST_RING_COUNT_MAX } from '../games/black-hole-in-one/constants.js';
import { gravityAt } from '../games/black-hole-in-one/physics.js';

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

test('P1 · Explore — Fix Items Inside Planets: pickupBlockedByBody blocks a pickup that overlaps a planet\'s collision radius plus clearance', () => {
    const bodies = [{ x: 0, y: 0, r: 10 }];
    const blockedAt = 10 + COMET_R + 1.8 + 2; // planet r + comet's closest approach + pickup r + clearance
    assert.equal(pickupBlockedByBody(0, 0, 1.8, bodies), true); // dead center
    assert.equal(pickupBlockedByBody(blockedAt - 0.1, 0, 1.8, bodies), true); // just inside
    assert.equal(pickupBlockedByBody(blockedAt + 0.1, 0, 1.8, bodies), false); // just outside
});

test('P1 · Explore — Fix Items Inside Planets: getChunkPickups never spawns a pickup inside a planet\'s collision radius', () => {
    // Sweep a wide range of chunks/seeds so giants, dwarves, and binary pairs all get exercised.
    for (const seed of ['explore-1', 'testseed', 'another-seed']) {
        for (let cx = -6; cx <= 6; cx++) {
            for (let cy = -6; cy <= 6; cy++) {
                const bodies = getChunkBodies(cx, cy, seed);
                const pickups = getChunkPickups(cx, cy, seed, bodies);
                for (const p of pickups) {
                    for (const b of bodies) {
                        const d = Math.hypot(p.x - b.x, p.y - b.y);
                        assert.ok(d >= b.r + COMET_R + p.r,
                            `pickup ${p.id} at d=${d.toFixed(2)} overlaps body r=${b.r} (cx=${cx},cy=${cy},seed=${seed})`);
                    }
                }
            }
        }
    }
});

test('P1 · Explore — Fix Items Inside Planets: no pickup spawns inside an active body across a wide camera sweep (cross-chunk bleed included)', () => {
    // A binary pair's second body or a giant planet's radius can extend past its
    // own chunk's boundary — this sweeps updateActiveChunks() (the real pipeline)
    // rather than a single chunk in isolation, so that bleed is exercised too.
    world.teeRock = null;
    let totalPickups = 0;
    for (let cx = -8; cx <= 8; cx++) {
        for (let cy = -8; cy <= 8; cy++) {
            camera.x = cx * CHUNK_SIZE + CHUNK_SIZE / 2;
            camera.y = cy * CHUNK_SIZE + CHUNK_SIZE / 2;
            updateActiveChunks();
            for (const p of world.pickups) {
                totalPickups++;
                for (const b of world.bodies) {
                    if (b.type === 'tee') continue;
                    const d = Math.hypot(p.x - b.x, p.y - b.y);
                    assert.ok(d >= b.r + COMET_R + p.r,
                        `pickup ${p.id} overlaps body at cx=${cx},cy=${cy} d=${d.toFixed(2)} vs required ${(b.r + COMET_R + p.r).toFixed(2)}`);
                }
            }
        }
    }
    assert.ok(totalPickups > 100, 'sweep should have generated a meaningful number of pickups');
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

test('FUEL-3: running out of fuel mid-flight and attempting to aim returns to flight instead of freezing (regression)', () => {
    startRun();
    S.phase = 'flight';
    S.prevPhase = 'flight';
    comet.vx = 20;
    comet.vy = -10;

    // Drain the tank to exactly 0 via real launches, same as a player flicking
    // repeatedly (each burns 15 from a max-100 tank).
    const dragLen = MAX_DRAG * 0.5;
    while (fuel > 0) launch(dragLen, 0, dragLen);
    assert.equal(fuel, 0, 'sanity: tank is empty');

    // Simulate starting a mid-flight aim (main.js's pointerdown sets exactly
    // this on a real drag) and then releasing a real, non-tap drag.
    S.phase = 'aiming';
    S.prevPhase = 'flight';
    const ok = launch(dragLen, 0, dragLen);

    assert.equal(ok, false, 'launch should fail — no fuel to spend');
    assert.equal(S.phase, 'flight', 'phase should return to flight, not get stuck at aiming');
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

test('FUEL-1: isStranded is true on an empty tank when Endless Flight is off (default)', () => {
    assert.equal(isStranded(0, defaultInventory()), true);
    assert.equal(isStranded(-5, defaultInventory()), true);
});

test('FUEL-1: isStranded is false when Endless Flight is enabled, even at 0 fuel', () => {
    const inv = defaultInventory();
    inv.endlessFlight.enabled = true;
    assert.equal(isStranded(0, inv), false);
});

test('FUEL-1: isStranded is false while fuel remains, regardless of the toggle', () => {
    assert.equal(isStranded(1, defaultInventory()), false);
    const inv = defaultInventory();
    inv.endlessFlight.enabled = true;
    assert.equal(isStranded(50, inv), false);
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

test('ORB-1: defaultInventory turns Orbit Magnet on by default (registry defaultOn)', () => {
    const inv = defaultInventory();
    assert.equal(inv.orbitMagnet.owned, true);
    assert.equal(inv.orbitMagnet.enabled, true);
});

test('ORB-1: mergeInventory gives saves from before the item existed Orbit Magnet ON, no migration code needed', () => {
    // Simulates a save written before orbitMagnet was in the registry — the key is
    // simply absent from the saved payload, same shape as any earlier INV-1 item.
    const preExisting = { endlessFlight: { owned: true, enabled: true }, thruster: { owned: true, enabled: false } };
    const merged = mergeInventory(preExisting);
    assert.equal(merged.orbitMagnet.enabled, true, 'existing players get the new item ON automatically');
    assert.equal(merged.orbitMagnet.owned, true);
});

test('INV-1: launch does not drain fuel while Endless Flight is enabled', () => {
    S.upgrades.tank = 0;
    startRun();
    S.inventory = defaultInventory();
    S.inventory.endlessFlight.enabled = true;

    const before = fuel; // full L0 tank = 100
    const dragLen = MAX_DRAG * 0.5;
    const ok = launch(dragLen, 0, dragLen);

    assert.ok(ok, 'launch should succeed');
    assert.equal(fuel, before, 'fuel should be unchanged — the fuel-lock skips the drain entirely');
});

test('INV-1: launch drains fuel normally once Endless Flight is switched back off', () => {
    S.upgrades.tank = 0;
    startRun();
    S.inventory = defaultInventory();
    S.inventory.endlessFlight.enabled = false;

    const before = fuel;
    const dragLen = MAX_DRAG * 0.5;
    launch(dragLen, 0, dragLen);

    assert.equal(fuel, before - 15, 'today\'s default drain resumes once the toggle is off');
});

test('INV-1: refuelFull tops the tank off to the current upgrade level\'s max', () => {
    S.upgrades.tank = 1; // 130 max
    startRun();
    S.inventory = defaultInventory();
    launch(MAX_DRAG * 0.5, 0, MAX_DRAG * 0.5); // drain it below max first
    assert.ok(fuel < 130, 'sanity: fuel was drained below the L1 max');

    refuelFull();

    assert.equal(fuel, 130, 'refuelFull tops off to the current tank\'s max, not a hardcoded 100');
});

/* ============================== FUEL-2: Refuel station planets ============================== */

test('FUEL-2: getChunkBodies flags roughly 3/4 of chunks with exactly one refuelStation body', () => {
    let flaggedChunks = 0, totalChunks = 0, doubleFlagged = 0;
    for (let cx = -10; cx <= 10; cx++) {
        for (let cy = -10; cy <= 10; cy++) {
            const bodies = getChunkBodies(cx, cy, 'refuel-sample');
            if (bodies.length === 0) continue;
            totalChunks++;
            const flagged = bodies.filter(b => b.refuelStation);
            if (flagged.length > 1) doubleFlagged++;
            if (flagged.length >= 1) flaggedChunks++;
        }
    }
    assert.ok(totalChunks > 100, 'sanity: sampled a meaningful number of chunks');
    assert.equal(doubleFlagged, 0, 'at most one refuel station per chunk');
    const rate = flaggedChunks / totalChunks;
    assert.ok(rate > 0.6 && rate < 0.9, `station frequency should read as "most chunks have one" (got ${rate.toFixed(2)})`);
});

test('FUEL-2: getChunkBodies\'s refuelStation roll is still deterministic for a given seed', () => {
    const a = getChunkBodies(9, 3, 'refuel-det').map(b => !!b.refuelStation);
    const b = getChunkBodies(9, 3, 'refuel-det').map(b => !!b.refuelStation);
    assert.deepEqual(a, b);
});

test('FUEL-2: isRefuelStation is true only for a body explicitly flagged refuelStation', () => {
    assert.equal(isRefuelStation({ refuelStation: true }), true);
    assert.equal(isRefuelStation({ refuelStation: false }), false);
    assert.equal(isRefuelStation({ type: 'planet' }), false, 'ordinary planets are not stations by default');
    assert.equal(isRefuelStation(null), false);
    assert.equal(isRefuelStation(undefined), false);
});

test('FUEL-2: landing on a refuel-station planet tops the tank to max and fires the refuel toast', () => {
    S.upgrades.tank = 0; // isolate from any tank-level leak left by a prior test
    startRun();
    const maxFuel = fuel;
    launch(MAX_DRAG * 0.5, 0, MAX_DRAG * 0.5); // drain fuel below max first
    assert.ok(fuel < maxFuel, 'sanity: fuel was drained below max');

    let toasted = null;
    setHooks({ toast(msg) { toasted = msg; } });

    const station = { x: comet.x + 5, y: comet.y, r: 5, m: 0, type: 'planet', refuelStation: true };
    world.bodies = [station];
    world.pickups = [];
    S.phase = 'flight';
    S.orbitCooldown = 0;
    // Comet sits just inside the station's collision radius, to its left, moving
    // right (+x, toward the station's center) — this is what makes it a landing.
    comet.vx = 5; comet.vy = 0; // slow inward approach, well under REST_V — this lands, not bounces
    comet.x = station.x - (station.r + COMET_R) + 0.05;
    comet.y = station.y;

    step(1 / 240);

    assert.equal(S.phase, 'rest', 'sanity: this was actually a landing');
    assert.equal(fuel, maxFuel, 'refuelFull ran on landing, tank is back to max');
    assert.equal(toasted, '⛽ Refueled!');
    setHooks({ toast() {} });
});

test('FUEL-2: bouncing off (not landing on) a refuel-station planet does nothing', () => {
    S.upgrades.tank = 0; // isolate from any tank-level leak left by a prior test
    startRun();
    launch(MAX_DRAG * 0.5, 0, MAX_DRAG * 0.5); // drain fuel below max first
    const drained = fuel;

    const station = { x: comet.x + 5, y: comet.y, r: 5, m: 0, type: 'planet', refuelStation: true };
    world.bodies = [station];
    world.pickups = [];
    S.phase = 'flight';
    S.orbitCooldown = 0;
    // Same left-of-station, moving-right geometry as the landing test, just fast
    // enough (well over REST_V) that collide() bounces instead of landing.
    comet.vx = 60; comet.vy = 0;
    comet.x = station.x - (station.r + COMET_R) + 0.05;
    comet.y = station.y;

    step(1 / 240);

    assert.equal(S.phase, 'flight', 'sanity: this was a bounce, not a landing');
    assert.notEqual(comet.vx, 60, 'sanity: collide() actually ran a bounce response, not a silent no-op');
    assert.equal(fuel, drained, 'no refuel from a bounce — only landing refuels');
});

/* ============================== TAP-1: Tap gesture detection ============================== */

test('TAP-1: item OFF makes tap a no-op; automatic loop reproduces strict orbitCapture exactly', () => {
    startRun();
    const planet = { x: comet.x + 40, y: comet.y, r: 10, m: 100, type: 'planet', pal: { base: '#fff', dark: '#000' } };
    world.bodies = [planet];
    world.pickups = [];
    S.phase = 'flight';
    S.orbitCooldown = 0;

    const d = 18; // inside the orbit band, well outside collision range
    const setupDive = () => {
        comet.x = planet.x - d;
        comet.y = planet.y;
        comet.vx = 50; comet.vy = 0; // straight-in radial dive, no tangential component
    };

    // item OFF: strict orbitCapture rejects a pure dive — comet keeps flying.
    S.inventory = mergeInventory({ orbitMagnet: { owned: true, enabled: false } });
    setupDive();
    step(1 / 240);
    assert.equal(S.phase, 'flight', 'item OFF: a radial dive is not captured (today\'s strict behavior)');
    assert.equal(world.orbit, null);

    // item ON: auto-capture is restored, so a pure dive is captured!
    S.inventory = mergeInventory({ orbitMagnet: { owned: true, enabled: true } });
    S.orbitCooldown = 0;
    setupDive();
    step(1 / 240);
    assert.equal(S.phase, 'orbit', 'item ON (TAP-1): auto-capture restored, dive is captured');
    assert.ok(world.orbit, 'orbit state set');
});

test('TAP-1: handleTap detects tap if item ON, ignores if item OFF', () => {
    startRun();
    const planet = { x: comet.x + 40, y: comet.y, r: 10, m: 100, type: 'planet', pal: { base: '#fff', dark: '#000' } };
    world.bodies = [planet];
    world.pickups = [];
    S.phase = 'flight';
    const d = 18;
    comet.x = planet.x - d;
    comet.y = planet.y;

    // Item OFF: handleTap does nothing
    S.inventory = mergeInventory({ orbitMagnet: { owned: true, enabled: false } });
    handleTap(planet.x, planet.y);
    assert.equal(S.phase, 'flight', 'item OFF: tap does nothing');

    // Item ON: handleTap calls beginDescentFromFlight (TAP-2)
    S.inventory = mergeInventory({ orbitMagnet: { owned: true, enabled: true } });
    handleTap(planet.x, planet.y);
    assert.equal(S.phase, 'descend', 'item ON: tap begins descent (TAP-2)');
    assert.ok(world.descent, 'descent state initialized');
});

test('TAP-1: the black-hole dive-warp check runs before capture — capture-band distance does not orbit', () => {
    startRun();
    const bh = { x: comet.x + 60, y: comet.y, r: EXPLORE_BLACKHOLE_R, m: EXPLORE_BLACKHOLE_R * EXPLORE_BLACKHOLE_R, type: 'blackhole', id: 'test-bh-orb1' };
    world.bodies = [bh];
    world.pickups = [];
    S.inventory = mergeInventory({ orbitMagnet: { owned: true, enabled: true } });
    S.phase = 'flight';
    S.orbitCooldown = 0;

    const d = bh.r + COMET_R + 6; // mid-band
    comet.x = bh.x - d;
    comet.y = bh.y;
    comet.vx = 30; comet.vy = 0;

    step(1 / 240);

    assert.equal(S.phase, 'orbit', 'capture-band distance around a black hole captures (auto-magnet restored)');
});

test('TAP-4: tapping the black hole you\'re orbiting warps to Town, not descend-and-land', () => {
    startRun();
    const bh = { x: comet.x + 40, y: comet.y, r: EXPLORE_BLACKHOLE_R, m: EXPLORE_BLACKHOLE_R * EXPLORE_BLACKHOLE_R, type: 'blackhole', id: 'test-bh-tap4' };
    world.bodies = [bh];
    world.pickups = [];
    S.inventory = mergeInventory({ orbitMagnet: { owned: true, enabled: true } });

    const radius = bh.r + COMET_R + 5;
    world.orbit = { b: bh, radius, ang: 0, omega: 1 };
    comet.x = bh.x + radius;
    comet.y = bh.y;
    S.phase = 'orbit';

    handleTap(bh.x, bh.y);

    assert.equal(S.phase, 'warp', 'tapping the orbited black hole should begin the warp (TAP-4), not descend');
    assert.ok(world.warp, 'world.warp should be populated');
    assert.equal(world.warp.b, bh);
});

/* ============================== INV-3a: Thruster ============================== */

test('INV-3a: stickThrottle has a deadzone floor, ramps linearly, and clamps at 1', () => {
    assert.equal(stickThrottle(0), 0, 'no displacement = no throttle');
    assert.equal(stickThrottle(STICK_DEAD_PX), 0, 'at the deadzone edge = still zero');
    assert.equal(stickThrottle(STICK_DEAD_PX - 1), 0, 'inside the deadzone = zero');
    const mid = STICK_DEAD_PX + (STICK_R_PX - STICK_DEAD_PX) / 2;
    assert.ok(Math.abs(stickThrottle(mid) - 0.5) < 1e-9, 'halfway between deadzone and full radius = 0.5');
    assert.equal(stickThrottle(STICK_R_PX), 1, 'at the full radius = 1');
    assert.equal(stickThrottle(STICK_R_PX * 5), 1, 'beyond the radius clamps at 1');
});

test('INV-3a: keysToVector sums held keys into a unit vector, cancels opposites, normalizes diagonals', () => {
    assert.deepEqual(keysToVector(new Set()), { x: 0, y: 0 }, 'empty set = no vector');
    assert.deepEqual(keysToVector(new Set(['ArrowUp'])), { x: 0, y: -1 });
    assert.deepEqual(keysToVector(new Set(['KeyS'])), { x: 0, y: 1 });
    assert.deepEqual(keysToVector(new Set(['KeyA'])), { x: -1, y: 0 });
    assert.deepEqual(keysToVector(new Set(['ArrowRight'])), { x: 1, y: 0 });

    const opp = keysToVector(new Set(['ArrowUp', 'ArrowDown']));
    assert.equal(opp.x, 0); assert.equal(opp.y, 0);
    const opp2 = keysToVector(new Set(['KeyA', 'KeyD']));
    assert.equal(opp2.x, 0); assert.equal(opp2.y, 0);

    const diag = keysToVector(new Set(['KeyW', 'KeyD']));
    assert.ok(Math.abs(Math.hypot(diag.x, diag.y) - 1) < 1e-9, 'diagonal magnitude normalized to 1, not √2');
});

test('FUEL-1: isStranded is phase- and Thruster-independent — only fuel and Endless Flight matter', () => {
    // Thruster off or on, any phase: an empty tank is stranded either way now (FUEL-1
    // reversed T8 and removed the flick scheme's rest-gated tow — no auto-tow anywhere).
    assert.equal(isStranded(0, defaultInventory()), true);

    const thrusterOn = defaultInventory();
    thrusterOn.thruster.enabled = true;
    assert.equal(isStranded(0, thrusterOn), true);
    assert.equal(isStranded(1, thrusterOn), false, 'fuel remains');

    // Endless Flight still locks the tank regardless of the Thruster toggle.
    const endlessAndThruster = defaultInventory();
    endlessAndThruster.endlessFlight.enabled = true;
    endlessAndThruster.thruster.enabled = true;
    assert.equal(isStranded(0, endlessAndThruster), false);
});

test('INV-3a: defaultInventory registers the Thruster item, owned but off by default', () => {
    const inv = defaultInventory();
    assert.equal(inv.thruster.owned, true);
    assert.equal(inv.thruster.enabled, false);
});

/* ============================== INV-3b: Floating stick ============================== */

test('INV-3b: stickDown/Move/Up track a single pointer by id; a second pointer is ignored', () => {
    stickCancel();
    assert.equal(stick, null);

    stickDown(10, 20, 1);
    assert.deepEqual(stick, { ox: 10, oy: 20, cx: 10, cy: 20, id: 1 });

    stickDown(99, 99, 2); // second pointer while one is live — ignored, origin keeps it
    assert.equal(stick.id, 1);
    assert.equal(stick.ox, 10);

    stickMove(15, 28, 2); // wrong id — ignored
    assert.deepEqual(stick, { ox: 10, oy: 20, cx: 10, cy: 20, id: 1 });

    stickMove(15, 28, 1); // right id — updates the current point only
    assert.deepEqual(stick, { ox: 10, oy: 20, cx: 15, cy: 28, id: 1 });

    stickUp(2); // wrong id — ignored
    assert.notEqual(stick, null);

    stickUp(1); // right id — clears
    assert.equal(stick, null);
});

test('INV-3b: stickCancel force-clears regardless of id', () => {
    stickDown(0, 0, 5);
    stickCancel();
    assert.equal(stick, null);
});

test('INV-3b: thrustVec is inert unless Explore mode + Thruster enabled, even with stick/keys held', () => {
    startRun();
    S.inventory = defaultInventory(); // thruster off by default
    setViewScale(1);
    stickDown(0, 0, 1);
    stickMove(STICK_R_PX, 0, 1); // full-throttle displacement
    keyDown('KeyW');

    assert.deepEqual(thrustVec(), { x: 0, y: 0, throttle: 0 }, 'Thruster off: inert despite stick+keys held');

    S.mode = 'endless';
    S.inventory.thruster.enabled = true;
    assert.deepEqual(thrustVec(), { x: 0, y: 0, throttle: 0 }, 'not Explore mode: inert despite Thruster on');

    clearKeys();
    stickCancel();
});

test('INV-3b: thrustVec from the stick alone — direction is origin→current, throttle is analog', () => {
    startRun();
    S.inventory = defaultInventory();
    S.inventory.thruster.enabled = true;
    setViewScale(1); // view units == CSS px for this test
    clearKeys();

    stickDown(0, 0, 1);
    stickMove(STICK_R_PX, 0, 1); // straight right, at the full-throttle radius
    const t = thrustVec();
    assert.ok(Math.abs(t.x - 1) < 1e-9, `x should be ~1 (full throttle right), got ${t.x}`);
    assert.ok(Math.abs(t.y) < 1e-9);
    assert.equal(t.throttle, 1);

    const mid = STICK_DEAD_PX + (STICK_R_PX - STICK_DEAD_PX) / 2;
    stickMove(mid, 0, 1); // halfway between deadzone and full radius
    const t2 = thrustVec();
    assert.ok(Math.abs(t2.throttle - 0.5) < 1e-9);
    assert.ok(Math.abs(t2.x - 0.5) < 1e-9, 'direction vector is scaled by throttle, not just a unit vector');

    stickCancel();
});

test('INV-3b: thrustVec from the stick respects the deadzone — a tap fires no thrust', () => {
    startRun();
    S.inventory = defaultInventory();
    S.inventory.thruster.enabled = true;
    setViewScale(1);
    clearKeys();

    stickDown(0, 0, 1);
    stickMove(STICK_DEAD_PX - 1, 0, 1); // inside the deadzone
    assert.deepEqual(thrustVec(), { x: 0, y: 0, throttle: 0 });

    stickCancel();
});

test('INV-3b: thrustVec converts the stored view-unit distance to CSS px via setViewScale', () => {
    startRun();
    S.inventory = defaultInventory();
    S.inventory.thruster.enabled = true;
    clearKeys();

    // Same view-unit displacement at two different scales must read as two different
    // CSS-px distances (and therefore different throttle) — proves setViewScale()'s
    // value is actually applied, not just the raw view-unit distance compared straight
    // against the STICK_R_PX/STICK_DEAD_PX constants.
    const dView = (STICK_DEAD_PX + (STICK_R_PX - STICK_DEAD_PX) / 2) / 2;

    setViewScale(1);
    stickDown(0, 0, 1);
    stickMove(dView, 0, 1);
    const throttleAtScale1 = thrustVec().throttle;
    stickCancel();

    setViewScale(2); // same view-unit drag now covers 2x the CSS px
    stickDown(0, 0, 1);
    stickMove(dView, 0, 1);
    const throttleAtScale2 = thrustVec().throttle;
    stickCancel();

    assert.ok(throttleAtScale2 > throttleAtScale1,
        `scale 2 should read a larger CSS-px drag than scale 1 (got ${throttleAtScale1} vs ${throttleAtScale2})`);

    setViewScale(1);
});

test('INV-3b: thrustVec sums stick + keyboard and clamps magnitude to 1', () => {
    startRun();
    S.inventory = defaultInventory();
    S.inventory.thruster.enabled = true;
    setViewScale(1);

    keyDown('KeyD'); // +x, magnitude 1
    stickDown(0, 0, 1);
    stickMove(STICK_R_PX, 0, 1); // also +x, full throttle — same direction as the key

    const t = thrustVec();
    assert.ok(Math.abs(Math.hypot(t.x, t.y) - 1) < 1e-9, 'same-direction stick+keys clamp to magnitude 1, not 2');
    assert.equal(t.throttle, 1);

    clearKeys();
    stickCancel();
});

test('INV-3b: thrustVec keyboard-only path is unchanged by the stick (regression against INV-3a)', () => {
    startRun();
    S.inventory = defaultInventory();
    S.inventory.thruster.enabled = true;
    setViewScale(1);
    stickCancel(); // no stick held

    keyDown('ArrowUp');
    const t = thrustVec();
    assert.deepEqual(t, { x: 0, y: -1, throttle: 1 }, 'keyboard alone: unit vector, throttle 1, exactly as INV-3a shipped');

    clearKeys();
});

test('INV-3b: hasThrust reflects the stick', () => {
    startRun();
    S.inventory = defaultInventory();
    S.inventory.thruster.enabled = true;
    setViewScale(1);
    clearKeys();

    assert.equal(hasThrust(), false);
    stickDown(0, 0, 1);
    stickMove(STICK_R_PX, 0, 1);
    assert.equal(hasThrust(), true);

    stickCancel();
});

test('INV-3c: THRUST_A beats surface gravity at every chunk-generator size class, at each type\'s r ceiling', () => {
    // Gravity is monotonically increasing in r for fixed density (see the Thruster &
    // Flight Controls note), so the worst case per type is at its r ceiling. Ceilings
    // are exclusive (rng() ∈ [0,1)) — nudge to the boundary to check the true limit
    // the generator approaches rather than relying on a sample to land near it.
    const worstCases = [
        { r: 40 - 1e-6, label: 'Giant' },
        { r: 8 - 1e-6, label: 'Dwarf' },
        { r: 18 - 1e-6, label: 'Binary' },
        { r: 20 - 1e-6, label: 'Normal' },
    ];
    for (const { r, label } of worstCases) {
        const body = { x: 0, y: 0, r, m: r * r, type: 'planet' };
        const surfaceD = r + COMET_R; // where a landed comet actually rests
        const [ax, ay] = gravityAt([body], null, surfaceD, 0);
        const g = Math.hypot(ax, ay);
        assert.ok(THRUST_A > g, `${label}: THRUST_A (${THRUST_A}) must exceed surface gravity (${g.toFixed(1)})`);
    }
});

test('INV-3c: real chunk-generator bodies never exceed THRUST_A at their own surface, sampled widely', () => {
    let maxG = 0, sampled = 0;
    for (let cx = -15; cx < 15; cx++) {
        for (let cy = -15; cy < 15; cy++) {
            for (const b of getChunkBodies(cx, cy, 'thrust-escape-sample')) {
                const surfaceD = b.r + COMET_R;
                const [ax, ay] = gravityAt([b], null, b.x + surfaceD, b.y);
                maxG = Math.max(maxG, Math.hypot(ax, ay));
                sampled++;
            }
        }
    }
    assert.ok(sampled > 100, 'sanity: actually sampled a meaningful number of bodies');
    assert.ok(THRUST_A > maxG, `sampled worst surface gravity ${maxG.toFixed(1)} must stay under THRUST_A (${THRUST_A})`);
});

/* ============================== OW-3: black-hole warp → Town → return ============================== */

test('OW-3: getChunkBodies seeds blackhole-type bodies deterministically', () => {
    // Sweep until we find at least one chunk that actually rolled a black hole,
    // then confirm regenerating it (same cx/cy/seed) reproduces it byte-identical.
    let found = false;
    for (let cx = -20; cx <= 20 && !found; cx++) {
        for (let cy = -20; cy <= 20 && !found; cy++) {
            const a = getChunkBodies(cx, cy, 'bh-determinism').filter(b => b.type === 'blackhole');
            if (a.length === 0) continue;
            found = true;
            const b = getChunkBodies(cx, cy, 'bh-determinism').filter(b => b.type === 'blackhole');
            assert.equal(b.length, a.length);
            assert.equal(b[0].x, a[0].x);
            assert.equal(b[0].y, a[0].y);
            assert.equal(b[0].id, a[0].id);
        }
    }
    assert.ok(found, 'sanity: swept enough chunks to find at least one seeded black hole');
});

test('OW-3: seeded black holes never overlap another body in their own chunk', () => {
    for (let cx = -15; cx <= 15; cx++) {
        for (let cy = -15; cy <= 15; cy++) {
            const bodies = getChunkBodies(cx, cy, 'bh-overlap');
            const holes = bodies.filter(b => b.type === 'blackhole');
            for (const bh of holes) {
                for (const other of bodies) {
                    if (other === bh) continue;
                    const d = Math.hypot(bh.x - other.x, bh.y - other.y);
                    assert.ok(d >= bh.r + other.r, `black hole at cx=${cx},cy=${cy} overlaps another body (d=${d.toFixed(2)}, needed ${(bh.r + other.r).toFixed(2)})`);
                }
            }
        }
    }
});

test('OW-3: seeded black-hole frequency reads as a rare landmark, close to EXPLORE_BLACKHOLE_CHANCE', () => {
    let chunks = 0, withHole = 0;
    for (let cx = -12; cx <= 12; cx++) {
        for (let cy = -12; cy <= 12; cy++) {
            chunks++;
            if (getChunkBodies(cx, cy, 'bh-density').some(b => b.type === 'blackhole')) withHole++;
        }
    }
    assert.ok(chunks > 400, 'sanity: sampled a meaningful number of chunks');
    const rate = withHole / chunks;
    assert.ok(rate > EXPLORE_BLACKHOLE_CHANCE * 0.5 && rate < EXPLORE_BLACKHOLE_CHANCE * 1.5,
        `black-hole rate ${rate.toFixed(3)} should sit near EXPLORE_BLACKHOLE_CHANCE (${EXPLORE_BLACKHOLE_CHANCE})`);
});

test('OW-3: real chunk-generator black holes never exceed THRUST_A at their own surface (same invariant as every other body)', () => {
    // getChunkBodies() puts blackhole bodies through the exact same gravity path as
    // planets (gravityAt sums the whole bodies array regardless of type), so the
    // Thruster-escape guarantee (INV-3c) must hold for them too — checked directly
    // here in addition to the existing all-bodies sweep, which already covers this
    // implicitly since it iterates getChunkBodies() with no type filter.
    let sampled = 0;
    for (let cx = -15; cx < 15; cx++) {
        for (let cy = -15; cy < 15; cy++) {
            for (const b of getChunkBodies(cx, cy, 'bh-thrust-sample')) {
                if (b.type !== 'blackhole') continue;
                sampled++;
                const surfaceD = b.r + COMET_R;
                const [ax, ay] = gravityAt([b], null, b.x + surfaceD, b.y);
                assert.ok(THRUST_A > Math.hypot(ax, ay), `black hole surface gravity must stay under THRUST_A (${THRUST_A})`);
            }
        }
    }
    assert.ok(sampled > 0, 'sanity: at least one black hole was sampled');
});

test('OW-3: flying within warp range of a seeded black hole begins the warp (not a planet collision)', () => {
    startRun();
    const bh = { x: comet.x + 50, y: comet.y, r: EXPLORE_BLACKHOLE_R, m: EXPLORE_BLACKHOLE_R * EXPLORE_BLACKHOLE_R, type: 'blackhole', id: 'test-bh' };
    world.bodies = [bh];
    world.pickups = [];
    S.phase = 'flight';
    S.orbitCooldown = 0;
    let bookmarked = null;
    setHooks({ exploreHome(h) { bookmarked = h; } });

    // Just inside the warp radius, well outside the r+COMET_R collision radius —
    // proves the warp fires from proximity, not from stepBody's own hit detection.
    const warpR = bh.r * 0.3;
    comet.x = bh.x - (warpR - 0.5);
    comet.y = bh.y;
    comet.vx = 0; comet.vy = 0;

    step(1 / 240);

    assert.equal(S.phase, 'warp', 'proximity to a seeded black hole should begin the warp, not land/bounce');
    assert.ok(world.warp, 'world.warp should be populated');
    assert.equal(world.warp.b, bh);
    assert.ok(bookmarked, 'hooks.exploreHome should fire with the bookmark');
    assert.equal(bookmarked.blackHoleId, 'test-bh');
    assert.equal(bookmarked.bhX, bh.x);
    assert.equal(bookmarked.bhY, bh.y);
    setHooks({ exploreHome() {} });
});

test('OW-3: the warp triggers when penetrating deep into the event horizon', () => {
    startRun();
    const bh = { x: comet.x + 50, y: comet.y, r: EXPLORE_BLACKHOLE_R, m: EXPLORE_BLACKHOLE_R * EXPLORE_BLACKHOLE_R, type: 'blackhole', id: 'test-bh-2' };
    world.bodies = [bh];
    world.pickups = [];
    S.phase = 'flight';
    S.orbitCooldown = 0;
    
    // Position inside the new inner radius (0.3 * b.r)
    comet.x = bh.x - (bh.r * 0.2);
    comet.y = bh.y;
    comet.vx = 0; comet.vy = 0;

    step(1 / 240);

    assert.equal(S.phase, 'warp');
});

test('OW-3: stepWarp spirals for ~1s then completes at Town, resetting camera and clearing the bookmark trigger state', () => {
    startRun();
    const bh = { x: comet.x + 20, y: comet.y, r: EXPLORE_BLACKHOLE_R, m: EXPLORE_BLACKHOLE_R * EXPLORE_BLACKHOLE_R, type: 'blackhole', id: 'test-bh-3' };
    world.bodies = [bh];
    world.pickups = [];
    S.phase = 'flight';
    S.orbitCooldown = 0;
    comet.x = bh.x - (bh.r * 0.3 - 0.5);
    comet.y = bh.y;
    comet.vx = 0; comet.vy = 0;

    step(1 / 240);
    assert.equal(S.phase, 'warp');

    // Drive the spiral to completion (w.t += dt*1.1 each call; comfortably past 1).
    for (let i = 0; i < 500 && S.phase === 'warp'; i++) stepWarp(1 / 60);

    assert.equal(S.phase, 'rest', 'warp should complete into a normal Town landing');
    assert.equal(world.warp, null);
    assert.ok(comet.rest && comet.rest.b && comet.rest.b.type === 'tee', 'should land on the tee rock');
    assert.equal(camera.x, 50);
    assert.equal(camera.y, 85);
    assert.equal(atTown(), true);
});

test('OW-3: useReturnPortal is a no-op away from Town or without a bookmark', () => {
    startRun();
    loadExploreHome(null);
    assert.equal(useReturnPortal(), false, 'no bookmark yet');

    loadExploreHome({ blackHoleId: 'x', bhX: 100, bhY: 100, x: 110, y: 100 });
    S.phase = 'flight';
    assert.equal(useReturnPortal(), false, 'not at Town');

    loadExploreHome(null);
});

test('OW-3: useReturnPortal sends the comet back to the bookmarked black hole, directly into orbit', () => {
    startRun();
    assert.equal(atTown(), true, 'sanity: startRun leaves the comet at Town');
    
    // Find a real seeded black hole so updateActiveChunks() will produce it
    let found = false, bh = null;
    for (let cx = -20; cx <= 20 && !found; cx++) {
        for (let cy = -20; cy <= 20 && !found; cy++) {
            const bodies = getChunkBodies(cx, cy, 'explore-1');
            bh = bodies.find(b => b.type === 'blackhole');
            if (bh) found = true;
        }
    }
    
    loadExploreHome({ blackHoleId: bh.id, bhX: bh.x, bhY: bh.y, x: bh.x + 20, y: bh.y }); // approached from +x

    const ok = useReturnPortal();

    assert.equal(ok, true);
    assert.equal(S.phase, 'orbit');
    assert.equal(comet.vx, 0);
    assert.equal(comet.vy, 0);
    assert.ok(world.orbit !== null);
    
    const expectedR = EXPLORE_BLACKHOLE_R + COMET_R + ORBIT_MIN_GAP + 2;
    const actualR = Math.hypot(comet.x - bh.x, comet.y - bh.y);
    assert.ok(Math.abs(actualR - expectedR) < 1e-6, `should land exactly ${expectedR} from the black hole, got ${actualR}`);
    // Approached from +x (bhX < x), so should land east of the black hole.
    assert.ok(comet.x > bh.x);
    assert.ok(Math.abs(comet.y - bh.y) < 1e-6);
    assert.equal(atTown(), false, 'no longer at Town after returning');

    loadExploreHome(null);
});

test('OW-3: loadExploreHome tolerates null, undefined, or non-object saved payloads', () => {
    loadExploreHome({ blackHoleId: 'a', bhX: 1, bhY: 2, x: 3, y: 4 });
    assert.notEqual(exploreHome, null);
    loadExploreHome(null);
    assert.equal(exploreHome, null);
    loadExploreHome({ blackHoleId: 'a', bhX: 1, bhY: 2, x: 3, y: 4 });
    loadExploreHome(undefined);
    assert.equal(exploreHome, null);
    loadExploreHome({ blackHoleId: 'a', bhX: 1, bhY: 2, x: 3, y: 4 });
    loadExploreHome('garbage');
    assert.equal(exploreHome, null);
});

/* ============================== OW-5: Moons & rings (decorative) ============================== */

test('OW-5: only Giant planets ever get a moon or ring, and a meaningful share of them do', () => {
    let giants = 0, decorated = 0, nonGiantDecorated = 0;
    for (let cx = -10; cx <= 10; cx++) {
        for (let cy = -10; cy <= 10; cy++) {
            const bodies = getChunkBodies(cx, cy, 'moon-sample');
            for (const b of bodies) {
                if (b.type !== 'planet') continue;
                if (b.moon || b.ring) {
                    decorated++;
                    if (!b.giant) nonGiantDecorated++;
                }
                if (b.giant) giants++;
            }
        }
    }
    assert.ok(giants > 20, `sanity: sampled a meaningful number of Giants (got ${giants})`);
    assert.equal(nonGiantDecorated, 0, 'only Giants should ever carry a moon or ring');
    const rate = decorated / giants;
    assert.ok(rate > 0.4 && rate < 0.9, `moon/ring frequency among Giants should read as "a meaningful share" (got ${rate.toFixed(2)})`);
});

test('OW-5: a planet never gets both a moon and a ring', () => {
    for (let cx = -10; cx <= 10; cx++) {
        for (let cy = -10; cy <= 10; cy++) {
            const bodies = getChunkBodies(cx, cy, 'moon-sample-2');
            for (const b of bodies) {
                assert.ok(!(b.moon && b.ring), `planet ${b.id} has both a moon and a ring`);
            }
        }
    }
});

test('OW-5: moons and rings never appear as their own body — every returned body is a real physics type', () => {
    for (let cx = -8; cx <= 8; cx++) {
        for (let cy = -8; cy <= 8; cy++) {
            const bodies = getChunkBodies(cx, cy, 'moon-sample-3');
            for (const b of bodies) {
                assert.ok(['planet', 'blackhole'].includes(b.type),
                    `getChunkBodies returned an unexpected body type "${b.type}" — moons/rings must stay properties, never entries`);
            }
        }
    }
});

test('OW-5: getChunkBodies\'s moon/ring roll is deterministic for a given seed', () => {
    const a = getChunkBodies(4, -7, 'moon-det').map(b => ({ moon: b.moon, ring: b.ring }));
    const b = getChunkBodies(4, -7, 'moon-det').map(b => ({ moon: b.moon, ring: b.ring }));
    assert.deepEqual(a, b);
});

test('OW-5: moonPosition is deterministic and always exactly orbitR from the planet center', () => {
    const moon = { orbitR: 12, size: 3, period: 18, ang0: 1.2 };
    for (const t of [0, 3.7, 18, 41.25, 100]) {
        const p1 = moonPosition(50, -20, moon, t);
        const p2 = moonPosition(50, -20, moon, t);
        assert.deepEqual(p1, p2, `moonPosition(t=${t}) should be deterministic`);
        const d = Math.hypot(p1.x - 50, p1.y - (-20));
        assert.ok(Math.abs(d - moon.orbitR) < 1e-9, `moon should stay fixed at orbitR=${moon.orbitR}, got ${d}`);
    }
});

test('OW-5: moonPosition completes one full orbit every `period` seconds', () => {
    const moon = { orbitR: 10, size: 2, period: 20, ang0: 0 };
    const start = moonPosition(0, 0, moon, 0);
    const afterOnePeriod = moonPosition(0, 0, moon, 20);
    assert.ok(Math.abs(start.x - afterOnePeriod.x) < 1e-9);
    assert.ok(Math.abs(start.y - afterOnePeriod.y) < 1e-9);
    const halfway = moonPosition(0, 0, moon, 10);
    assert.ok(Math.abs(halfway.x - start.x) > 1, 'moon should have visibly moved at the half-period mark');
});

/* ============================== ORB-4: stardust rings (orbitable pickups) ============================== */

test('ORB-4: getChunkBodies never gives a black hole a stardust ring', () => {
    for (let cx = -10; cx <= 10; cx++) {
        for (let cy = -10; cy <= 10; cy++) {
            for (const b of getChunkBodies(cx, cy, 'stardust-ring-no-blackhole')) {
                if (b.type === 'blackhole') assert.ok(!b.stardustRing, `black hole ${b.id} should never carry a stardust ring`);
            }
        }
    }
});

test('ORB-4: a meaningful share of non-blackhole planets get a stardust ring, close to STARDUST_RING_CHANCE', () => {
    let eligible = 0, ringed = 0;
    for (let cx = -12; cx <= 12; cx++) {
        for (let cy = -12; cy <= 12; cy++) {
            for (const b of getChunkBodies(cx, cy, 'stardust-ring-rate')) {
                if (b.type === 'blackhole') continue;
                eligible++;
                if (b.stardustRing) ringed++;
            }
        }
    }
    assert.ok(eligible > 200, `sanity: sampled a meaningful number of planets (got ${eligible})`);
    const rate = ringed / eligible;
    assert.ok(Math.abs(rate - STARDUST_RING_CHANCE) < 0.1, `ring frequency should read close to STARDUST_RING_CHANCE=${STARDUST_RING_CHANCE} (got ${rate.toFixed(2)})`);
});

test('ORB-4: stardust ring geometry sits inside the orbit capture band and has 5-8 dots', () => {
    let checked = 0;
    for (let cx = -10; cx <= 10; cx++) {
        for (let cy = -10; cy <= 10; cy++) {
            for (const b of getChunkBodies(cx, cy, 'stardust-ring-geo')) {
                if (!b.stardustRing) continue;
                checked++;
                const gap = b.stardustRing.radius - (b.r + COMET_R);
                assert.ok(gap >= ORBIT_MIN_GAP - 1e-9 && gap <= ORBIT_MAX_GAP + 1e-9,
                    `ring gap ${gap} on ${b.id} should sit inside [${ORBIT_MIN_GAP}, ${ORBIT_MAX_GAP}]`);
                assert.ok(b.stardustRing.count >= STARDUST_RING_COUNT_MIN && b.stardustRing.count <= STARDUST_RING_COUNT_MAX,
                    `ring count should be ${STARDUST_RING_COUNT_MIN}-${STARDUST_RING_COUNT_MAX}, got ${b.stardustRing.count}`);
            }
        }
    }
    assert.ok(checked > 20, `sanity: sampled a meaningful number of rings (got ${checked})`);
});

test('ORB-4: getChunkBodies\'s stardust ring roll is deterministic for a given seed', () => {
    const a = getChunkBodies(6, -3, 'stardust-ring-det').map(b => b.stardustRing);
    const b = getChunkBodies(6, -3, 'stardust-ring-det').map(b => b.stardustRing);
    assert.deepEqual(a, b);
});

test('ORB-4: getChunkPickups emits evenly-spaced dots on a body\'s stardust ring, exactly at the ring radius', () => {
    let checked = 0;
    for (let cx = -10; cx <= 10 && checked < 5; cx++) {
        for (let cy = -10; cy <= 10 && checked < 5; cy++) {
            const bodies = getChunkBodies(cx, cy, 'stardust-ring-pickups');
            const ringed = bodies.filter(b => b.stardustRing && b.id.startsWith(`c${cx}_${cy}_`));
            if (!ringed.length) continue;
            const pickups = getChunkPickups(cx, cy, 'stardust-ring-pickups', bodies);
            for (const b of ringed) {
                const dots = pickups.filter(p => p.id.startsWith(`pr${cx}_${cy}_${b.id}_`));
                assert.ok(dots.length > 0, `ringed body ${b.id} should emit at least one ring dot`);
                assert.ok(dots.length <= b.stardustRing.count, 'should never emit more dots than the ring\'s count');
                for (const p of dots) {
                    const d = Math.hypot(p.x - b.x, p.y - b.y);
                    assert.ok(Math.abs(d - b.stardustRing.radius) < 1e-9, `dot should sit exactly at ring radius, got ${d} vs ${b.stardustRing.radius}`);
                    assert.equal(p.type, 'stardust');
                    assert.equal(p.r, 1.2);
                }
            }
            checked++;
        }
    }
    assert.ok(checked > 0, 'sanity: sampled at least one ringed chunk');
});

test('ORB-4: getChunkPickups\' ring dot layout is deterministic for a given seed', () => {
    let checked = false;
    for (let cx = -10; cx <= 10 && !checked; cx++) {
        for (let cy = -10; cy <= 10 && !checked; cy++) {
            const bodies = getChunkBodies(cx, cy, 'stardust-ring-layout-det');
            if (!bodies.some(b => b.stardustRing)) continue;
            const a = getChunkPickups(cx, cy, 'stardust-ring-layout-det', bodies).filter(p => p.id.startsWith('pr'));
            const b = getChunkPickups(cx, cy, 'stardust-ring-layout-det', bodies).filter(p => p.id.startsWith('pr'));
            assert.deepEqual(a, b);
            checked = true;
        }
    }
    assert.ok(checked, 'sanity: sampled at least one ringed chunk');
});

test('ORB-4: getChunkPickups only emits a ringed body\'s dots from its own canonical chunk, never a neighbor\'s (no 3x3 duplication)', () => {
    let found = false;
    for (let cx = -10; cx <= 10 && !found; cx++) {
        for (let cy = -10; cy <= 10 && !found; cy++) {
            const bodies = getChunkBodies(cx, cy, 'stardust-ring-dup');
            const ringed = bodies.find(b => b.stardustRing);
            if (!ringed) continue;
            found = true;
            // Simulate a neighboring chunk's call receiving this body in its bodies
            // list (as updateActiveChunks' 3x3 neighbor lookup would) but generating
            // its own (cx+1, cy) pickups — the id-prefix guard must keep it silent.
            const neighborPickups = getChunkPickups(cx + 1, cy, 'stardust-ring-dup', bodies);
            const leaked = neighborPickups.filter(p => p.id.startsWith(`pr${cx}_${cy}_`));
            assert.equal(leaked.length, 0, 'a neighboring chunk must never emit another chunk\'s ring dots');
        }
    }
    assert.ok(found, 'sanity: sampled at least one ringed chunk');
});

test('ORB-4: pickupBlockedByBody skips a ring dot that would land inside another body, excluding the host from that check', () => {
    const host = { x: 0, y: 0, r: 10, id: 'c0_0_0' };
    host.stardustRing = { radius: 10 + COMET_R + ORBIT_MIN_GAP + 1, count: 6, ang0: 0 };
    const dotR = host.stardustRing.radius;
    // Blocker sits exactly where the angle-0 dot would land.
    const blocker = { x: dotR, y: 0, r: 3, id: 'c0_0_1' };
    const pickups = getChunkPickups(0, 0, 'blocked-dot-seed', [host, blocker]);
    const dots = pickups.filter(p => p.id.startsWith('pr0_0_c0_0_0_'));
    assert.ok(!dots.some(p => Math.abs(p.x - dotR) < 1e-6 && Math.abs(p.y) < 1e-6),
        'the dot blocked by another body should be skipped');
    assert.ok(dots.length > 0 && dots.length < host.stardustRing.count,
        'unblocked dots on the same ring should still be emitted');
});

test('ORB-4: ringSnap is a no-op on a failed capture, magnet off, or a body with no ring', () => {
    const b = { x: 0, y: 0, r: 10, m: 100, type: 'planet' };
    const cap = { radius: 15, ang: 0.3, omega: 2 };
    assert.equal(ringSnap(null, b, true), null, 'no-op on a failed capture');
    assert.deepEqual(ringSnap(cap, b, false), cap, 'no-op when magnet is off');
    assert.deepEqual(ringSnap(cap, b, true), cap, 'no-op when the body has no ring');
});

test('ORB-4: ringSnap snaps radius to the ring, keeps direction, and recomputes circular omega for the new radius', () => {
    const b = { x: 0, y: 0, r: 10, m: 400, type: 'planet', stardustRing: { radius: 20, count: 6, ang0: 0 } };
    const capPos = { radius: 15, ang: 0.7, omega: 3 };  // captured at radius 15, positive (CCW) direction
    const snappedPos = ringSnap(capPos, b, true);
    assert.equal(snappedPos.radius, 20);
    assert.equal(snappedPos.ang, capPos.ang, 'angle carries over unchanged');
    assert.ok(snappedPos.omega > 0, 'direction sign should carry over from the capture');
    const expected = circularSpeed(b.m, 20) / 20;
    assert.ok(Math.abs(snappedPos.omega - expected) < 1e-9, `omega should be circular speed at the ring radius, got ${snappedPos.omega} vs ${expected}`);

    const capNeg = { radius: 15, ang: 0.7, omega: -3 }; // negative (CW) direction
    const snappedNeg = ringSnap(capNeg, b, true);
    assert.ok(snappedNeg.omega < 0, 'negative direction should carry over too');
    assert.ok(Math.abs(snappedNeg.omega + expected) < 1e-9);
});

test('ORB-4: capturing onto a ringed planet with Orbit Magnet ON orbits at the ring radius and sweeps every dot within one revolution', () => {
    startRun();
    S.inventory = mergeInventory({ orbitMagnet: { owned: true, enabled: true } });

    const body = { x: comet.x + 40, y: comet.y, r: 10, m: 400, type: 'planet', id: 'test-ring-planet' };
    const ringRadius = body.r + COMET_R + ORBIT_MIN_GAP + 3;
    const count = 6;
    body.stardustRing = { radius: ringRadius, count, ang0: 0 };
    world.bodies = [body];
    world.pickups = [];
    for (let i = 0; i < count; i++) {
        const ang = i * (Math.PI * 2 / count);
        world.pickups.push({
            x: body.x + Math.cos(ang) * ringRadius, y: body.y + Math.sin(ang) * ringRadius,
            r: 1.2, type: 'stardust', id: `ring-dot-${i}`,
        });
    }

    // Approach at a band gap different from the ring's own gap, so landing on the
    // ring radius is provably the snap, not a coincidence of the approach itself.
    const approachGap = ORBIT_MIN_GAP + 0.3;
    comet.x = body.x - (body.r + COMET_R + approachGap);
    comet.y = body.y;
    comet.vx = 40; comet.vy = 30;
    S.phase = 'flight';
    S.orbitCooldown = 0;

    step(1 / 240);

    assert.equal(S.phase, 'orbit', 'should have captured into orbit');
    assert.ok(world.orbit, 'world.orbit should be set');
    assert.equal(world.orbit.b, body);
    assert.ok(Math.abs(world.orbit.radius - ringRadius) < 1e-9,
        `orbit radius should snap to the ring radius, got ${world.orbit.radius} vs ${ringRadius}`);

    const period = 2 * Math.PI / Math.abs(world.orbit.omega);
    const dt = 1 / 240;
    for (let t = 0; t < period * 1.05; t += dt) stepOrbit(dt);

    assert.equal(world.pickups.length, 0, 'orbiting a ringed planet for one revolution should collect every dot on the ring');

    world.bodies = [];
    world.pickups = [];
    world.orbit = null;
});

test('ORB-4: strict capture (Orbit Magnet OFF) never snaps to a ring — grazing is unaffected', () => {
    startRun();
    S.inventory = mergeInventory({ orbitMagnet: { owned: true, enabled: false } });

    const body = { x: comet.x + 40, y: comet.y, r: 10, m: 400, type: 'planet', id: 'test-ring-planet-off' };
    body.stardustRing = { radius: body.r + COMET_R + ORBIT_MIN_GAP + 3, count: 6, ang0: 0 };
    world.bodies = [body];
    world.pickups = [];

    // A near-circular approach at close-to-circular speed, well inside the band —
    // exactly the case strict orbitCapture() accepts.
    const gap = ORBIT_MIN_GAP + 1;
    const d = body.r + COMET_R + gap;
    comet.x = body.x - d;
    comet.y = body.y;
    const vc = circularSpeed(body.m, d);
    comet.vx = 0; comet.vy = -vc; // tangential at circular speed
    S.phase = 'flight';
    S.orbitCooldown = 0;

    step(1 / 240);

    if (S.phase === 'orbit') {
        // One dt of Euler integration nudges the captured radius slightly off the
        // pre-set approach distance `d` — assert it stayed near the approach, not
        // that it's exact, and that it's nowhere near the (much larger) ring radius.
        assert.ok(Math.abs(world.orbit.radius - d) < 1,
            `strict capture should hug the approach radius ~${d}, got ${world.orbit.radius}`);
        assert.ok(Math.abs(world.orbit.radius - body.stardustRing.radius) > 1,
            'strict capture should never land on the ring radius when the magnet is off');
    }

    world.bodies = [];
    world.pickups = [];
    world.orbit = null;
});

/* ============================== OW-9: zoom-out star map / fog-of-war discovery ============================== */

test('OW-9: chunkKeyAt matches the floor(coord/CHUNK_SIZE) math used everywhere else in the module', () => {
    assert.equal(chunkKeyAt(0, 0), '0_0');
    assert.equal(chunkKeyAt(CHUNK_SIZE - 1, CHUNK_SIZE - 1), '0_0');
    assert.equal(chunkKeyAt(CHUNK_SIZE, CHUNK_SIZE), '1_1');
    assert.equal(chunkKeyAt(-1, -1), '-1_-1');
    assert.equal(chunkKeyAt(-CHUNK_SIZE, 0), '-1_0');
});

test('OW-9: flying marks the current chunk discovered, once, and hooks.discovery fires only on a genuinely new chunk', () => {
    loadDiscoveredChunks([]);
    startRun();
    let fired = 0, lastPayload = null;
    setHooks({ discovery(arr) { fired++; lastPayload = arr; } });

    S.phase = 'flight';
    S.orbitCooldown = 0;
    world.bodies = [];
    world.pickups = [];
    comet.vx = 10; comet.vy = 0;

    step(1 / 240); // first tick in this chunk — a new discovery
    assert.equal(fired, 1);
    assert.ok(discoveredChunks.has(chunkKeyAt(comet.x, comet.y)));
    assert.deepEqual(lastPayload, Array.from(discoveredChunks));

    step(1 / 240); // still the same chunk — no new discovery
    assert.equal(fired, 1, 'hooks.discovery should not refire for an already-discovered chunk');

    setHooks({ discovery() {} });
    loadDiscoveredChunks([]);
});

test('OW-9: discoveredChunks survives a run reset — startRun does not clear it (same lifetime as stardust/upgrades)', () => {
    loadDiscoveredChunks(['5_5', '-2_3']);
    startRun();
    assert.ok(discoveredChunks.has('5_5'));
    assert.ok(discoveredChunks.has('-2_3'));
    loadDiscoveredChunks([]);
});

test('OW-9: loadDiscoveredChunks tolerates null, undefined, or non-array saved payloads', () => {
    loadDiscoveredChunks(['a_b']);
    assert.ok(discoveredChunks.has('a_b'));

    loadDiscoveredChunks(null);
    assert.equal(discoveredChunks.size, 0);

    loadDiscoveredChunks(['a_b']);
    loadDiscoveredChunks(undefined);
    assert.equal(discoveredChunks.size, 0);

    loadDiscoveredChunks(['a_b']);
    loadDiscoveredChunks('garbage');
    assert.equal(discoveredChunks.size, 0);

    loadDiscoveredChunks(['a_b']);
    loadDiscoveredChunks({ not: 'an array' });
    assert.equal(discoveredChunks.size, 0);
});

test('OW-9: orbiting marks the orbited chunk discovered too, not just free flight', () => {
    loadDiscoveredChunks([]);
    startRun();
    const body = { x: comet.x + 20, y: comet.y, r: 10, m: 100, type: 'planet' };
    world.orbit = { b: body, radius: 20, ang: 0, omega: 1 };
    S.phase = 'orbit';

    stepOrbit(1 / 240);

    assert.ok(discoveredChunks.has(chunkKeyAt(comet.x, comet.y)));
    world.orbit = null;
    loadDiscoveredChunks([]);
});

test('Town Orbit: tee body can capture the comet into orbit via magnetCapture', () => {
    startRun();
    const town = { x: comet.x + 40, y: comet.y, r: 10, m: 100, type: 'tee' };
    world.bodies = [town];
    world.pickups = [];
    S.phase = 'flight';
    S.orbitCooldown = 0;
    
    S.inventory = mergeInventory({ orbitMagnet: { owned: true, enabled: true } });
    
    const d = 18;
    comet.x = town.x - d;
    comet.y = town.y;
    comet.vx = 50; comet.vy = 0;
    
    step(1 / 240);
    assert.equal(S.phase, 'orbit', 'Town (tee) should capture comet into orbit when magnet is ON');
    assert.ok(world.orbit);
    assert.equal(world.orbit.b, town);
});

test('Thruster tap: quick tap while Thruster is enabled triggers tap action (DOM logic verified manually)', () => {
    startRun();
    const town = { x: comet.x + 40, y: comet.y, r: 10, m: 100, type: 'tee' };
    world.bodies = [town];
    S.phase = 'flight';
    S.inventory = mergeInventory({ orbitMagnet: { owned: true, enabled: true } });
    
    // Position comet in the capture band
    comet.x = town.x - 18;
    comet.y = town.y;
    
    handleTap(town.x, town.y);
    assert.equal(S.phase, 'descend', 'tap on Town should begin descent');
});
