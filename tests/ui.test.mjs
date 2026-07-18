import { test } from 'node:test';
import assert from 'node:assert/strict';

// Mock DOM before importing ui.js
global.document = {
    getElementById: () => ({
        classList: { add: () => {}, remove: () => {}, toggle: () => {} },
        addEventListener: () => {},
        style: {},
        getContext: () => ({})
    }),
    querySelector: () => null
};
global.window = {
    innerWidth: 800,
    innerHeight: 600,
    addEventListener: () => {},
    requestAnimationFrame: (cb) => {} // mock raf
};

const ui = await import('../games/black-hole-in-one/ui.js');
const { getSnappedAim } = ui;
import { S, world, comet, defaultInventory } from '../games/black-hole-in-one/state.js';
import { G, COMET_R, circularSpeed, MAX_DRAG, MAX_LAUNCH } from '../games/black-hole-in-one/constants.js';

test('getSnappedAim returns raw input if Nav Computer is disabled', () => {
    S.inventory = defaultInventory();
    S.inventory.navComputer = { enabled: false };
    const drag = { sx: 100, sy: 100, cx: 80, cy: 90 }; // dx=20, dy=10
    const res = getSnappedAim(drag, S, comet);
    assert.equal(res.dx, 20);
    assert.equal(res.dy, 10);
    assert.equal(res.isOrbit, false);
});

test('getSnappedAim ignores shots below MIN_SHOT', () => {
    S.inventory = defaultInventory();
    S.inventory.navComputer = { enabled: true };
    const drag = { sx: 10, sy: 10, cx: 10, cy: 10 }; // len=0
    const res = getSnappedAim(drag, S, comet);
    assert.equal(res.dx, 0);
    assert.equal(res.dy, 0);
    assert.equal(res.isOrbit, false);
});

test('getSnappedAim finds adjacent orbit and snaps aim', () => {
    S.inventory = defaultInventory();
    S.inventory.navComputer = { enabled: true };
    world.orbit = null;
    
    // Set up a planet
    const planet = { type: 'planet', x: 100, y: 100, r: 10, m: 100 };
    world.bodies = [planet];
    world.blackHole = null;

    // Comet starts just above the planet, at the perfect orbital distance
    const dist = planet.r + COMET_R + 2.5; // ORBIT_MIN_GAP (1.5) < 2.5 < ORBIT_MAX_GAP (6.0)
    comet.x = planet.x;
    comet.y = planet.y - dist;
    comet.vx = 0;
    comet.vy = 0;
    comet.rest = null;

    // Circular speed needed at this distance
    const vcirc = circularSpeed(planet.m, dist);
    
    // Reverse engineer drag length and power to give vcirc
    const dragLen = (vcirc / MAX_LAUNCH) * MAX_DRAG;
    
    // Perfect aim: straight right (angle 0)
    const perfDx = dragLen;
    const perfDy = 0;
    
    // We offset the aim slightly (angle ~0.05 rad)
    const aimAng = 0.05;
    const dragDx = dragLen * Math.cos(aimAng);
    const dragDy = dragLen * Math.sin(aimAng);
    
    const drag = {
        sx: dragDx, sy: dragDy,
        cx: 0, cy: 0
    };
    
    const res = getSnappedAim(drag, S, comet);
    
    assert.equal(res.isOrbit, true);
    // It should snap to an angle close to 0
    const resAng = Math.atan2(res.dy, res.dx);
    assert(Math.abs(resAng) < 0.02, `Snapped angle ${resAng} should be ~0`);
    
    // Magnitude should remain exactly the same
    const resLen = Math.hypot(res.dx, res.dy);
    assert(Math.abs(resLen - dragLen) < 0.01, `Snapped length ${resLen} should match drag length ${dragLen}`);
});
