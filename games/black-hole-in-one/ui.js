// Black Hole in One — all rendering (canvas) and DOM chrome.
// Owns the letterbox transform: the fixed 100×170 course is scaled to fit the
// canvas and centered; view.ox/oy are the world-unit margins around it.
'use strict';

import {
    WORLD_W as W, COURSE_H, COMET_R, CAPTURE_R, DT, MAX_DRAG, MAX_LAUNCH, MIN_SHOT,
    ROUND_HOLES, LIFTOFF_T, LIFTOFF_MIN, ZOOM_LERP, fitZoom, rand, fmtDiff,
} from './constants.js';
import { S, world, comet } from './state.js';
import { stepBody } from './physics.js';
import * as explore from './explore.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

export const view = { scale: 1, dpr: 1, ox: 0, oy: 0, vw: W, vh: COURSE_H, zoom: 1 };

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
    view.scale = Math.min(cw / W, chh / COURSE_H);
    view.vw = cw / view.scale;
    view.vh = chh / view.scale;
    view.ox = (view.vw - W) / 2;
    view.oy = (view.vh - COURSE_H) / 2;
    makeStars();
    makeNebula();
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
    return [vx - view.ox, vy - view.oy];
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
        ctx.translate(view.ox, view.oy);
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
            ctx.arc(st.x, st.y, st.r, 0, 7); 
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
        ctx.translate(view.ox, view.oy);
    }

    // faint course edge on wide screens so the play area reads (only in golf mode)
    if (view.ox > 2 && S.mode !== 'explore') {
        ctx.globalAlpha = 0.1;
        ctx.strokeStyle = '#8a8ac0';
        ctx.lineWidth = 0.3;
        ctx.setLineDash([1.4, 2.2]);
        ctx.strokeRect(-1, -1, W + 2, COURSE_H + 2);
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
    }

    for (const b of world.bodies) {
        if (b.type === 'planet') drawPlanet(b);
        else if (b.type === 'pulsar') drawPulsar(b);
        else drawTee(b);
    }
    if (world.blackHole) drawBlackHole();
    if (world.orbit) drawOrbitRing();

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
}

function drawPlanet(b) {
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = b.pal.base;
    ctx.lineWidth = 0.35;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 9, 0, 7); ctx.stroke();
    ctx.globalAlpha = 1;

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

function drawTee(b) {
    ctx.fillStyle = '#6b6b80';
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill();
    ctx.fillStyle = '#54546a';
    ctx.beginPath(); ctx.arc(b.x - b.r * 0.3, b.y + b.r * 0.2, b.r * 0.3, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(b.x + b.r * 0.35, b.y - b.r * 0.25, b.r * 0.2, 0, 7); ctx.fill();
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

function drawBlackHole() {
    const b = world.blackHole;
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
    ctx.beginPath(); ctx.arc(b.x, b.y, CAPTURE_R, 0, 7); ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
}

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

export function updateBar() {
    const holeTxt = S.mode === 'round' ? `HOLE ${Math.min(S.hole, ROUND_HOLES)}/${ROUND_HOLES}` : 'HOLE ' + S.hole;
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

export function hideScorecard() {
    document.getElementById('scorecard').classList.add('hidden');
}

export function showHowto() { 
    document.getElementById('howto').classList.remove('hidden');
    document.getElementById('bar').classList.add('hidden');
    document.getElementById('exploreBar').classList.add('hidden');
    document.getElementById('editorBar').classList.add('hidden');
    document.getElementById('customBar').classList.add('hidden');
}
export function hideHowto() { 
    document.getElementById('howto').classList.add('hidden');
    if (S.mode === 'explore') document.getElementById('exploreBar').classList.remove('hidden');
    else if (S.mode === 'editor') document.getElementById('editorBar').classList.remove('hidden');
    else if (S.mode === 'custom') {
        document.getElementById('customBar').classList.remove('hidden');
        document.getElementById('bar').classList.remove('hidden');
    }
    else document.getElementById('bar').classList.remove('hidden');
}
