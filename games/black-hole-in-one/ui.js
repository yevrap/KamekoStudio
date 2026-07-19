// Black Hole in One — all rendering (canvas) and DOM chrome.
// Owns the letterbox transform: the fixed 100×170 course is scaled to fit the
// canvas and centered; view.ox/oy are the world-unit margins around it.
'use strict';

import {
    WORLD_W as W, COURSE_H, COMET_R, CAPTURE_R, DT, MAX_DRAG, MAX_LAUNCH, MIN_SHOT,
    ROUND_HOLES, LIFTOFF_T, LIFTOFF_MIN, ZOOM_LERP, fitZoom, rand, fmtDiff,
    upgradeCost, tankMaxFuel, siphonGain, sensorChunkRadius, ITEMS, STICK_R_PX,
    moonPosition, ORBIT_MIN_GAP, ORBIT_MAX_GAP, LS_KEYS, hitTestMapTargets, OB_MARGIN, mapBounds,
    overviewAvailable, overviewTransform, overviewToWorld, worldToOverview,
} from './constants.js';
import { S, world, comet } from './state.js';
import { stepBody } from './physics.js';
import * as explore from './explore.js';
import { setMuted, isMuted } from './sfx.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

export const view = { scale: 1, dpr: 1, ox: 0, oy: 0, vw: W, vh: COURSE_H, zoom: 1 };
export const camera = { x: 50, y: 85 };

/* ============================== ZOOM (STAB-2) ============================== */

// The world-span the view should try to frame right now: the orbit diameter while
// orbiting, or a large planet you're resting/aiming on. 0 = nothing special → no
// zoom. Golf's bodies are small enough that fitZoom() always returns 1 here.
function focusSpan() {
    if (world.orbit) return 2 * world.orbit.radius + 2 * COMET_R;
    const b = comet.rest && comet.rest.b;
    if (b && b.type === 'planet' && (S.phase === 'rest' || S.phase === 'aiming')) {
        return 2 * (b.r + COMET_R) * 1.4;
    }
    return 0;
}

// Smoothly ease view.zoom toward the current target each frame (call from the loop).
export function updateZoom(dt) {
    const target = fitZoom(focusSpan(), Math.min(view.vw, view.vh));
    const k = Math.min(1, dt * ZOOM_LERP);
    view.zoom += (target - view.zoom) * k;
    if (Math.abs(view.zoom - target) < 0.001) view.zoom = target;
}

// ---- Thruster floating-stick fade (INV-3b) -----------------------------------
// Eases the ring/nub's opacity in/out over ~0.12s so a quick tap doesn't strobe
// (a tap releases well before alpha reaches 1, so it never even flashes at full
// opacity). lastStickPos is cached so the fade-OUT after release still has a
// point to draw at, even though explore.stick itself goes null immediately.
let stickAlpha = 0;
let lastStickPos = null;

export function stepStick(dt) {
    if (explore.stick) lastStickPos = explore.stick;
    const active = S.mode === 'explore' && !!S.inventory.thruster?.enabled && !!explore.stick;
    const target = active ? 1 : 0;
    stickAlpha += (target - stickAlpha) * Math.min(1, dt / 0.12);
    if (Math.abs(stickAlpha - target) < 0.01) stickAlpha = target;
}

let stars = [];
let nebula = null;
let particles = [];

/* ============================== VIEW / RESIZE ============================== */

export function resize() {
    const cw = canvas.clientWidth, chh = canvas.clientHeight;
    if (cw <= 0 || chh <= 0) return;
    view.dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cw * view.dpr);
    canvas.height = Math.round(chh * view.dpr);
    // Base scale on physical inches approx, or fixed relative to mobile height.
    // 170 units is a good height. Let's fix scale so 170 units = mobile screen height.
    // Or just pick a fixed scale: e.g. 100 units = 375px wide.
    view.scale = Math.min(cw / 100, chh / 170); // this keeps the same size as before but expands the viewport
    if (cw > 500) { view.scale = chh / 170; } // on wide screens, lock vertical scale
    
    view.vw = cw / view.scale;
    view.vh = chh / view.scale;
    view.ox = 0; // No letterbox
    view.oy = 0;
    makeStars();
    makeNebula();
    explore.setViewScale(view.scale);
}

export function toWorld(e) {
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    // Invert the render transform, including the STAB-2 zoom about the screen centre,
    // so aiming stays accurate while zoomed out.
    const cx = view.vw / 2, cy = view.vh / 2;
    const vx = cx + (sx / view.scale - cx) / view.zoom;
    const vy = cy + (sy / view.scale - cy) / view.zoom;
    if (S.mode === 'explore') {
        return [vx - (view.vw / 2 - explore.camera.x), vy - (view.vh / 2 - explore.camera.y)];
    }
    return [vx - (view.vw / 2 - camera.x), vy - (view.vh / 2 - camera.y)];
}

// View units (screen-anchored: canvas-relative CSS px ÷ view.scale) — stops short
// of toWorld()'s camera translate and STAB-2 zoom, which is exactly why the
// Thruster's floating stick (INV-3b) uses this instead: a stick anchored in world
// coordinates would slide out from under the player's thumb as the camera follows
// the comet and the zoom eases.
export function toView(e) {
    const rect = canvas.getBoundingClientRect();
    return [(e.clientX - rect.left) / view.scale, (e.clientY - rect.top) / view.scale];
}

function makeStars() {
    stars = [];
    const n = Math.round(110 * (view.vw * view.vh) / (W * COURSE_H));
    for (let i = 0; i < n; i++) {
        stars.push({ x: rand(-view.ox, W + view.ox), y: rand(-view.oy, COURSE_H + view.oy),
                     r: rand(0.12, 0.5), ph: rand(0, 7), sp: rand(0.6, 2.2) });
    }
}

function makeNebula() {
    nebula = document.createElement('canvas');
    const nw = 300, nh = Math.round(300 * view.vh / view.vw);
    nebula.width = nw; nebula.height = Math.max(nh, 50);
    const nctx = nebula.getContext('2d');
    const blobs = [['42,26,94', 0.5], ['14,58,85', 0.42], ['94,26,78', 0.34]];
    for (const [rgb, a] of blobs) {
        const bx = rand(0.1, 0.9) * nw, by = rand(0.1, 0.9) * nebula.height, br = rand(0.35, 0.6) * nw;
        const g = nctx.createRadialGradient(bx, by, 0, bx, by, br);
        g.addColorStop(0, `rgba(${rgb},${a * 0.5})`);
        g.addColorStop(1, `rgba(${rgb},0)`);
        nctx.fillStyle = g;
        nctx.fillRect(0, 0, nw, nebula.height);
    }
}

/* ============================== PARTICLES ============================== */

export function burst(x, y, n, color, speed) {
    for (let i = 0; i < n; i++) {
        const a = rand(0, Math.PI * 2), sp = rand(0.2, 1) * speed;
        particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
                         life: rand(0.4, 0.9), max: 0.9, color, size: rand(0.3, 0.8) });
    }
}

export function stepParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.vx *= 0.985; p.vy *= 0.985;
    }
    const bh = world.blackHole;
    if (bh && Math.random() < 0.09) {
        const a = rand(0, Math.PI * 2), r = bh.r * rand(2.4, 3.4);
        particles.push({ x: bh.x + Math.cos(a) * r, y: bh.y + Math.sin(a) * r,
                         spiral: { a, r, w: rand(2.5, 4) }, life: 1.1, max: 1.1,
                         color: '#ffb36b', size: rand(0.15, 0.35) });
    }
    for (const p of particles) {
        if (!p.spiral) continue;
        const t = 1 - p.life / p.max;
        p.spiral.a += p.spiral.w * dt / (0.3 + p.spiral.r * 0.02);
        const r = p.spiral.r * (1 - t);
        p.x = bh.x + Math.cos(p.spiral.a) * r;
        p.y = bh.y + Math.sin(p.spiral.a) * r;
    }
}

