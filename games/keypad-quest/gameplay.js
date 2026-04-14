// ─── Gameplay — wave logic, entities, persistence, showMenu ───────────────────

import { state } from './state.js';
import { TR, ER_X, ER_Y, TTYPES } from './constants.js';
import { burst, ripple, floatText } from './fx.js';
import { updateMenuPlayBtn, buildActiveDeck } from './deck-manager.js';

// ─── Persistence ──────────────────────────────────────────────────────────────

export function getHW() { return parseInt(localStorage.getItem('keypadQuestHighWave') || '0', 10); }
export function saveHW(w) { if (w > getHW()) localStorage.setItem('keypadQuestHighWave', w); }
export function getBT(n) { return parseInt(localStorage.getItem('keypadQuestBestTime_' + n) || '0', 10); }
export function saveBT(n, ms) {
  const p = getBT(n);
  if (p === 0 || ms < p) { localStorage.setItem('keypadQuestBestTime_' + n, ms); return true; }
  return false;
}
export function saveCP() {
  if (state.wave % 5 !== 0) return;
  const data = { wave: state.wave, score: state.score, towers: state.towers.map(t => ({ si: state.slots.indexOf(t.slot), ti: t.ti, lv: t.lv })), ts: Date.now() };
  localStorage.setItem('keypadQuestCheckpoint', JSON.stringify(data));
}
export function loadCP() { try { return JSON.parse(localStorage.getItem('keypadQuestCheckpoint')); } catch(e) { return null; } }
export function clearCP() { localStorage.removeItem('keypadQuestCheckpoint'); }

// ─── Enemies ──────────────────────────────────────────────────────────────────

export function makeEnemy() {
  const hp = Math.round(10 * Math.pow(1.2, state.wave - 1));
  let pixelSpd = 55 * Math.pow(1.03, state.wave - 1);
  if (state.chillMode) pixelSpd *= 0.5;
  const avgR = (state.pathRX + state.pathRY) / 2;
  const spd = pixelSpd / avgR;
  const angle = -Math.PI + (state.totalSpawned / Math.max(state.totalThisWave, 1)) * Math.PI * 0.4;
  const ex = state.pathCX + Math.cos(angle) * state.pathRX;
  const ey = state.pathCY + Math.sin(angle) * state.pathRY;
  return { angle, spd, hp, maxHp: hp, ex, ey, trail: [], dead: false };
}

export function updateEnemies(dt) {
  for (const e of state.enemies) {
    if (e.dead) continue;
    e.trail.unshift({x: e.ex, y: e.ey});
    if (e.trail.length > 9) e.trail.pop();
    e.angle += e.spd * dt;
    e.ex = state.pathCX + Math.cos(e.angle) * state.pathRX;
    e.ey = state.pathCY + Math.sin(e.angle) * state.pathRY;
  }
  state.enemies = state.enemies.filter(e => !e.dead);
}

export function killEnemy(e) {
  if (e.dead) return;
  e.dead = true;
  burst(e.ex, e.ey, lerpHex('#4488ff','#ff4422', 1 - e.hp/e.maxHp), 12); // lerpHex: global from shared/utils.js
  state.waveScore += 10;
}

// ─── Towers ───────────────────────────────────────────────────────────────────

export function makeTower(slot, ti) {
  return { slot, ti, type: TTYPES[ti], lv: 1, cd: 0, pulse: Math.random()*Math.PI*2 };
}

export function placeTower(ti) {
  const slot = bestSlot();
  if (!slot) return;
  slot.occupied = true;
  const t = makeTower(slot, ti);
  slot.tower = t; state.towers.push(t);
  ripple(slot.x, slot.y, TTYPES[ti].color);
  burst(slot.x, slot.y, TTYPES[ti].color, 10);
  if (navigator.vibrate) navigator.vibrate(30);
}

export function bestSlot() {
  const free = state.slots.filter(s => !s.occupied);
  if (free.length === 0) return null;
  if (state.towers.length === 0) return free.reduce((a, b) => a.x < b.x ? a : b);
  let best = null, bestScore = -1;
  for (const s of free) {
    let minD = Infinity;
    for (const t of state.towers) {
      const d = Math.hypot(s.x - t.slot.x, s.y - t.slot.y);
      if (d < minD) minD = d;
    }
    if (minD > bestScore) { bestScore = minD; best = s; }
  }
  return best;
}

export function upgradeRandom() {
  if (state.towers.length === 0) return;
  const t = state.towers[Math.floor(Math.random()*state.towers.length)];
  t.lv++;
  floatText(t.slot.x, t.slot.y, '▲ Lv'+t.lv, t.type.color);
  ripple(t.slot.x, t.slot.y, t.type.color);
}

