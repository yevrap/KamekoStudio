import test from 'node:test';
import assert from 'node:assert/strict';

global.document = {
    getElementById: () => ({ getContext: () => ({}) })
};
global.window = {
    innerWidth: 800,
    innerHeight: 600,
    devicePixelRatio: 1
};
global.localStorage = {
    getItem: () => null,
    setItem: () => {}
};

test('ui tests', async () => {
    const { getSnappedAim } = await import('../games/black-hole-in-one/ui.js');
    const { circularSpeed, MIN_SHOT, MAX_LAUNCH, MAX_DRAG, COMET_R } = await import('../games/black-hole-in-one/constants.js');
    const { world, S } = await import('../games/black-hole-in-one/state.js');

    const comet = { x: 0, y: 0, vx: 0, vy: 0 };

    await test('getSnappedAim returns raw input if Nav Computer is disabled', () => {
        S.inventory = { navComputer: { enabled: false } };
        const drag = { sx: 100, sy: 100, cx: 0, cy: 0 };
        const res = getSnappedAim(drag, S, comet);
        
        assert.equal(res.isOrbit, false);
        assert.equal(res.dx, 100);
        assert.equal(res.dy, 100);
    });

    await test('getSnappedAim ignores shots below MIN_SHOT', () => {
        S.inventory = { navComputer: { enabled: true } };
        const drag = { sx: 10, sy: 10, cx: 0, cy: 0 };
        const res = getSnappedAim(drag, S, comet);
        
        assert.equal(res.isOrbit, false);
        assert.equal(res.dx, 10);
        assert.equal(res.dy, 10);
    });

    await test('getSnappedAim finds adjacent orbit and snaps aim', () => {
        S.inventory = { navComputer: { enabled: true } };
        world.orbit = null;
        
        const planet = { type: 'planet', x: 100, y: 100, r: 10, m: 100, id: 'p1' };
        world.bodies.length = 0;
        world.bodies.push(planet);
        world.blackHole = null;

        const dist = planet.r + COMET_R + 3.0; 
        comet.x = planet.x;
        comet.y = planet.y - dist;
        comet.vx = 0;
        comet.vy = 0;
        comet.rest = null;

        const vcirc = circularSpeed(planet.m, dist);
        const dragLen = vcirc / (MAX_LAUNCH / MAX_DRAG);
        
        const aimAng = 0.50; // Angle outside perfect orbit but adjacent
        const dragDx = dragLen * Math.cos(aimAng);
        const dragDy = dragLen * Math.sin(aimAng);
        
        const drag = {
            sx: dragDx, sy: dragDy,
            cx: 0, cy: 0
        };
        
        const res = getSnappedAim(drag, S, comet);
        
        assert.equal(res.isOrbit, true);
        const resAng = Math.atan2(res.dy, res.dx);
        assert(Math.abs(resAng - aimAng) > 0.01, `Snapped angle ${resAng} should differ from raw aim ${aimAng}`);
    });
});