export function clearParticles() { particles = []; }

/* ============================== RENDER ============================== */

export function render(drag) {
    updateCompass();
    updateTownShop();
    ctx.setTransform(view.dpr * view.scale, 0, 0, view.dpr * view.scale, 0, 0);
    ctx.clearRect(0, 0, view.vw, view.vh);

    // deep space backdrop across the whole canvas
    const bg = ctx.createLinearGradient(0, 0, 0, view.vh);
    bg.addColorStop(0, '#0a0618');
    bg.addColorStop(0.5, '#070a1c');
    bg.addColorStop(1, '#03040c');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, view.vw, view.vh);
    if (nebula) { ctx.globalAlpha = 0.9; ctx.drawImage(nebula, 0, 0, view.vw, view.vh); ctx.globalAlpha = 1; }

    // stars live in course coordinates (shifted by view offset below)
    ctx.save();
    if (S.mode === 'explore') {
        ctx.translate(view.vw / 2 - explore.camera.x, view.vh / 2 - explore.camera.y);
    } else {
        ctx.translate(view.vw / 2 - camera.x, view.vh / 2 - camera.y);
    }

    for (const st of stars) {
        const tw = 0.45 + 0.55 * Math.abs(Math.sin(S.time * st.sp + st.ph));
        ctx.globalAlpha = tw;
        ctx.fillStyle = '#cdd6ff';
        ctx.beginPath(); 
        if (S.mode === 'explore') {
            // Parallax wrapping for stars in explore mode
            const px = explore.camera.x - view.vw / 2;
            const py = explore.camera.y - view.vh / 2;
            let sx = (st.x - explore.camera.x * 0.1) % view.vw;
            if (sx < 0) sx += view.vw;
            let sy = (st.y - explore.camera.y * 0.1) % view.vh;
            if (sy < 0) sy += view.vh;
            ctx.arc(px + sx, py + sy, st.r, 0, 7);
        } else {
            // Parallax wrapping for stars in endless mode too
            const px = camera.x - view.vw / 2;
            const py = camera.y - view.vh / 2;
            let sx = (st.x - camera.x * 0.1) % view.vw;
            if (sx < 0) sx += view.vw;
            let sy = (st.y - camera.y * 0.1) % view.vh;
            if (sy < 0) sy += view.vh;
            ctx.arc(px + sx, py + sy, st.r, 0, 7);
        }
        ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();   // end stars (drawn at true scale, not affected by the zoom-out)

    // World layer — apply the STAB-2 temporary zoom-out about the screen centre.
    // view.zoom stays 1 in golf (bodies never big enough to trigger fitZoom).
    ctx.save();
    ctx.translate(view.vw / 2, view.vh / 2);
    ctx.scale(view.zoom, view.zoom);
    ctx.translate(-view.vw / 2, -view.vh / 2);
    if (S.mode === 'explore') {
        ctx.translate(view.vw / 2 - explore.camera.x, view.vh / 2 - explore.camera.y);
    } else {
        ctx.translate(view.vw / 2 - camera.x, view.vh / 2 - camera.y);
    }

    // Softer "lost in space" boundary (Golf Mode Catch-Up, 2026-07-19): the old
    // faint course-edge line was removed when the game went full-screen, leaving
    // no on-screen cue for where a flight actually gets rescued back to rest —
    // "unclear ... what the map size is." Golf only (Explore is an open chunked
    // world with no such rect); shown while the comet can actually cross it.
    if (S.mode !== 'explore' && (S.phase === 'flight' || S.phase === 'orbit')) drawCourseBoundary();

    // ORB-1: while flying with Orbit Magnet ON, every planet/black hole gets a
    // faint dashed capture-band ring — "these will catch you." Gated on mode +
    // phase + item so golf and item-OFF Explore never draw it.
    const showCaptureRings = S.mode === 'explore' && S.phase === 'flight' && S.inventory.orbitMagnet?.enabled;
    for (const b of world.bodies) {
        if (b.type === 'planet') { drawPlanet(b); drawPlanetLabel(b); }
        else if (b.type === 'pulsar') drawPulsar(b);
        else if (b.type === 'mine') drawMine(b);
        else if (b.type === 'trap') drawTrap(b);
        else if (b.type === 'blackhole') drawExploreBlackHole(b);
        else { drawTee(b); drawPlanetLabel(b); }
        if (showCaptureRings && (b.type === 'planet' || b.type === 'blackhole' || b.type === 'tee')) drawCaptureRing(b);
        if (S.mode === 'explore' && b.stardustRing) drawStardustRing(b);
    }
    if (world.blackHole) drawBlackHole();
    if (world.orbit) drawOrbitRing();

    if (world.pickups) {
        for (const p of world.pickups) drawPickup(p);
    }
    
    if (world.asteroids) {
        for (const a of world.asteroids) drawAsteroid(a);
    }

    if (S.phase === 'aiming' && drag) drawAim(drag);

    if (world.trail.length > 1) {
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < world.trail.length; i++) {
            const t = i / world.trail.length;
            ctx.globalAlpha = t * 0.5;
            ctx.fillStyle = '#ffcf8a';
            ctx.beginPath(); ctx.arc(world.trail[i].x, world.trail[i].y, COMET_R * 0.75 * t, 0, 7); ctx.fill();
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
    }

    ctx.globalCompositeOperation = 'lighter';
    for (const p of particles) {
        ctx.globalAlpha = Math.max(p.life / p.max, 0) * 0.9;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, 7); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;

    if (S.phase !== 'result' && S.phase !== 'roundover') drawComet();

    ctx.restore();

    // Drawn AFTER the world restore above: transform is back to setTransform(dpr·scale)
    // with no camera translate and no STAB-2 zoom — exactly the screen-anchored view-unit
    // space the floating stick wants (INV-3b), so the ring stays glued under the thumb.
    drawThrusterStick();
}

function drawPlanet(b) {
    // FUEL-2: refuel-station planets get a warm-green glow — same hue as the fuel
    // pickup (distinct from Town's gold) so routing toward one reads as a real
    // piloting choice, per Yev's "visually distinct" answer.
    if (b.refuelStation) {
        const pulse = 0.7 + 0.3 * Math.sin(S.time * 1.8);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.35 * pulse;
        const g0 = ctx.createRadialGradient(b.x, b.y, b.r * 0.5, b.x, b.y, b.r * 2.6);
        g0.addColorStop(0, '#20e657');
        g0.addColorStop(1, 'rgba(32,230,87,0)');
        ctx.fillStyle = g0;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 2.6, 0, 7); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.strokeStyle = 'rgba(32,230,87,0.6)';
        ctx.lineWidth = 0.35;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 0.6, 0, 7); ctx.stroke();
    }

    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = b.pal.base;
    ctx.lineWidth = 0.35;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 9, 0, 7); ctx.stroke();
    ctx.globalAlpha = 1;

    // OW-5: static ring arc drawn behind the body so the planet occludes its
    // middle band, Saturn-style. Purely cosmetic — never touches physics.
    if (b.ring) drawRing(b);

    const g = ctx.createRadialGradient(b.x - b.r * 0.35, b.y - b.r * 0.4, b.r * 0.15, b.x, b.y, b.r);
    g.addColorStop(0, b.pal.base);
    g.addColorStop(1, b.pal.dark);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill();

    ctx.save();
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.clip();
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = '#000';
    for (let i = 0; i < 3; i++) {
        ctx.lineWidth = b.r * 0.18;
        ctx.beginPath();
        ctx.arc(b.x, b.y + b.r * (i - 1) * 0.55, b.r * 1.25, Math.PI * 0.15 + b.spin, Math.PI * 0.85 + b.spin);
        ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;

    // OW-5: moon orbiting at a fixed radius/period — position is a pure function
    // of the cosmetic clock (S.time), not physics-stepped, so it never interacts
    // with gravity/collision.
    if (b.moon) drawMoon(b);
}

