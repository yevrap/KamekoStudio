// ─── Rendering — canvas setup, draw functions, game loop ─────────────────────

import { state } from './state.js';
import { TR, ER_X, ER_Y, PR, RING_ANGLES, RINGS, TTYPES } from './constants.js';
import { updateFX } from './fx.js';
import { updateWave, updateEnemies, updateTowers, updateProjs } from './gameplay.js';

// ─── Canvas / Slots ───────────────────────────────────────────────────────────

export function resizeCanvas() {
  const rect = state.canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;
  state.canvas.width = Math.floor(rect.width); state.canvas.height = Math.floor(rect.height);
  state.W = state.canvas.width; state.H = state.canvas.height;
  const outerScale = Math.max(...RINGS);
  const slotMarginX = 32, slotMarginY = 38;
  state.pathCX = state.W * 0.5; state.pathCY = state.H * 0.44;
  state.pathRX = (state.W / 2 - slotMarginX) / outerScale;
  const topRoom = state.pathCY - slotMarginY;
  const botRoom = (state.H - state.pathCY) - slotMarginY;
  state.pathRY = Math.min(Math.min(topRoom, botRoom) / outerScale, state.pathRX * 0.68);
  buildSlots(); buildStars();
}

export function buildSlots() {
  state.slots = [];
  for (const scale of RINGS) {
    for (let i = 0; i < RING_ANGLES; i++) {
      const ang = (i / RING_ANGLES) * Math.PI * 2;
      state.slots.push({
        x: state.pathCX + Math.cos(ang) * state.pathRX * scale,
        y: state.pathCY + Math.sin(ang) * state.pathRY * scale,
        occupied: false, tower: null
      });
    }
  }
}

export function buildStars() {
  state.stars = Array.from({length:60}, () => ({
    x: Math.random()*state.W, y: Math.random()*state.H, r: Math.random()*1.2+0.3,
    a: Math.random()*0.35+0.05, vx: (Math.random()-0.5)*0.08, vy: (Math.random()-0.5)*0.08
  }));
}

// ─── Draw functions ───────────────────────────────────────────────────────────

