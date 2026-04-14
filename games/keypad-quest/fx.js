// ─── FX — visual effects: particles, ripples, floating text ──────────────────
// Imported by both gameplay.js and input.js to avoid circular dependencies.

import { state } from './state.js';

export function burst(x, y, color, n) {
  for (let i = 0; i < n; i++) {
    const a = (Math.PI*2/n)*i + Math.random()*0.4, spd = 1.5 + Math.random()*3;
    state.particles.push({ x, y, vx: Math.cos(a)*spd, vy: Math.sin(a)*spd,
      a: 1, r: 1.5+Math.random()*2, color, decay: 0.03+Math.random()*0.02 });
  }
}

export function ripple(x, y, color) {
  state.ripples.push({ x, y, r: 14, maxR: 65, color, a: 0.85 });
}

export function floatText(x, y, text, color) {
  state.floats.push({ x, y: y-8, text, color, a: 1, vy: -0.75 });
}

export function updateFX() {
  for (const p of state.particles) { p.x+=p.vx; p.y+=p.vy; p.vy+=0.05; p.a-=p.decay; }
  state.particles = state.particles.filter(p => p.a > 0);
  for (const r of state.ripples) { r.r += 2.2; r.a -= 0.042; }
  state.ripples = state.ripples.filter(r => r.a > 0 && r.r < r.maxR);
  for (const f of state.floats) { f.y += f.vy; f.a -= 0.018; }
  state.floats = state.floats.filter(f => f.a > 0);
}