function drawPlanetLabel(b) {
    const isOrbited = S.phase === 'orbit' && world.orbit && world.orbit.b === b;
    if (S.mode !== 'explore' || (!b.tapped && !isOrbited)) return;
    
    // Persistent on-planet label (Q5): MAP-2 style two-tap confirm chrome
    let txt = '';
    let yOffset = 0;
    if (S.phase === 'rest' && comet.rest && comet.rest.b === b) {
        txt = '🧲 Tap to orbit';
        yOffset = -b.r - COMET_R - 10;
    } else if (S.phase === 'orbit' && world.orbit && world.orbit.b === b) {
        txt = '🪐 Tap to land';
        yOffset = -world.orbit.radius - 15;
    } else {
        return;
    }

    ctx.save();
    ctx.translate(b.x, b.y + yOffset); // positioned just above the comet/orbit
    
    // Since view transform includes zooming and scaling, we draw at scale but prevent it from getting too tiny
    // Actually, text should scale with the world, but let's just draw it simple
    ctx.font = '500 4px "Inter", sans-serif';
    const m = ctx.measureText(txt);
    const w = m.width + 6, h = 7;
    
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.roundRect(-w/2, -h/2, w, h, 3);
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 0.3;
    ctx.stroke();
    
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(txt, 0, 0.4);
    
    ctx.restore();
}

function drawRing(b) {
    const ring = b.ring;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.scale(1, ring.tilt);
    ctx.strokeStyle = b.pal.base;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = Math.max(0.8, b.r * 0.1);
    ctx.beginPath();
    ctx.arc(0, 0, ring.radius, ring.arcStart, ring.arcStart + ring.arcLen);
    ctx.stroke();
    ctx.restore();
    ctx.globalAlpha = 1;
}

function drawMoon(b) {
    const m = b.moon;
    const pos = moonPosition(b.x, b.y, m, S.time);
    const g = ctx.createRadialGradient(pos.x - m.size * 0.3, pos.y - m.size * 0.3, m.size * 0.15, pos.x, pos.y, m.size);
    g.addColorStop(0, m.pal.base);
    g.addColorStop(1, m.pal.dark);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(pos.x, pos.y, m.size, 0, 7); ctx.fill();
}

function drawPulsar(b) {
    const pulse = 0.6 + 0.4 * Math.sin(S.time * 5);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.16 * pulse;
    ctx.fillStyle = '#aee6ff';
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 4, 0, 7); ctx.fill();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = '#eaf8ff';
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill();
    ctx.strokeStyle = '#aee6ff';
    ctx.lineWidth = 0.3;
    ctx.globalAlpha = 0.5 * pulse;
    for (let i = 0; i < 6; i++) {
        const a = S.time * 0.8 + i * Math.PI / 3;
        ctx.beginPath();
        ctx.moveTo(b.x + Math.cos(a) * b.r * 1.4, b.y + Math.sin(a) * b.r * 1.4);
        ctx.lineTo(b.x + Math.cos(a) * b.r * 2.6, b.y + Math.sin(a) * b.r * 2.6);
        ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
}

function drawMine(b) {
    ctx.fillStyle = '#cc2929';
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill();
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 0.4;
    for (let i = 0; i < 8; i++) {
        const a = i * Math.PI / 4 + S.time * 0.5;
        ctx.beginPath();
        ctx.moveTo(b.x + Math.cos(a) * b.r, b.y + Math.sin(a) * b.r);
        ctx.lineTo(b.x + Math.cos(a) * (b.r + 0.8), b.y + Math.sin(a) * (b.r + 0.8));
        ctx.stroke();
    }
}

function drawTrap(b) {
    ctx.globalCompositeOperation = 'lighter';
    const pulse = 0.7 + 0.3 * Math.sin(S.time * 4);
    ctx.globalAlpha = 0.15 * pulse;
    ctx.fillStyle = '#9933ff';
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 5, 0, 7); ctx.fill();
    
    ctx.globalAlpha = 0.8;
    const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
    g.addColorStop(0, '#000000');
    g.addColorStop(0.7, '#4a0080');
    g.addColorStop(1, '#9933ff');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill();
    
    ctx.strokeStyle = '#d480ff';
    ctx.lineWidth = 0.4;
    ctx.globalAlpha = 0.6 * pulse;
    for (let i = 0; i < 3; i++) {
        const a = -S.time * 3 + i * Math.PI * 2 / 3;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r * 1.6, a, a + Math.PI * 0.7);
        ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
}

function drawTee(b) {
    // Town beacon (EXP-1e): in Explore, the tee rock is a persistent, named place
    // (Town, the Fuel/Siphon/Sensor shop's home) rather than a fresh per-hole tee,
    // so it gets a distinct warm glow — visible whether or not the shop panel is
    // open, and independent of it (purely cosmetic, no state). Golf/editor tees
    // (same drawTee, same 'tee' type) are a new spot every hole and stay plain.
    const isTown = S.mode === 'explore';
    if (isTown) {
        const pulse = 0.7 + 0.3 * Math.sin(S.time * 1.4);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.35 * pulse;
        const g = ctx.createRadialGradient(b.x, b.y, b.r * 0.5, b.x, b.y, b.r * 3.2);
        g.addColorStop(0, '#ffd98a');
        g.addColorStop(1, 'rgba(255,217,138,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 3.2, 0, 7); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
    }

    ctx.fillStyle = '#6b6b80';
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill();
    ctx.fillStyle = '#54546a';
    ctx.beginPath(); ctx.arc(b.x - b.r * 0.3, b.y + b.r * 0.2, b.r * 0.3, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(b.x + b.r * 0.35, b.y - b.r * 0.25, b.r * 0.2, 0, 7); ctx.fill();

    if (isTown) {
        ctx.strokeStyle = 'rgba(255,217,138,0.6)';
        ctx.lineWidth = 0.35;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 0.6, 0, 7); ctx.stroke();
    }
}

function drawAsteroid(b) {
    ctx.fillStyle = '#806b6b';
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill();
    ctx.fillStyle = '#5c4d4d';
    ctx.beginPath(); ctx.arc(b.x - b.r * 0.3, b.y + b.r * 0.2, b.r * 0.4, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(b.x + b.r * 0.35, b.y - b.r * 0.25, b.r * 0.3, 0, 7); ctx.fill();
}

// ORB-4 color language: stardust reads gold (matches the stardust-burst/Town
// glow), fuel stays green — previously every pickup drew green regardless of
// type (the "color-code fuel vs. stardust" backlog line this item folds in).
function drawPickup(p) {
    const pulse = 0.7 + 0.3 * Math.sin(S.time * 6 + p.x);
    const isStardust = p.type === 'stardust';
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.5 * pulse;
    ctx.fillStyle = isStardust ? '#ffd98a' : '#20e657';
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 2.8, 0, 7); ctx.fill();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = isStardust ? '#fff3d0' : '#b3ffc7';
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
}

// ORB-4: faint gold guide arc through a body's stardust ring, so it reads as a
// coherent halo from a distance instead of a scatter of dots — distinct from
// OW-5's decorative palette-colored moons/rings (drawRing/drawMoon above),
// which are cosmetic only and never pickups. Always shown in Explore (not
// gated on the magnet item) as the discoverability affordance for the ring.
function drawStardustRing(b) {
    const pulse = 0.5 + 0.3 * Math.sin(S.time * 2);
    ctx.globalAlpha = 0.18 * pulse;
    ctx.strokeStyle = '#ffd98a';
    ctx.lineWidth = 0.3;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.stardustRing.radius, 0, 7); ctx.stroke();
    ctx.globalAlpha = 1;
}

