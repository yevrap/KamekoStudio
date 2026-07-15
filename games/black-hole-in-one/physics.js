// Black Hole in One — pure physics (DOM-free, unit-tested).
// All functions take bodies/blackHole explicitly so tests can build scenarios.
'use strict';

import { G, MAX_V, CAPTURE_R, COMET_R, REST_V, SOFT_CATCH, SOFT_BOUNCE, REST_BOUNCE, REST_FRIC, dist } from './constants.js';

export function gravityAt(bodies, blackHole, x, y) {
    let ax = 0, ay = 0;
    const all = blackHole ? bodies.concat([blackHole]) : bodies;
    for (const b of all) {
        const dx = b.x - x, dy = b.y - y;
        const d2 = Math.max(dx * dx + dy * dy, (b.r * 0.8) * (b.r * 0.8));
        const d = Math.sqrt(d2);
        const a = G * b.m / d2;
        ax += a * dx / d; ay += a * dy / d;
    }
    return [ax, ay];
}

// One physics step for a body state {x,y,vx,vy}. Returns:
// null = still flying · {hit:body} = collided · {sink:true} = captured
export function stepBody(p, dt, bodies, blackHole) {
    const [ax, ay] = gravityAt(bodies, blackHole, p.x, p.y);
    p.vx += ax * dt; p.vy += ay * dt;
    const sp = Math.hypot(p.vx, p.vy);
    if (sp > MAX_V) { p.vx *= MAX_V / sp; p.vy *= MAX_V / sp; }
    p.x += p.vx * dt; p.y += p.vy * dt;

    if (blackHole && dist(p.x, p.y, blackHole.x, blackHole.y) < CAPTURE_R) return { sink: true };
    for (const b of bodies) {
        if (b.type === 'pulsar') continue;
        const d = dist(p.x, p.y, b.x, b.y), rr = b.r + COMET_R;
        if (d < rr) return { hit: b, d };
    }
    return null;
}

// Collision response against body b. Repositions p onto the surface and either
// lands it or bounces it. Landing window is wide (REST_V) and impacts just above
// it bounce nearly dead (soft catch) so the next touch sticks — deliberate
// planet-hopping is meant to succeed (questionnaire Q4).
// Returns { landed, bounced, soft, k, ang } — k is bounce intensity 0..1.
export function collide(p, b) {
    const dx = p.x - b.x, dy = p.y - b.y;
    const d = Math.hypot(dx, dy) || 0.001;
    const nx = dx / d, ny = dy / d, rr = b.r + COMET_R;
    p.x = b.x + nx * rr; p.y = b.y + ny * rr;
    const vn = p.vx * nx + p.vy * ny;
    if (vn >= 0) return { landed: false, bounced: false };
    const speed = Math.hypot(p.vx, p.vy);
    const ang = Math.atan2(ny, nx);
    if (speed < REST_V) return { landed: true, bounced: false, ang };
    const soft = speed < REST_V * SOFT_CATCH;
    const bounce = soft ? SOFT_BOUNCE : REST_BOUNCE;
    const vtx = p.vx - vn * nx, vty = p.vy - vn * ny;
    p.vx = vtx * REST_FRIC - vn * bounce * nx;
    p.vy = vty * REST_FRIC - vn * bounce * ny;
    return { landed: false, bounced: true, soft, k: Math.min(-vn / 70, 1), ang };
}
