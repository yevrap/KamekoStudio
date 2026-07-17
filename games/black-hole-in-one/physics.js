// Black Hole in One — pure physics (DOM-free, unit-tested).
// All functions take bodies/blackHole explicitly so tests can build scenarios.
'use strict';

import {
    G, MAX_V, CAPTURE_R, COMET_R, REST_V, SOFT_CATCH, SOFT_BOUNCE, REST_BOUNCE, REST_FRIC, dist,
    ORBIT_MIN_GAP, ORBIT_MAX_GAP, ORBIT_MIN_TAN, ORBIT_RADIAL_TOL, ORBIT_SPEED_TOL, circularSpeed,
} from './constants.js';

// `damp` (optional) = { body, factor }: scales that one body's pull by `factor`.
// Used by the STAB-1 liftoff grace to briefly weaken the launch planet's gravity
// so a flick off its surface reliably gets clear instead of being re-captured.
export function gravityAt(bodies, blackHole, x, y, damp) {
    let ax = 0, ay = 0;
    const all = blackHole ? bodies.concat([blackHole]) : bodies;
    for (const b of all) {
        const dx = b.x - x, dy = b.y - y;
        // Floor at 1.0·r (INV-3c, was 0.8·r): a body's own surface (r + COMET_R)
        // is always > 1.0·r, so this never touches any reachable resting/collision
        // distance in golf, Endless, or Explore — it only guards the theoretical
        // deep-penetration case (d < r), which normal collision detection prevents
        // from ever occurring (see INV-3c dev notes for the tunneling-distance math).
        const d2 = Math.max(dx * dx + dy * dy, (b.r * 1.0) * (b.r * 1.0));
        const d = Math.sqrt(d2);
        let a = G * b.m / d2;
        if (damp && b === damp.body) a *= damp.factor;
        ax += a * dx / d; ay += a * dy / d;
    }
    return [ax, ay];
}

// One physics step for a body state {x,y,vx,vy}. Returns:
// null = still flying · {hit:body} = collided · {sink:true} = captured
// `damp` is forwarded to gravityAt (see above).
export function stepBody(p, dt, bodies, blackHole, damp) {
    const [ax, ay] = gravityAt(bodies, blackHole, p.x, p.y, damp);
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

// Orbit capture (BH-4). Is the flying comet p in a near-circular pass around
// planet b — i.e. hugging it, moving nearly tangentially, at close to circular
// speed? If so, return the orbit to snap onto: { radius, omega, ang } (omega
// signed by travel direction). Otherwise null. Pure — takes explicit state so
// tests build scenarios directly.
//   radius = current distance (the orbit hugs where it was caught)
//   omega  = angular velocity that reproduces the tangential speed at that radius
//   ang    = current angle of the comet around b
export function orbitCapture(p, b) {
    if (b.type !== 'planet') return null;
    const dx = p.x - b.x, dy = p.y - b.y;
    const d = Math.hypot(dx, dy) || 1e-6;
    const gap = d - (b.r + COMET_R);
    if (gap < ORBIT_MIN_GAP || gap > ORBIT_MAX_GAP) return null;   // must hug the planet

    const nx = dx / d, ny = dy / d;                 // radial (outward) unit
    const vr = p.vx * nx + p.vy * ny;               // radial speed (+ = climbing away)
    const vt = p.vx * -ny + p.vy * nx;              // tangential speed (signed by travel dir)
    const vc = circularSpeed(b.m, d);               // circular speed at this radius
    if (Math.abs(vt) < ORBIT_MIN_TAN) return null;                 // near-stationary graze → lands, not orbits
    if (Math.abs(vr) > vc * ORBIT_RADIAL_TOL) return null;         // diving in / flying out → not an orbit
    if (Math.abs(Math.abs(vt) - vc) > vc * ORBIT_SPEED_TOL) return null; // too fast (slingshot) / too slow

    const dir = vt >= 0 ? 1 : -1;
    return { radius: d, omega: dir * vc / d, ang: Math.atan2(dy, dx) };
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