// Faint dashed rect at the real out-of-bounds threshold (OB_MARGIN past the
// course rect) — the boundary a flight actually gets rescued at, made legible
// instead of invisible. See the call site for why this exists.
function drawCourseBoundary() {
    // MM-6: bounds follow the active map's size tier — always the small/golf default
    // outside editor/custom modes, so golf and endless render byte-identical to before.
    const { w: bw, h: bh } = mapBounds(world.mapSizeKey);
    const pulse = 0.5 + 0.5 * Math.sin(S.time * 1.6);
    ctx.globalAlpha = 0.1 + 0.06 * pulse;
    ctx.strokeStyle = '#9fe3d8';
    ctx.lineWidth = 0.4;
    ctx.setLineDash([2.4, 2.8]);
    ctx.strokeRect(-OB_MARGIN, -OB_MARGIN, bw + OB_MARGIN * 2, bh + OB_MARGIN * 2);
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
}

// Faint dashed ring on the planet the comet is orbiting — the "you're in orbit,
// flick to break away" affordance (BH-4). Shown while orbiting and while aiming out.
function drawOrbitRing() {
    const o = world.orbit;
    const pulse = 0.55 + 0.45 * Math.sin(S.time * 4);
    ctx.globalAlpha = 0.4 * pulse;
    ctx.strokeStyle = '#9fe3d8';
    ctx.lineWidth = 0.3;
    ctx.setLineDash([1.2, 1.8]);
    ctx.beginPath(); ctx.arc(o.b.x, o.b.y, o.radius, 0, 7); ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
}

// ORB-1: faint dashed ring at the Orbit Magnet capture band's mid-radius, drawn
// around every planet/black hole while flying with the item ON — "these will
// catch you." One arc stroke per visible body; no per-body allocation.
function drawCaptureRing(b) {
    const r = b.r + COMET_R + (ORBIT_MIN_GAP + ORBIT_MAX_GAP) / 2;
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = '#9fe3d8';
    ctx.lineWidth = 0.25;
    ctx.setLineDash([1, 2.2]);
    ctx.beginPath(); ctx.arc(b.x, b.y, r, 0, 7); ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
}

// Shared black-hole render: the accretion glow/rings + event horizon + a dashed
// capture-radius ring. `captureR` is the ring's radius, in world units — golf's
// singleton passes CAPTURE_R (the sink radius); Explore's seeded body-list black
// holes (OW-3) pass their own warp radius so the ring reads at the right scale for
// a body many times CAPTURE_R's size.
function drawBlackHoleBody(b, captureR) {
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(b.x, b.y, b.r * 0.6, b.x, b.y, b.r * 3.2);
    g.addColorStop(0, 'rgba(255,150,60,0.55)');
    g.addColorStop(0.45, 'rgba(255,90,40,0.14)');
    g.addColorStop(1, 'rgba(255,90,40,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 3.2, 0, 7); ctx.fill();
    for (let i = 0; i < 2; i++) {
        const a0 = S.time * (1.2 + i * 0.7) + i * 2.4;
        ctx.strokeStyle = i ? 'rgba(255,220,150,0.8)' : 'rgba(255,160,80,0.6)';
        ctx.lineWidth = 0.5 - i * 0.15;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r * (1.5 + i * 0.35), a0, a0 + Math.PI * 1.4);
        ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(255,200,130,0.55)';
    ctx.lineWidth = 0.28;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 0.3, 0, 7); ctx.stroke();
    ctx.globalAlpha = 0.12;
    ctx.setLineDash([1, 1.6]);
    ctx.strokeStyle = '#ffd98a';
    ctx.beginPath(); ctx.arc(b.x, b.y, captureR, 0, 7); ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
}

function drawBlackHole() { drawBlackHoleBody(world.blackHole, CAPTURE_R); }

// OW-3: a seeded Explore black hole — same visual as golf's, ringed at its own warp
// radius (much bigger than golf's CAPTURE_R, since this body is r=22 vs golf's r=3.2).
function drawExploreBlackHole(b) { drawBlackHoleBody(b, b.r * 0.3); }

function drawComet() {
    if (S.phase === 'rest' || (S.phase === 'aiming' && S.prevPhase !== 'flight')) {
        const p = 0.5 + 0.5 * Math.sin(S.time * 3);
        ctx.globalAlpha = 0.25 * p;
        ctx.strokeStyle = '#00e5a0';
        ctx.lineWidth = 0.3;
        ctx.beginPath(); ctx.arc(comet.x, comet.y, COMET_R + 1.6 + p * 0.7, 0, 7); ctx.stroke();
        ctx.globalAlpha = 1;
    }
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(comet.x, comet.y, 0, comet.x, comet.y, COMET_R * 2.6);
    g.addColorStop(0, 'rgba(255,255,240,1)');
    g.addColorStop(0.35, 'rgba(255,210,140,0.6)');
    g.addColorStop(1, 'rgba(255,180,90,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(comet.x, comet.y, COMET_R * 2.6, 0, 7); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#fffbe8';
    ctx.beginPath(); ctx.arc(comet.x, comet.y, COMET_R * 0.8, 0, 7); ctx.fill();
}

function drawAim(drag) {
    const dx = drag.sx - drag.cx, dy = drag.sy - drag.cy;
    const len = Math.hypot(dx, dy);
    if (len < 1) return;
    const pow = Math.min(len / MAX_DRAG, 1);
    const speed = pow * MAX_LAUNCH;

    // short honest preview — same integrator, ~0.55s ahead (questionnaire Q2: right as is).
    // The flick is an impulse ADDED to current velocity: 0 at rest (unchanged tee
    // preview), the orbital velocity when flicking out of an orbit (BH-4).
    if (speed >= MIN_SHOT) {
        const ghost = { x: comet.x, y: comet.y,
                        vx: comet.vx + dx / len * speed, vy: comet.vy + dy / len * speed };
        // Honest preview of the STAB-1 liftoff grace: if this flick will take off
        // from a planet surface, damp that planet's pull the same way stepFlight will.
        const liftBody = (!world.orbit && comet.rest && comet.rest.b && comet.rest.b.type === 'planet')
            ? comet.rest.b : null;
        let liftT = liftBody ? LIFTOFF_T : 0;
        ctx.fillStyle = '#ffffff';
        let alive = true;
        for (let i = 0; i < 132 && alive; i++) {
            let damp = null;
            if (liftT > 0) {
                liftT = Math.max(0, liftT - DT);
                const k = 1 - liftT / LIFTOFF_T;
                damp = { body: liftBody, factor: LIFTOFF_MIN + (1 - LIFTOFF_MIN) * k };
            }
            const r = stepBody(ghost, DT, world.bodies, world.blackHole, damp);
            if (r) alive = false;
            if (i % 11 === 5) {
                ctx.globalAlpha = 0.55 * (1 - i / 150);
                ctx.beginPath(); ctx.arc(ghost.x, ghost.y, 0.45, 0, 7); ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
    }

    const ux = dx / len, uy = dy / len;
    const alen = 4 + pow * 12;
    const hx = comet.x + ux * alen, hy = comet.y + uy * alen;
    const cr = pow < 0.55 ? '0,229,160' : (pow < 0.85 ? '255,217,138' : '255,110,80');
    ctx.strokeStyle = `rgba(${cr},0.9)`;
    ctx.lineWidth = 0.7;
    ctx.beginPath(); ctx.moveTo(comet.x + ux * (COMET_R + 1), comet.y + uy * (COMET_R + 1)); ctx.lineTo(hx, hy); ctx.stroke();
    const wing = Math.atan2(uy, ux);
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(hx - Math.cos(wing - 0.45) * 2.2, hy - Math.sin(wing - 0.45) * 2.2);
    ctx.moveTo(hx, hy);
    ctx.lineTo(hx - Math.cos(wing + 0.45) * 2.2, hy - Math.sin(wing + 0.45) * 2.2);
    ctx.stroke();
}

// Floating thrust stick (INV-3b, T5/T9/T10): a translucent ring at the touch origin
// plus a nub at the current point, tinted green→gold→red by throttle like drawAim()'s
// power ramp above. No aim arrow or trajectory preview here — T10 says the trail is
// enough, and drawAim() itself never runs while the Thruster replaces the flick (see
// main.js's canAim gating).
function drawThrusterStick() {
    if (stickAlpha <= 0.01 || !lastStickPos) return;
    const { ox, oy, cx, cy } = lastStickPos;
    const dx = cx - ox, dy = cy - oy;
    const d = Math.hypot(dx, dy);
    const throttle = d > 0 ? explore.stickThrottle(d * view.scale) : 0;
    const ringR = STICK_R_PX / view.scale; // fixed CSS-px radius regardless of view.scale
    const clamped = Math.min(d, ringR);
    const ang = Math.atan2(dy, dx);
    const nubX = d > 0 ? ox + Math.cos(ang) * clamped : ox;
    const nubY = d > 0 ? oy + Math.sin(ang) * clamped : oy;
    const cr = throttle < 0.55 ? '0,229,160' : (throttle < 0.85 ? '255,217,138' : '255,110,80');

    ctx.save();
    ctx.globalAlpha = stickAlpha * 0.6;
    ctx.strokeStyle = `rgba(${cr},0.8)`;
    ctx.lineWidth = 0.4;
    ctx.beginPath(); ctx.arc(ox, oy, ringR, 0, 7); ctx.stroke();

    ctx.globalAlpha = stickAlpha * 0.9;
    ctx.fillStyle = `rgba(${cr},0.95)`;
    ctx.beginPath(); ctx.arc(nubX, nubY, ringR * 0.32, 0, 7); ctx.fill();
    ctx.restore();
}

/* ============================== DOM CHROME ============================== */

let toastTimer = null;
export function toast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 1700);
}

// chip(null) hides; chip(labelObj, subText) shows.
export function chip(lab, sub) {
    const el = document.getElementById('chip');
    if (!lab) { el.classList.remove('show'); return; }
    const big = el.querySelector('.big');
    big.textContent = lab.label;
    big.classList.toggle('ace', lab.ace);
    el.querySelector('.sub').textContent = sub;
    el.classList.add('show');
}

function setFuelBar(id, f) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.width = Math.max(0, f) + '%';
    el.classList.toggle('low', f <= 40 && f > 15);
    el.classList.toggle('critical', f <= 15);
}