function drawStars() {
  const ctx = state.ctx;
  ctx.save();
  for (const s of state.stars) {
    s.x = (s.x + s.vx + state.W) % state.W; s.y = (s.y + s.vy + state.H) % state.H;
    ctx.globalAlpha = s.a; ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha = 1; ctx.restore();
}

function drawPath() {
  const ctx = state.ctx;
  ctx.save();
  ctx.shadowBlur = 24; ctx.shadowColor = '#00ffee'; ctx.strokeStyle = '#00ffee33'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.ellipse(state.pathCX, state.pathCY, state.pathRX, state.pathRY, 0, 0, Math.PI*2); ctx.stroke();
  ctx.shadowBlur = 8; ctx.strokeStyle = '#00ffee88'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.ellipse(state.pathCX, state.pathCY, state.pathRX, state.pathRY, 0, 0, Math.PI*2); ctx.stroke();
  ctx.restore();
}

function drawSlots() {
  const ctx = state.ctx;
  ctx.save();
  for (const s of state.slots) {
    if (s.occupied) continue;
    ctx.globalAlpha = 0.22; ctx.strokeStyle = '#4488ff';
    ctx.shadowBlur = 5; ctx.shadowColor = '#4488ff'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(s.x, s.y, TR-1, 0, Math.PI*2); ctx.stroke();
  }
  ctx.globalAlpha = 1; ctx.restore();
}

function drawTowers() {
  const ctx = state.ctx;
  ctx.save();
  for (const t of state.towers) {
    const sx = t.slot.x, sy = t.slot.y, p = Math.sin(t.pulse)*0.3+0.7;
    ctx.shadowBlur = 14 + p*10; ctx.shadowColor = t.type.glow; ctx.fillStyle = t.type.color; ctx.globalAlpha = 0.88;
    ctx.beginPath(); ctx.arc(sx, sy, TR, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1; ctx.fillStyle = '#fff'; ctx.shadowBlur = 3; ctx.shadowColor = '#fff';
    ctx.font = 'bold 9px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(t.lv > 1 ? t.lv : t.type.name[0], sx, sy);
    if (state.selectedTower === t) {
      ctx.globalAlpha = 0.55; ctx.strokeStyle = '#fff'; ctx.shadowBlur = 8; ctx.shadowColor = '#fff'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(sx, sy, TR+5, 0, Math.PI*2); ctx.stroke();
      ctx.globalAlpha = 0.1; ctx.strokeStyle = t.type.color; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(sx, sy, t.type.range, 0, Math.PI*2); ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
}

function drawEnemies() {
  const ctx = state.ctx;
  ctx.save();
  for (const e of state.enemies) {
    if (e.dead) continue;
    const hp = e.hp/e.maxHp, color = lerpHex('#4488ff','#ff4422', 1-hp); // lerpHex: global from shared/utils.js
    for (let i = 0; i < e.trail.length; i++) {
      ctx.globalAlpha = (1-i/e.trail.length)*0.22;
      const tr2 = ER_X*(1-i/e.trail.length)*0.65;
      ctx.fillStyle = '#4488ff'; ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.ellipse(e.trail[i].x, e.trail[i].y, tr2, tr2*0.7, 0, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 0.92; ctx.shadowBlur = 12; ctx.shadowColor = color; ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(e.ex, e.ey, ER_X, ER_Y, 0, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 0.75; ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(e.ex-ER_X, e.ey-ER_Y-7, ER_X*2, 3);
    ctx.fillStyle = color; ctx.fillRect(e.ex-ER_X, e.ey-ER_Y-7, ER_X*2*hp, 3);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function drawProjs() {
  const ctx = state.ctx;
  ctx.save();
  for (const p of state.projs) {
    for (let i = 0; i < p.trail.length; i++) {
      ctx.globalAlpha = (1-i/p.trail.length)*0.45; ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.trail[i].x, p.trail[i].y, PR*(1-i/p.trail.length), 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 10; ctx.shadowColor = p.color; ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, PR, 0, Math.PI*2); ctx.fill();
  }
  ctx.restore();
}

function drawFX() {
  const ctx = state.ctx;
  ctx.save();
  for (const p of state.particles) {
    ctx.globalAlpha = Math.max(0,p.a); ctx.shadowBlur = 5; ctx.shadowColor = p.color; ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
  }
  for (const r of state.ripples) {
    ctx.globalAlpha = Math.max(0,r.a); ctx.strokeStyle = r.color;
    ctx.shadowBlur = 8; ctx.shadowColor = r.color; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI*2); ctx.stroke();
  }
  ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center';
  for (const f of state.floats) {
    ctx.globalAlpha = Math.max(0,f.a); ctx.fillStyle = f.color;
    ctx.shadowBlur = 7; ctx.shadowColor = f.color; ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1; ctx.restore();
}

function drawFrame() {
  state.ctx.fillStyle = 'rgba(5,5,16,0.84)'; state.ctx.fillRect(0, 0, state.W, state.H);
  drawStars(); drawPath(); drawSlots(); drawFX(); drawEnemies(); drawTowers(); drawProjs();
}

// ─── Game loop ────────────────────────────────────────────────────────────────

function loop(ts) {
  const dt = Math.min((ts - state.lastTs)/1000, 0.1); state.lastTs = ts;
  if (state.gameState === 'playing') {
    updateWave(dt); updateEnemies(dt); updateTowers(dt); updateProjs(dt);
  }
  updateFX();
  drawFrame();
  state.rafId = requestAnimationFrame(loop);
}

export function startLoop() {
  if (state.rafId) cancelAnimationFrame(state.rafId);
  state.lastTs = performance.now(); state.rafId = requestAnimationFrame(loop);
}