export function updateTowers(dt) {
  for (const t of state.towers) {
    t.pulse += dt * 1.8;
    if (t.cd > 0) { t.cd -= dt; continue; }
    let target = null, minD = Infinity;
    for (const e of state.enemies) {
      if (e.dead) continue;
      const d = Math.hypot(e.ex - t.slot.x, e.ey - t.slot.y);
      if (d <= t.type.range && d < minD) { minD = d; target = e; }
    }
    if (!target) continue;
    t.cd = t.type.rate;
    const dx = target.ex - t.slot.x, dy = target.ey - t.slot.y, len = Math.hypot(dx, dy) || 1;
    state.projs.push({ x: t.slot.x, y: t.slot.y, vx: (dx/len)*210, vy: (dy/len)*210,
      dmg: t.type.dmg * t.lv, color: t.type.color, splash: !!t.type.splash, trail: [], dead: false });
  }
}

// ─── Projectiles ──────────────────────────────────────────────────────────────

export function updateProjs(dt) {
  for (const p of state.projs) {
    if (p.dead) continue;
    p.trail.unshift({x:p.x, y:p.y});
    if (p.trail.length > 4) p.trail.pop();
    p.x += p.vx*dt; p.y += p.vy*dt;
    for (const e of state.enemies) {
      if (e.dead) continue;
      if (Math.abs(p.x-e.ex) < ER_X && Math.abs(p.y-e.ey) < ER_Y) {
        if (p.splash) {
          for (const e2 of state.enemies) {
            if (!e2.dead && Math.hypot(e2.ex-p.x, e2.ey-p.y) < 42) {
              e2.hp -= p.dmg; if (e2.hp<=0) killEnemy(e2);
            }
          }
          burst(p.x, p.y, p.color, 15);
        } else {
          e.hp -= p.dmg; if (e.hp <= 0) killEnemy(e);
        }
        p.dead = true; break;
      }
    }
    if (p.x < -20 || p.x > state.W+20 || p.y < -20 || p.y > state.H+20) p.dead = true;
  }
  state.projs = state.projs.filter(p => !p.dead);
}

// ─── Wave management ──────────────────────────────────────────────────────────

export function startWave(n) {
  state.wave = n; state.waveScore = 0; state.correctW = 0; state.wrongW = 0;
  state.waveStartTime = performance.now();
  state.totalThisWave = 5 + state.wave * 2; state.totalSpawned = 0;
  state.spawnInterval = Math.max(0.2, 1.0 - (state.wave-1)*0.03); state.spawnTimer = 0;
  state.enemies = []; state.projs = []; state.particles = []; state.ripples = []; state.floats = [];
  state.selectedTower = null; state.waveOver = false;
  document.getElementById('wave-display').textContent = 'Wave ' + state.wave;
  // Note: showNextPrompt is NOT called here. main.js calls it after startWave
  // when currentPair is null (game start / checkpoint resume).
}

export function updateWave(dt) {
  if (state.totalSpawned < state.totalThisWave) {
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) { state.enemies.push(makeEnemy()); state.totalSpawned++; state.spawnTimer = state.spawnInterval; }
  }
  if (!state.waveOver && state.totalSpawned >= state.totalThisWave) {
    const alive = state.enemies.filter(e => !e.dead);
    if (alive.length === 0) { state.waveOver = true; endWave(); }
  }
}

export function endWave() {
  const elapsed = performance.now() - state.waveStartTime;
  state.score += state.waveScore;
  saveHW(state.wave);
  const newBest = !state.chillMode && saveBT(state.wave, elapsed);
  if (!state.chillMode && state.wave % 5 === 0) saveCP();
  const msg = newBest ? 'Wave ' + state.wave + ' — new best!' : 'Wave ' + state.wave + ' clear!';
  floatText(state.pathCX, state.pathCY - state.pathRY * 0.5, msg, '#00ffee');
  startWave(state.wave + 1);
}

// ─── Screens ──────────────────────────────────────────────────────────────────

export function showMenu() {
  state.gameState = 'menu';
  state.towers = []; state.enemies = []; state.projs = [];
  for (const s of state.slots) { s.occupied = false; s.tower = null; }
  document.getElementById('menu-overlay').classList.remove('hidden');
  const hw = getHW();
  document.getElementById('menu-best').textContent = hw > 0 ? 'Best: Wave '+hw : '';
  const cp = loadCP();
  if (cp) {
    document.getElementById('continue-wrap').style.display = '';
    document.getElementById('continue-wave-num').textContent = cp.wave + 1;
  } else {
    document.getElementById('continue-wrap').style.display = 'none';
  }
  updateMenuPlayBtn();
}