function getRegionName(x, y) {
    const d = Math.hypot(x - 50, y - 85);
    if (d < 300) return 'The Shallows';
    if (d < 1000) return 'Asteroid Belt';
    if (d < 2500) return 'Outer Rim';
    return 'Deep Space';
}

export function updateBar() {
    if (S.mode === 'editor') {
        // MM-16: the Overview control only has something to offer on a large map —
        // on golf-scale the 1:1 view already shows the whole course, so hide rather
        // than show a no-op button.
        const btn = document.getElementById('ed-overview');
        if (btn) btn.classList.toggle('hidden', !overviewAvailable(world.mapSizeKey));
        return;
    }
    if (S.mode === 'explore') {
        setFuelBar('exploreFuelBar', explore.fuel);
        document.getElementById('exploreStardust').textContent = S.stardust;
        document.getElementById('exploreCoords').textContent = `X: ${Math.round(comet.x)} Y: ${Math.round(comet.y)}`;
        document.getElementById('exploreRegion').textContent = getRegionName(comet.x, comet.y);
        return;
    }
    if (S.mode === 'endless') {
        setFuelBar('endlessFuelBar', S.fuel);
        document.getElementById('endlessStardust').textContent = S.stardust;
    }
    const holeTxt = 'HOLE ' + S.hole;
    document.getElementById('holeNo').textContent = holeTxt;
    document.getElementById('parLbl').textContent = '· PAR ' + S.par;
    document.getElementById('strokes').textContent = S.strokes;
    const tot = document.getElementById('total');
    tot.textContent = fmtDiff(S.totalDiff);
    tot.classList.toggle('under', S.totalDiff < 0);
    tot.classList.toggle('over', S.totalDiff > 0);
}

export function showScorecard(result, best, isNewBest) {
    const el = document.getElementById('scorecard');
    document.getElementById('sc-total').textContent = fmtDiff(result.total);
    document.getElementById('sc-total').className = result.total < 0 ? 'under' : (result.total > 0 ? 'over' : '');
    document.getElementById('sc-best').textContent = isNewBest
        ? '🏆 NEW BEST ROUND!'
        : (best === null ? '' : `Best round: ${fmtDiff(best)}`);
    const hops = result.card.filter(h => h.hopped).length;
    document.getElementById('sc-hops').textContent = hops > 0 ? `🪐 ${hops} planet-hop hole${hops === 1 ? '' : 's'}` : '';
    const grid = document.getElementById('sc-grid');
    grid.innerHTML = result.card.map(h => {
        const d = h.strokes - h.par;
        const cls = d < 0 ? 'under' : (d > 0 ? 'over' : '');
        return `<div class="sc-cell"><div class="sc-h">${h.hole}</div>` +
               `<div class="sc-s ${cls}">${h.strokes}</div>` +
               `<div class="sc-p">par ${h.par}${h.hopped ? ' 🪐' : ''}</div></div>`;
    }).join('');
    el.classList.remove('hidden');
}

export function showSurvivalGameOver(level) {
    document.getElementById('survGameOver').classList.remove('hidden');
    document.getElementById('sg-level').textContent = 'Reached Level ' + level;
}

export function hideSurvivalGameOver() {
    document.getElementById('survGameOver').classList.add('hidden');
}

export function hideScorecard() {
    document.getElementById('scorecard').classList.add('hidden');
}

/* ============================== OW-9: zoom-out star map (fog-of-war) ============================== */
// A snapshot overlay, not a per-frame render loop: showStarMap() pauses the run
// (reusing the settingsOpened/settingsClosed contract shared/settings.js documents
// as generic "game should pause"/"game should resume" events, already wired in
// main.js) so nothing moves while the map is open — one renderStarMap() call at
// open time stays accurate for as long as it's up.

let starMapOpen = false;

// MAP-2: fast travel. `mapTargets` is the screen-space hit list the last
// renderStarMap() call produced (Town + discovered black holes only — stations are
// informational, not travel targets); `selectedTarget` drives the two-tap confirm
// (first tap selects, second tap or the Go button travels).
let mapTargets = [];
let selectedTarget = null;

export function showStarMap() {
    if (starMapOpen) return;
    starMapOpen = true;
    selectedTarget = null;
    document.getElementById('starMap').classList.remove('hidden');
    window.dispatchEvent(new Event('settingsOpened'));
    renderStarMap();
}

export function hideStarMap() {
    if (!starMapOpen) return;
    starMapOpen = false;
    selectedTarget = null;
    document.getElementById('starMap').classList.add('hidden');
    window.dispatchEvent(new Event('settingsClosed'));
}

export function toggleStarMap() {
    if (starMapOpen) hideStarMap(); else showStarMap();
}

function travelToTarget(t) {
    hideStarMap();
    if (t.kind === 'town') explore.arriveAtTown();
    else explore.travelToBlackHole(t.id, t.wx, t.wy);
}

// Canvas tap handler (screen-space CSS px, same coordinate system renderStarMap()
// draws in). A tap that misses every target deselects. A tap on the currently
// selected target travels; any other tap (including a different target) selects it —
// this is the "no accidental warps" guard the build plan calls for.
export function handleStarMapTap(mx, my) {
    const hit = hitTestMapTargets(mx, my, mapTargets);
    if (!hit) {
        selectedTarget = null;
        renderStarMap();
        return;
    }
    if (selectedTarget && selectedTarget.id === hit.id) {
        travelToTarget(hit);
        return;
    }
    selectedTarget = hit;
    renderStarMap();
}

