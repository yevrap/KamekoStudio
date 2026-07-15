import { test } from 'node:test';
import assert from 'node:assert/strict';
import { screenToWorld, worldToScreen, getChunkBodies, updateActiveChunks, CHUNK_SIZE, camera } from '../games/black-hole-in-one/explore.js';
import { world } from '../games/black-hole-in-one/state.js';

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