// Wired to the #sm-travel-go button — same action as a confirming second tap.
export function confirmStarMapTravel() {
    if (selectedTarget) travelToTarget(selectedTarget);
}

function updateStarMapPrompt() {
    const el = document.getElementById('sm-travel');
    if (!el) return;
    if (!selectedTarget) { el.classList.add('hidden'); return; }
    const label = selectedTarget.kind === 'town' ? '⌂ Town' : '⚫ Black hole';
    el.querySelector('.sm-travel-label').textContent = `${label} — Travel?`;
    el.classList.remove('hidden');
}

function renderStarMap() {
    const cv = document.getElementById('starMapCanvas');
    if (!cv) return;
    const cw = cv.clientWidth, ch = cv.clientHeight;
    if (cw <= 0 || ch <= 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(cw * dpr);
    cv.height = Math.round(ch * dpr);
    const sctx = cv.getContext('2d');
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sctx.fillStyle = '#05060f';
    sctx.fillRect(0, 0, cw, ch);

    // MAP-2: rebuilt fresh on every render — this IS the render, so any target
    // whose position moved or discovery state changed (e.g. a chunk loaded between
    // opens) is never stale by construction.
    mapTargets = [];
    const MIN_HIT_R = 22; // CSS px — minimum touch target, per the build plan

    // Grid spans the full bounded sector (OW-2's SECTOR_LIMIT) plus a chunk of
    // margin, in chunk units — same floor(x/CHUNK_SIZE) math as explore.js.
    const radius = Math.ceil(explore.SECTOR_LIMIT / explore.CHUNK_SIZE) + 1;
    const cells = radius * 2 + 1;
    const cell = Math.min(cw, ch) / cells;
    const ox = (cw - cell * cells) / 2;
    const oy = (ch - cell * cells) / 2;

    for (let gx = -radius; gx <= radius; gx++) {
        for (let gy = -radius; gy <= radius; gy++) {
            const discovered = explore.discoveredChunks.has(gx + '_' + gy);
            sctx.fillStyle = discovered ? 'rgba(154,154,200,0.45)' : 'rgba(255,255,255,0.04)';
            sctx.fillRect(ox + (gx + radius) * cell, oy + (gy + radius) * cell, Math.max(1, cell - 1), Math.max(1, cell - 1));
        }
    }

    // MAP-1: landmarks (black holes + refuel stations) on every discovered chunk.
    // Cached per-open in a plain Map, keyed by chunk, so a future interactive
    // re-render (MAP-3's pan/zoom) doesn't re-derive the same seeded body list on
    // every frame — this call site is still snapshot/once-per-open today, the
    // cache just makes that guarantee cheap to keep once re-renders exist.
    const landmarkCache = new Map();
    for (const key of explore.discoveredChunks) {
        const [gx, gy] = key.split('_').map(Number);
        if (Math.abs(gx) > radius || Math.abs(gy) > radius) continue;
        let landmarks = landmarkCache.get(key);
        if (!landmarks) {
            landmarks = explore.chunkLandmarks(gx, gy, explore.worldSeed);
            landmarkCache.set(key, landmarks);
        }
        for (const lm of landmarks) {
            // Sub-cell position from the landmark's actual world coords (not just
            // the cell center) so a chunk with both kinds doesn't draw them stacked.
            const fx = (lm.x - gx * explore.CHUNK_SIZE) / explore.CHUNK_SIZE;
            const fy = (lm.y - gy * explore.CHUNK_SIZE) / explore.CHUNK_SIZE;
            const px = ox + (gx + radius) * cell + fx * cell;
            const py = oy + (gy + radius) * cell + fy * cell;
            if (lm.kind === 'blackhole') {
                const r = Math.max(2.4, cell * 0.24);
                const g = sctx.createRadialGradient(px, py, 0, px, py, r * 2.4);
                g.addColorStop(0, 'rgba(220,180,255,0.85)');
                g.addColorStop(0.5, 'rgba(160,100,255,0.35)');
                g.addColorStop(1, 'rgba(160,100,255,0)');
                sctx.fillStyle = g;
                sctx.beginPath(); sctx.arc(px, py, r * 2.4, 0, 7); sctx.fill();
                sctx.fillStyle = '#f0e6ff';
                sctx.beginPath(); sctx.arc(px, py, r, 0, 7); sctx.fill();
                // MAP-2: only discovered black holes reach here (this loop only runs
                // over explore.discoveredChunks) — stations stay informational-only,
                // never pushed as a travel target.
                mapTargets.push({ kind: 'blackhole', id: lm.id, x: px, y: py, r: Math.max(MIN_HIT_R, r * 2.4), wx: lm.x, wy: lm.y });
            } else {
                sctx.fillStyle = '#20e657';
                sctx.beginPath(); sctx.arc(px, py, Math.max(1.6, cell * 0.14), 0, 7); sctx.fill();
            }
        }
    }

    // Town — a fixed landmark, always shown regardless of fog (distinct from the
    // "chunks flown through" discovery rule below it).
    const townGX = Math.floor(50 / explore.CHUNK_SIZE);
    const townGY = Math.floor(85 / explore.CHUNK_SIZE);
    const townPX = ox + (townGX + radius) * cell + cell / 2;
    const townPY = oy + (townGY + radius) * cell + cell / 2;
    const townR = Math.max(3, cell * 0.3);
    sctx.fillStyle = '#ffd98a';
    sctx.beginPath();
    sctx.arc(townPX, townPY, townR, 0, 7);
    sctx.fill();
    mapTargets.push({ kind: 'town', id: 'town', x: townPX, y: townPY, r: Math.max(MIN_HIT_R, townR) });

    // Comet — a snapshot of where you were the moment the map was opened (the run
    // is paused for as long as it stays up, so this never goes stale).
    const cometGX = Math.floor(comet.x / explore.CHUNK_SIZE);
    const cometGY = Math.floor(comet.y / explore.CHUNK_SIZE);
    if (Math.abs(cometGX) <= radius && Math.abs(cometGY) <= radius) {
        sctx.fillStyle = '#00e5a0';
        sctx.beginPath();
        sctx.arc(ox + (cometGX + radius) * cell + cell / 2, oy + (cometGY + radius) * cell + cell / 2, Math.max(2.5, cell * 0.2), 0, 7);
        sctx.fill();
    }

    // MAP-2: selection highlight — re-find the freshly-rebuilt target matching the
    // previously selected id/kind (not the stale object itself, in case its screen
    // position moved between renders) so re-selecting after a redraw still rings
    // the right spot.
    if (selectedTarget) {
        const current = mapTargets.find(t => t.kind === selectedTarget.kind && t.id === selectedTarget.id);
        if (current) {
            selectedTarget = current;
            sctx.strokeStyle = '#00e5a0';
            sctx.lineWidth = 2;
            sctx.setLineDash([5, 4]);
            sctx.beginPath();
            sctx.arc(current.x, current.y, current.r, 0, 7);
            sctx.stroke();
            sctx.setLineDash([]);
        } else {
            selectedTarget = null; // target vanished (shouldn't happen mid-open, but don't point at nothing)
        }
    }
    updateStarMapPrompt();
}

/* ============================== MM-16: editor overview mode ============================== */
// Full-canvas coarse-placement view for the map editor. Visually similar to
// renderStarMap() (dark bg, fitted-to-container, simplified glyphs) but its own
// function — the data source is world.bodies/world.teeRock/world.blackHole, not
// explore's fog-of-war chunk discovery, and there's no travel/selection state.
// Snapshot-refreshed on open and on every drag tick (not a continuous animation
// loop) — editor 'edit' phase has nothing else moving, same rationale as the star
// map's once-per-open render.

let overviewOpen = false;
// Cached on every render; overviewEventToWorld() uses it to convert the next
// pointer event back to world coords, so a drag always maps through the exact
// transform its own frame was drawn with.
let overviewT = { scale: 1, ox: 0, oy: 0 };

export function isEditorOverviewOpen() { return overviewOpen; }

export function showEditorOverview() {
    if (overviewOpen) return;
    if (S.mode !== 'editor' || S.phase !== 'edit' || !overviewAvailable(world.mapSizeKey)) return;
    overviewOpen = true;
    document.getElementById('editorOverview').classList.remove('hidden');
    window.dispatchEvent(new Event('settingsOpened'));
    renderEditorOverview();
}

export function hideEditorOverview() {
    if (!overviewOpen) return;
    overviewOpen = false;
    document.getElementById('editorOverview').classList.add('hidden');
    window.dispatchEvent(new Event('settingsClosed'));
}

export function toggleEditorOverview() {
    if (overviewOpen) hideEditorOverview(); else showEditorOverview();
}

// Canvas-relative CSS px → world coords, same contract as toWorld() for the main
// canvas — used by main.js's pointer handlers on #editorOverviewCanvas so they can
// feed editor.js's existing (world-coordinate) pointerDown/Move/Up unchanged.
export function overviewEventToWorld(e) {
    const cv = document.getElementById('editorOverviewCanvas');
    const rect = cv.getBoundingClientRect();
    const p = overviewToWorld(e.clientX - rect.left, e.clientY - rect.top, overviewT);
    return [p.x, p.y];
}

export function renderEditorOverview() {
    const cv = document.getElementById('editorOverviewCanvas');
    if (!cv) return;
    const cw = cv.clientWidth, ch = cv.clientHeight;
    if (cw <= 0 || ch <= 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.round(cw * dpr);
    cv.height = Math.round(ch * dpr);
    const octx = cv.getContext('2d');
    octx.setTransform(dpr, 0, 0, dpr, 0, 0);
    octx.fillStyle = '#05060f';
    octx.fillRect(0, 0, cw, ch);

    const { w, h } = mapBounds(world.mapSizeKey);
    overviewT = overviewTransform(w, h, cw, ch);
    const t = overviewT;

    // Fitted grid, legibility over fidelity — same call as the star map's fog grid.
    const GRID = 20; // world units per line
    octx.strokeStyle = 'rgba(255,255,255,0.07)';
    octx.lineWidth = 1;
    octx.beginPath();
    for (let gx = 0; gx <= w; gx += GRID) {
        const p0 = worldToOverview(gx, 0, t);
        octx.moveTo(p0.x, t.oy); octx.lineTo(p0.x, t.oy + h * t.scale);
    }
    for (let gy = 0; gy <= h; gy += GRID) {
        const p0 = worldToOverview(0, gy, t);
        octx.moveTo(t.ox, p0.y); octx.lineTo(t.ox + w * t.scale, p0.y);
    }
    octx.stroke();
    octx.strokeStyle = 'rgba(255,255,255,0.2)';
    octx.strokeRect(t.ox, t.oy, w * t.scale, h * t.scale);

    // Bodies as simplified glyphs (dot + color) at overview scale — full 1:1
    // detail (spin shading, pulsar rays) isn't legible at this zoom anyway.
    for (const b of world.bodies) {
        const p = worldToOverview(b.x, b.y, t);
        if (b.type === 'planet') {
            octx.fillStyle = b.pal ? b.pal.base : '#e2725b';
            octx.beginPath(); octx.arc(p.x, p.y, Math.max(3, b.r * t.scale), 0, 7); octx.fill();
        } else if (b.type === 'pulsar') {
            octx.fillStyle = '#ffd24a';
            octx.beginPath(); octx.arc(p.x, p.y, Math.max(3, 2.6 * t.scale), 0, 7); octx.fill();
        } else if (b.type === 'tee') {
            octx.fillStyle = '#8fb8ff';
            octx.beginPath(); octx.arc(p.x, p.y, Math.max(3, b.r * t.scale), 0, 7); octx.fill();
        }
    }
    if (world.blackHole) {
        const bh = world.blackHole;
        const p = worldToOverview(bh.x, bh.y, t);
        const glowR = Math.max(6, bh.r * t.scale * 2.4);
        const g = octx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
        g.addColorStop(0, 'rgba(220,180,255,0.85)');
        g.addColorStop(0.5, 'rgba(160,100,255,0.35)');
        g.addColorStop(1, 'rgba(160,100,255,0)');
        octx.fillStyle = g;
        octx.beginPath(); octx.arc(p.x, p.y, glowR, 0, 7); octx.fill();
        octx.fillStyle = '#f0e6ff';
        octx.beginPath(); octx.arc(p.x, p.y, Math.max(3, bh.r * t.scale), 0, 7); octx.fill();
    }
}

/* ============================== ☰ MENU TABS (HUD-1/HUD-2) ============================== */
// Settings + Inventory used to be sections in the shared arcade-settings drawer
// (gear icon, cross-game chrome); HUD-1 folded them into this game's own #howto
// overlay as tabs alongside Play. HUD-2 merged the separate Settings/Inventory
// tabs into a single Settings tab — inventory rows still gate on S.mode ===
// 'explore', just as a section within Settings rather than their own tab — and
// gave #howto a fixed-position header (see style.css) so switching tabs never
// visibly moves the tab bar or close button.

let howtoTab = 'play';

function renderHowtoTabs() {
    document.querySelectorAll('#howtoTabs .howto-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === howtoTab);
    });
    document.getElementById('howtoPanelPlay').classList.toggle('hidden', howtoTab !== 'play');
    document.getElementById('howtoPanelSettings').classList.toggle('hidden', howtoTab !== 'settings');

    if (howtoTab === 'settings') renderHowtoSettingsPanel();
}

export function showHowtoTab(tab) {
    howtoTab = tab;
    renderHowtoTabs();
}

export function isHowtoPlayTab() { return howtoTab === 'play'; }

function renderHowtoSettingsPanel() {
    const panel = document.getElementById('howtoPanelSettings');
    // Inventory is Explore-only, matching the old drawer section's `when` gate.
    const inventoryRows = S.mode === 'explore' ? `
        <span class="mode-head">🎒 Inventory</span>
        ${ITEMS.map(item => `
        <label class="howto-toggle-row">
            <span>${item.icon} ${item.label}<br><small>${item.desc}</small></span>
            <input type="checkbox" data-item="${item.key}" ${S.inventory[item.key]?.enabled ? 'checked' : ''}>
        </label>`).join('')}` : '';
    panel.innerHTML = `
        <label class="howto-toggle-row">
            <span>Sound effects</span>
            <input type="checkbox" id="bhSoundToggle" ${isMuted() ? '' : 'checked'}>
        </label>
        <label class="howto-toggle-row">
            <span>Freeze mid-flight aim (Explore)</span>
            <input type="checkbox" id="bhFreezeToggle" ${S.freezeAim ? 'checked' : ''}>
        </label>
        ${inventoryRows}`;
    panel.querySelector('#bhSoundToggle').addEventListener('change', e => {
        setMuted(!e.target.checked);
        localStorage.setItem(LS_KEYS.muted, String(!e.target.checked));
    });
    panel.querySelector('#bhFreezeToggle').addEventListener('change', e => {
        S.freezeAim = e.target.checked;
        localStorage.setItem(LS_KEYS.freezeAim, String(e.target.checked));
    });
    panel.querySelectorAll('input[data-item]').forEach(cb => {
        cb.addEventListener('change', e => {
            const key = e.target.dataset.item;
            S.inventory[key].enabled = e.target.checked;
            localStorage.setItem(LS_KEYS.inventory, JSON.stringify(S.inventory));
            // Endless Flight (INV-1) is a fuel-lock — switching it on tops the tank
            // off immediately rather than waiting for the next drain/pickup event.
            if (key === 'endlessFlight' && e.target.checked) explore.refuelFull();
        });
    });
}

export function showHowto() {
    document.getElementById('howto').classList.remove('hidden');
    document.getElementById('bar').classList.add('hidden');
    document.getElementById('exploreBar').classList.add('hidden');
    document.getElementById('editorBar').classList.add('hidden');
    document.getElementById('customBar').classList.add('hidden');
    menuOpen = true;
    document.getElementById('townShop').classList.add('hidden');
    shopVisible = false;
    howtoTab = 'play'; // every entry point but the dedicated ⚙️ button lands on Play
    renderHowtoTabs();
}
export function hideHowto() {
    document.getElementById('howto').classList.add('hidden');
    menuOpen = false;
    if (S.mode === 'explore') document.getElementById('exploreBar').classList.remove('hidden');
    else if (S.mode === 'editor') document.getElementById('editorBar').classList.remove('hidden');
    else if (S.mode === 'custom') {
        document.getElementById('customBar').classList.remove('hidden');
        document.getElementById('bar').classList.remove('hidden');
    }
    else {
        document.getElementById('bar').classList.remove('hidden');
    }
}

export function updateCompass() {
    const el = document.querySelector('.compass-pip');
    const compContainer = document.getElementById('compass');
    if (!el || !compContainer) return;
    
    if (S.mode !== 'explore') {
        el.classList.add('hidden');
        return;
    }

    const tx = 50, ty = 85;
    const cam = explore.camera;
    const hw = view.vw / 2;
    const hh = view.vh / 2;
    
    const margin = 30;
    const isOffScreen = tx < cam.x - hw + margin || tx > cam.x + hw - margin || 
                        ty < cam.y - hh + margin || ty > cam.y + hh - margin;

    if (!isOffScreen) {
        el.classList.add('hidden');
        return;
    }
    el.classList.remove('hidden');

    const dx = tx - cam.x;
    const dy = ty - cam.y;
    const angle = Math.atan2(dy, dx);
    const tanAngle = Math.tan(angle);
    let edgeX, edgeY;
    
    if (Math.abs(tanAngle) < hh / hw) {
        edgeX = (dx > 0) ? hw : -hw;
        edgeY = edgeX * tanAngle;
    } else {
        edgeY = (dy > 0) ? hh : -hh;
        edgeX = edgeY / tanAngle;
    }

    // inset by 20px
    const insetX = (hw - 20) / hw;
    const insetY = (hh - 20) / hh;
    const cssX = hw + edgeX * insetX;
    const cssY = hh + edgeY * insetY;

    const rot = angle + Math.PI / 2;
    el.style.transform = `translate(-50%, -50%) rotate(${rot}rad)`;
    el.style.left = cssX + 'px';
    el.style.top = cssY + 'px';
}

/* ============================== TOWN SHOP (EXP-1b) ============================== */
// Only re-rendered on show/hide and right after a purchase — not every frame — so a
// button never gets swapped out from under an in-progress tap.

let shopVisible = false;
// True while the ☰ menu (howto overlay) is open — the shop must stay hidden
// underneath it regardless of atTown(), which only tracks physical location.
let menuOpen = false;
// HUD-3b: true after the player taps #ts-close while still physically at Town —
// atTown() alone can't drive visibility anymore once there's an explicit close
// action. Reset the moment you leave Town so the shop greets you again next visit.
let shopClosedByUser = false;

// One entry per purchasable upgrade. `desc(level, maxed)` renders the current-tier
// (and next-tier, pre-max) blurb — the only part that varies per upgrade's gameplay
// effect. renderTownShop() below maps over this with no per-upgrade markup.
const UPGRADES = [
    {
        key: 'tank',
        icon: '⛽',
        label: 'Fuel Tank',
        desc(level, maxed) {
            return maxed
                ? `Max fuel ${tankMaxFuel(level)}`
                : `Max fuel ${tankMaxFuel(level)} → ${tankMaxFuel(level + 1)}`;
        },
    },
    {
        key: 'siphon',
        icon: '🌀',
        label: 'Fuel Siphon',
        desc(level, maxed) {
            return maxed
                ? `+${siphonGain(level)} fuel per pickup`
                : `+${siphonGain(level)} → +${siphonGain(level + 1)} fuel per pickup`;
        },
    },
    {
        key: 'sensor',
        icon: '📡',
        label: 'Long-Range Sensor',
        desc(level, maxed) {
            const span = r => r * 2 + 1;
            return maxed
                ? `${span(sensorChunkRadius(level))}×${span(sensorChunkRadius(level))} chunk range`
                : `${span(sensorChunkRadius(level))}×${span(sensorChunkRadius(level))} → ${span(sensorChunkRadius(level + 1))}×${span(sensorChunkRadius(level + 1))} chunk range`;
        },
    },
];

export function updateTownShop() {
    const el = document.getElementById('townShop');
    if (!el) return;
    const atTown = explore.atTown();
    if (!atTown) shopClosedByUser = false; // leaving Town clears the manual close
    const show = atTown && !menuOpen && !shopClosedByUser;
    if (show === shopVisible) return;
    shopVisible = show;
    el.classList.toggle('hidden', !show);
    if (show) renderTownShop();
}

// HUD-3b: explicit ✕ exit, alongside the existing "🛫 Launch" CTA (which leaves by
// physically flying away, so atTown() naturally goes false rather than needing this flag).
export function closeTownShop() {
    shopClosedByUser = true;
    updateTownShop();
}

function renderTownShop() {
    const balEl = document.getElementById('ts-balance');
    if (balEl) balEl.textContent = S.stardust;

    const itemsEl = document.getElementById('ts-items');
    if (!itemsEl) return;

    // OW-3: Return Portal — only shown once a black-hole warp has left a bookmark.
    // Separate id/handler from the generic .ts-buy loop below (data-upgrade-less,
    // so that loop's forEach skips it) rather than routing it through buyUpgrade().
    const returnRow = explore.exploreHome ? `
        <div class="ts-item">
            <div class="ts-item-icon">🌀</div>
            <div class="ts-item-main">
                <div class="ts-item-name">Return Portal</div>
                <div class="ts-item-desc">Warp back to the black hole you came from</div>
            </div>
            <button id="ts-return" class="ts-return">🌀 Go</button>
        </div>` : '';

    const upgradeRows = UPGRADES.map(u => {
        const level = S.upgrades[u.key] || 0;
        const cost = upgradeCost(level);
        const maxed = cost === null;
        return `
        <div class="ts-item">
            <div class="ts-item-icon">${u.icon}</div>
            <div class="ts-item-main">
                <div class="ts-item-name">${u.label}<span class="ts-item-level">L${level}${maxed ? ' · MAX' : ''}</span></div>
                <div class="ts-item-desc">${u.desc(level, maxed)}</div>
            </div>
            ${maxed ? '' : `<button data-upgrade="${u.key}" class="ts-buy" ${S.stardust < cost ? 'disabled' : ''}>✨ ${cost}</button>`}
        </div>`;
    }).join('');

    // Inventory items (INV-2) are always owned — no purchase path yet, just a
    // read-only "already acquired" listing that foreshadows the future buy path.
    const inventoryRows = ITEMS.map(item => `
        <div class="ts-item">
            <div class="ts-item-icon">${item.icon}</div>
            <div class="ts-item-main">
                <div class="ts-item-name">${item.label}</div>
                <div class="ts-item-desc">${item.desc}</div>
            </div>
            <span class="ts-acquired">✅ Acquired</span>
        </div>`).join('');

    itemsEl.innerHTML = returnRow
        + `<div class="ts-section-label">Upgrades</div>` + upgradeRows
        + `<div class="ts-section-label">Owned</div>` + inventoryRows;

    const returnBtn = itemsEl.querySelector('#ts-return');
    if (returnBtn) returnBtn.addEventListener('click', () => explore.useReturnPortal());

    itemsEl.querySelectorAll('.ts-buy[data-upgrade]').forEach(btn => {
        btn.addEventListener('click', () => {
            if (explore.buyUpgrade(btn.dataset.upgrade)) renderTownShop();
        });
    });
}
