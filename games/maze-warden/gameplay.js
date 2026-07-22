// Maze Warden — game logic, canvas rendering, and UI wiring. Canvas rendering
// reads directly from live state on every frame (draw() walks state.towers/
// enemies/particles each tick), so — per the durak-tactics/materials-run/
// blob-zapper precedent for tightly-coupled canvas games — presentation lives
// here rather than in a separate ui.js. DOM elements are read through the
// shared `dom` object (populated by main.js after DOMContentLoaded) rather than
// grabbed at module load, so this file can be imported under `node --test` with
// no document/window present — as long as tests only call the pure logic below
// (BFS, formulas) and never the rendering/DOM-touching functions.

import {
  COLS, ROWS, SPAWN, CORE, LEAK_DAMAGE, SELL_REFUND_RATIO, TOWER_DEFS,
  BOMBER_START_WAVE, bomberChance, bomberFuseSeconds, BOMBER_EXPLOSION_RADIUS, BOMBER_EXPLOSION_DMG, BOMBER_COLOR,
  META_NODES, essenceReward,
  waveEnemyCount, waveEnemyHp, waveEnemySpeed, waveSpawnInterval, killReward, waveClearBonus,
  cellKey, inBounds, isSpecialCell
} from './constants.js';
import {
  state, resetState, meta, saveMeta, metaStartCoreHp,
  effectiveCost, effectiveDmg, effectiveHp,
  currentSpeed, cycleSpeedIndex, dom
} from './state.js';

// ------------------------------------------------------------------
// Audio (tiny WebAudio synth, no assets)
// ------------------------------------------------------------------
var audio = (function () {
  var ctx = null;
  function ensure() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function blip(freq, dur, type, vol, glideTo) {
    var c = ensure();
    if (!c) return;
    var t0 = c.currentTime;
    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol || 0.18, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }
  return {
    unlock: ensure,
    build: function () { blip(520, 0.09, 'square', 0.12, 720); },
    upgrade: function () { blip(440, 0.14, 'triangle', 0.14, 880); },
    sell: function () { blip(340, 0.1, 'sine', 0.1, 200); },
    shootSpire: function () { blip(900, 0.05, 'square', 0.05, 700); },
    shootPrism: function () { blip(260, 0.12, 'sawtooth', 0.06, 160); },
    hit: function () { blip(180, 0.05, 'square', 0.04, 90); },
    death: function () { blip(300, 0.12, 'sine', 0.09, 60); },
    leak: function () { blip(150, 0.2, 'sawtooth', 0.12, 60); },
    towerBreak: function () { blip(140, 0.28, 'sawtooth', 0.17, 35); },
    explosion: function () { blip(70, 0.5, 'sine', 0.24, 28); blip(280, 0.24, 'sawtooth', 0.18, 35); },
    waveStart: function () { blip(500, 0.18, 'triangle', 0.13, 900); },
    waveClear: function () { blip(660, 0.22, 'triangle', 0.14, 1100); },
    reject: function () { blip(180, 0.12, 'square', 0.08, 120); },
    gameover: function () { blip(220, 0.5, 'sawtooth', 0.14, 40); }
  };
})();

// ------------------------------------------------------------------
// Canvas / sizing
// ------------------------------------------------------------------
export var cellSize = 40;
var dpr = 1;

export function resizeCanvas() {
  var canvas = dom.canvas, boardWrap = dom.boardWrap, ctx = dom.ctx;
  var w = boardWrap.clientWidth, h = boardWrap.clientHeight;
  if (w <= 0 || h <= 0) { requestAnimationFrame(resizeCanvas); return; }
  var padding = 8;
  w -= padding; h -= padding;
  cellSize = Math.floor(Math.min(w / COLS, h / ROWS));
  if (cellSize < 10) cellSize = 10;
  var cw = cellSize * COLS, ch = cellSize * ROWS;
  dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.style.width = cw + 'px';
  canvas.style.height = ch + 'px';
  canvas.width = Math.round(cw * dpr);
  canvas.height = Math.round(ch * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

// ------------------------------------------------------------------
// Board geometry — BFS distance field + the "never fully seal the core" guarantee
// ------------------------------------------------------------------

// BFS distance field from core through open (non-tower) cells.
export function computeDistField(towersMap) {
  var field = [];
  for (var r = 0; r < ROWS; r++) { field.push(new Array(COLS).fill(Infinity)); }
  var qCol = [CORE.col], qRow = [CORE.row];
  field[CORE.row][CORE.col] = 0;
  var head = 0;
  while (head < qCol.length) {
    var c = qCol[head], r = qRow[head]; head++;
    var d = field[r][c];
    var neighbors = [[c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]];
    for (var i = 0; i < 4; i++) {
      var nc = neighbors[i][0], nr = neighbors[i][1];
      if (!inBounds(nc, nr)) continue;
      if (field[nr][nc] !== Infinity) continue;
      if (towersMap[cellKey(nc, nr)] && !(nc === SPAWN.col && nr === SPAWN.row)) continue;
      field[nr][nc] = d + 1;
      qCol.push(nc); qRow.push(nr);
    }
  }
  return field;
}

export function cellOccupiedActiveEnemies() {
  var cells = [];
  for (var i = 0; i < state.enemies.length; i++) {
    var e = state.enemies[i];
    cells.push({ col: Math.round(e.pos.x / cellSize - 0.5), row: Math.round(e.pos.y / cellSize - 0.5) });
  }
  return cells;
}

// Would placing a tower at (col,row) seal off spawn or any active enemy from the
// core? Every active enemy — Bombers included (iteration 5 revision reverted their
// old seal exemption) — always keeps an open path; a Bomber's threat comes from its
// fuse, not from being trapped.
export function wouldSeal(col, row) {
  var testMap = {};
  for (var k in state.towers) testMap[k] = true;
  testMap[cellKey(col, row)] = true;
  var field = computeDistField(testMap);
  if (field[SPAWN.row][SPAWN.col] === Infinity) return true;
  var enemyCells = cellOccupiedActiveEnemies();
  for (var i = 0; i < enemyCells.length; i++) {
    var ec = enemyCells[i];
    if (!inBounds(ec.col, ec.row)) continue;
    if (field[ec.row][ec.col] === Infinity) return true;
  }
  return false;
}

export function rebuildDistField() {
  state.distField = computeDistField(state.towers);
}

// ------------------------------------------------------------------
// Enemies
// ------------------------------------------------------------------
export function cellCenterPx(col, row) { return { x: col * cellSize + cellSize / 2, y: row * cellSize + cellSize / 2 }; }

export function spawnEnemy() {
  var hp = waveEnemyHp(state.wave);
  var tier = Math.floor((state.wave - 1) / 5);
  var pos = cellCenterPx(SPAWN.col, SPAWN.row);
  // Same wall/pathing rules and same HP/speed profile as the grunt (Q5=C picked the
  // Bomber for its new *interaction*, not a reskinned stat profile) — the only
  // difference is the fuse-driven self-destruct handled in updateBombers().
  var kind = Math.random() < bomberChance(state.wave) ? 'bomber' : 'grunt';
  var enemy = {
    kind: kind,
    col: SPAWN.col, row: SPAWN.row,
    pos: { x: pos.x, y: pos.y },
    hp: hp, maxHp: hp,
    baseSpeed: waveEnemySpeed(state.wave) * cellSize,
    slowUntil: 0, slowFactor: 1,
    tier: tier,
    targetCol: SPAWN.col, targetRow: SPAWN.row,
    alive: true
  };
  if (kind === 'bomber') {
    var fuseMax = bomberFuseSeconds(state.wave);
    enemy.fuse = fuseMax;
    enemy.fuseMax = fuseMax;
  }
  state.enemies.push(enemy);
  pickNextTarget(state.enemies[state.enemies.length - 1]);
}

export function pickNextTarget(e) {
  var col = Math.round(e.pos.x / cellSize - 0.5);
  var row = Math.round(e.pos.y / cellSize - 0.5);
  var field = state.distField;
  var curD = (field[row] && field[row][col] !== undefined) ? field[row][col] : Infinity;
  if (curD === 0) { e.targetCol = col; e.targetRow = row; e.arrived = true; return; }
  var best = null, bestD = curD;
  var cands = [[col + 1, row], [col - 1, row], [col, row + 1], [col, row - 1]];
  for (var i = 0; i < cands.length; i++) {
    var nc = cands[i][0], nr = cands[i][1];
    if (!inBounds(nc, nr)) continue;
    var d = field[nr][nc];
    if (d < bestD) { bestD = d; best = { col: nc, row: nr }; }
  }
  if (best) { e.targetCol = best.col; e.targetRow = best.row; }
  else { e.targetCol = col; e.targetRow = row; }
}

export function updateEnemies(dt) {
  for (var i = state.enemies.length - 1; i >= 0; i--) {
    var e = state.enemies[i];
    var speed = e.baseSpeed * (state.time < e.slowUntil ? e.slowFactor : 1);
    var target = cellCenterPx(e.targetCol, e.targetRow);
    var dx = target.x - e.pos.x, dy = target.y - e.pos.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var step = speed * dt;
    if (dist <= step || dist < 0.5) {
      e.pos.x = target.x; e.pos.y = target.y;
      var col = e.targetCol, row = e.targetRow;
      if (col === CORE.col && row === CORE.row) {
        state.coreHp = Math.max(0, state.coreHp - LEAK_DAMAGE);
        spawnBurst(e.pos.x, e.pos.y, '#ff4d6a', 10);
        audio.leak();
        state.enemies.splice(i, 1);
        updateHud();
        if (state.coreHp <= 0) { triggerGameOver(); return; }
        continue;
      }
      pickNextTarget(e);
    } else {
      e.pos.x += (dx / dist) * step;
      e.pos.y += (dy / dist) * step;
    }
  }
}

// Bomber fuse countdown + detonation (iteration 5 revision). Unlike the abandoned
// blocked-detection design, this doesn't care about maze topology at all — a Bomber
// ticks down from spawn and detonates on a fixed timer regardless of whether it ever
// gets stuck.
export function updateBombers(dt) {
  for (var i = state.enemies.length - 1; i >= 0; i--) {
    var e = state.enemies[i];
    if (e.kind !== 'bomber') continue;
    e.fuse -= dt;
    if (e.fuse <= 0) detonateBomber(e, i);
  }
}

// Collects every tower within BOMBER_EXPLOSION_RADIUS before damaging/destroying any
// of them, so destroyTower() removing entries from state.towers mid-scan can't skip a
// neighbor. Only towers take damage — enemies and the core are untouched, and a
// Bomber with nothing nearby just fizzles.
export function detonateBomber(e, index) {
  var hitList = [];
  for (var key in state.towers) {
    var t = state.towers[key];
    var tp = cellCenterPx(t.col, t.row);
    var dx = tp.x - e.pos.x, dy = tp.y - e.pos.y;
    if (Math.sqrt(dx * dx + dy * dy) <= BOMBER_EXPLOSION_RADIUS * cellSize) hitList.push(t);
  }
  audio.explosion();
  spawnBurst(e.pos.x, e.pos.y, BOMBER_COLOR, 30);
  spawnBlast(e.pos.x, e.pos.y, BOMBER_EXPLOSION_RADIUS * cellSize);
  state.enemies.splice(index, 1);
  for (var i = 0; i < hitList.length; i++) {
    var target = hitList[i];
    if (!state.towers[cellKey(target.col, target.row)]) continue; // already destroyed by an earlier hit this same blast
    target.hp -= BOMBER_EXPLOSION_DMG;
    if (target.hp <= 0) destroyTower(target.col, target.row);
  }
}

// ------------------------------------------------------------------
// Towers / combat
// ------------------------------------------------------------------
export function towerAt(col, row) { return state.towers[cellKey(col, row)]; }

export function placeTower(col, row, key) {
  var def = TOWER_DEFS[key];
  var lvl = def.levels[0];
  var cost = effectiveCost(lvl.cost, true);
  if (state.gold < cost) return false;
  if (wouldSeal(col, row)) return false;
  state.gold -= cost;
  state.towersBuiltThisRun += 1;
  var startHp = effectiveHp(lvl.hp);
  state.towers[cellKey(col, row)] = { defKey: key, level: 0, col: col, row: row, cooldown: 0, spent: cost, hp: startHp, maxHp: startHp };
  rebuildDistField();
  for (var i = 0; i < state.enemies.length; i++) pickNextTarget(state.enemies[i]);
  audio.build();
  updateHud();
  return true;
}

export function upgradeTower(col, row) {
  var t = towerAt(col, row);
  if (!t) return false;
  var def = TOWER_DEFS[t.defKey];
  if (t.level >= def.levels.length - 1) return false;
  var nextLvl = def.levels[t.level + 1];
  var cost = effectiveCost(nextLvl.cost);
  if (state.gold < cost) return false;
  state.gold -= cost;
  t.spent += cost;
  t.level += 1;
  var newHp = effectiveHp(nextLvl.hp);
  t.hp = newHp;
  t.maxHp = newHp;
  audio.upgrade();
  updateHud();
  return true;
}

export function sellTower(col, row) {
  var t = towerAt(col, row);
  if (!t) return false;
  var refund = Math.round(t.spent * SELL_REFUND_RATIO);
  state.gold += refund;
  delete state.towers[cellKey(col, row)];
  rebuildDistField();
  for (var i = 0; i < state.enemies.length; i++) pickNextTarget(state.enemies[i]);
  audio.sell();
  updateHud();
  return true;
}

// A tower reduced to 0 hp by a Bomber's blast (iteration 5 revision) — no gold refund
// (that's sellTower's deal, a deliberate player choice), just gone, forcing a
// rebuild/reroute.
export function destroyTower(col, row) {
  var key = cellKey(col, row);
  var t = state.towers[key];
  if (!t) return;
  var p = cellCenterPx(col, row);
  spawnBurst(p.x, p.y, '#ff4d6a', 20);
  audio.towerBreak();
  delete state.towers[key];
  if (state.selectedCell && state.selectedCell.col === col && state.selectedCell.row === row) closeSheet();
  rebuildDistField();
  for (var i = 0; i < state.enemies.length; i++) pickNextTarget(state.enemies[i]);
  updateHud();
}

export function updateTowers(dt) {
  for (var key in state.towers) {
    var t = state.towers[key];
    t.cooldown -= dt;
    var def = TOWER_DEFS[t.defKey];
    var lvl = def.levels[t.level];
    if (t.cooldown > 0) continue;
    var center = cellCenterPx(t.col, t.row);
    var rangePx = lvl.range * cellSize;
    var target = null, bestD = Infinity;
    for (var i = 0; i < state.enemies.length; i++) {
      var e = state.enemies[i];
      var dx = e.pos.x - center.x, dy = e.pos.y - center.y;
      var d2 = dx * dx + dy * dy;
      if (d2 <= rangePx * rangePx) {
        var progress = state.distField[Math.max(0, Math.min(ROWS - 1, e.targetRow))][Math.max(0, Math.min(COLS - 1, e.targetCol))];
        if (progress < bestD) { bestD = progress; target = e; }
      }
    }
    if (!target) continue;
    t.cooldown = 1 / lvl.rate;
    if (t.defKey === 'spire') {
      fireSpire(t, target, lvl, center);
    } else if (t.defKey === 'volt') {
      fireVolt(t, target, lvl, center);
    } else {
      firePrism(t, target, lvl, center);
    }
  }
}

function fireSpire(t, target, lvl, center) {
  audio.shootSpire();
  state.projectiles.push({
    kind: 'spire', x: center.x, y: center.y, target: target,
    speed: 900, color: TOWER_DEFS.spire.color, dmg: effectiveDmg(lvl.dmg)
  });
}

function fireVolt(t, target, lvl, center) {
  audio.shootSpire();
  state.projectiles.push({
    kind: 'spire', x: center.x, y: center.y, target: target,
    speed: 1100, color: TOWER_DEFS.volt.color, dmg: effectiveDmg(lvl.dmg)
  });
}

function firePrism(t, target, lvl, center) {
  audio.shootPrism();
  state.projectiles.push({
    kind: 'prism', x: center.x, y: center.y,
    tx: target.pos.x, ty: target.pos.y,
    progress: 0, dur: 0.28,
    color: TOWER_DEFS.prism.color, dmg: effectiveDmg(lvl.dmg), radius: lvl.radius * cellSize,
    slow: lvl.slow, slowDur: lvl.slowDur
  });
}

export function damageEnemy(e, dmg) {
  e.hp -= dmg;
  audio.hit();
  if (e.hp <= 0) {
    killEnemy(e);
  }
}

export function killEnemy(e) {
  var idx = state.enemies.indexOf(e);
  if (idx === -1) return;
  state.enemies.splice(idx, 1);
  state.gold += killReward(state.wave);
  state.killedThisRun += 1;
  spawnBurst(e.pos.x, e.pos.y, tierColor(e.tier), 14);
  audio.death();
  updateHud();
}

export function tierColor(tier) {
  var colors = ['#ffb020', '#ff8a3d', '#ff5a4d', '#ff3050'];
  return colors[Math.min(tier, colors.length - 1)];
}

export function updateProjectiles(dt) {
  for (var i = state.projectiles.length - 1; i >= 0; i--) {
    var p = state.projectiles[i];
    if (p.kind === 'spire') {
      if (!p.target || state.enemies.indexOf(p.target) === -1) { state.projectiles.splice(i, 1); continue; }
      var dx = p.target.pos.x - p.x, dy = p.target.pos.y - p.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var step = p.speed * dt;
      if (dist <= step) {
        damageEnemy(p.target, p.dmg);
        state.projectiles.splice(i, 1);
      } else {
        p.x += (dx / dist) * step; p.y += (dy / dist) * step;
      }
    } else {
      p.progress += dt / p.dur;
      if (p.progress >= 1) {
        spawnBurst(p.tx, p.ty, p.color, 16);
        for (var j = state.enemies.length - 1; j >= 0; j--) {
          var e = state.enemies[j];
          var edx = e.pos.x - p.tx, edy = e.pos.y - p.ty;
          if (edx * edx + edy * edy <= p.radius * p.radius) {
            damageEnemy(e, p.dmg);
            if (state.enemies.indexOf(e) !== -1) { e.slowUntil = state.time + p.slowDur; e.slowFactor = 1 - p.slow; }
          }
        }
        state.projectiles.splice(i, 1);
      } else {
        p.x = p.x + (p.tx - p.x) * dt / (p.dur * (1 - p.progress + 0.0001));
        p.y = p.y + (p.ty - p.y) * dt / (p.dur * (1 - p.progress + 0.0001));
      }
    }
  }
}

// ------------------------------------------------------------------
// Particles
// ------------------------------------------------------------------
export function spawnBurst(x, y, color, count) {
  for (var i = 0; i < count; i++) {
    var ang = Math.random() * Math.PI * 2;
    var spd = 40 + Math.random() * 90;
    state.particles.push({
      x: x, y: y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
      life: 0.4 + Math.random() * 0.3, age: 0, color: color, size: 1.5 + Math.random() * 2
    });
  }
}
export function updateParticles(dt) {
  for (var i = state.particles.length - 1; i >= 0; i--) {
    var p = state.particles[i];
    p.age += dt;
    if (p.age >= p.life) { state.particles.splice(i, 1); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt;
    p.vx *= 0.94; p.vy *= 0.94;
  }
}

// Brief radius-flash on a Bomber detonation — a fast-expanding, fading ring showing
// which towers were in range of the blast.
export function spawnBlast(x, y, radiusPx) {
  state.blasts.push({ x: x, y: y, radius: radiusPx, life: 0.35, age: 0 });
}
export function updateBlasts(dt) {
  for (var i = state.blasts.length - 1; i >= 0; i--) {
    var b = state.blasts[i];
    b.age += dt;
    if (b.age >= b.life) state.blasts.splice(i, 1);
  }
}

// ------------------------------------------------------------------
// Waves
// ------------------------------------------------------------------
export function startWave() {
  if (state.phase !== 'build') return;
  state.phase = 'wave';
  state.enemiesToSpawn = waveEnemyCount(state.wave);
  state.spawnTimer = 0;
  audio.waveStart();
  updateHud();
}

export function updateSpawning(dt) {
  if (state.phase !== 'wave') return;
  if (state.enemiesToSpawn > 0) {
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      spawnEnemy();
      state.enemiesToSpawn -= 1;
      state.spawnTimer = waveSpawnInterval(state.wave);
    }
  } else if (state.enemies.length === 0) {
    var bonus = waveClearBonus(state.wave);
    state.gold += bonus;
    showToast('🌊 Wave ' + state.wave + ' cleared +' + bonus + 'g');
    audio.waveClear();
    state.wave += 1;
    state.phase = 'build';
    updateHud();
  }
}

// ------------------------------------------------------------------
// Rendering
// ------------------------------------------------------------------
var stars = [];
function initStars() {
  stars = [];
  for (var i = 0; i < 40; i++) {
    stars.push({ x: Math.random(), y: Math.random(), r: 0.4 + Math.random() * 1.1, tw: Math.random() * Math.PI * 2 });
  }
}
initStars();

export function draw() {
  var ctx = dom.ctx;
  var w = cellSize * COLS, h = cellSize * ROWS;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#070712';
  ctx.fillRect(0, 0, w, h);

  // starfield
  for (var i = 0; i < stars.length; i++) {
    var s = stars[i];
    var tw = 0.5 + 0.5 * Math.sin(state.time * 1.4 + s.tw);
    ctx.fillStyle = 'rgba(160,170,255,' + (0.15 + tw * 0.25) + ')';
    ctx.beginPath();
    ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (var c = 0; c <= COLS; c++) {
    ctx.beginPath(); ctx.moveTo(c * cellSize, 0); ctx.lineTo(c * cellSize, h); ctx.stroke();
  }
  for (var r = 0; r <= ROWS; r++) {
    ctx.beginPath(); ctx.moveTo(0, r * cellSize), ctx.lineTo(w, r * cellSize); ctx.stroke();
  }

  // selected cell highlight
  if (state.selectedCell) {
    var sc = state.selectedCell;
    var pulse = 0.5 + 0.5 * Math.sin(state.time * 6);
    ctx.strokeStyle = 'rgba(255,255,255,' + (0.35 + pulse * 0.3) + ')';
    ctx.lineWidth = 2;
    ctx.strokeRect(sc.col * cellSize + 2, sc.row * cellSize + 2, cellSize - 4, cellSize - 4);

    // range ring for a tapped built tower — standard TD legibility pattern
    // (what can this thing actually hit?)
    var selT = towerAt(sc.col, sc.row);
    if (selT) {
      var selDef = TOWER_DEFS[selT.defKey];
      var selLvl = selDef.levels[selT.level];
      var selCenter = cellCenterPx(sc.col, sc.row);
      ctx.save();
      ctx.strokeStyle = selDef.color;
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(selCenter.x, selCenter.y, selLvl.range * cellSize, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // spawn marker
  drawSpawnMarker();
  // core
  drawCore();
  // towers
  for (var key in state.towers) drawTower(state.towers[key]);
  // projectiles
  for (var pi = 0; pi < state.projectiles.length; pi++) drawProjectile(state.projectiles[pi]);
  // enemies
  for (var ei = 0; ei < state.enemies.length; ei++) drawEnemy(state.enemies[ei]);
  // particles
  for (var qi = 0; qi < state.particles.length; qi++) drawParticle(state.particles[qi]);
  // bomber detonation flashes
  for (var bi = 0; bi < state.blasts.length; bi++) drawBlast(state.blasts[bi]);
}

function drawSpawnMarker() {
  var ctx = dom.ctx;
  var p = cellCenterPx(SPAWN.col, SPAWN.row);
  var pulse = 0.5 + 0.5 * Math.sin(state.time * 3);
  ctx.save();
  ctx.globalAlpha = 0.55 + pulse * 0.25;
  ctx.fillStyle = '#3a3a66';
  ctx.beginPath();
  ctx.arc(p.x, p.y, cellSize * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#7a7ab8';
  ctx.font = (cellSize * 0.4) + 'px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('▼', p.x, p.y);
}

function drawCore() {
  var ctx = dom.ctx;
  var p = cellCenterPx(CORE.col, CORE.row);
  var pulse = 0.5 + 0.5 * Math.sin(state.time * 2.5);
  var hpFrac = state.coreHp / metaStartCoreHp();
  var r = cellSize * 0.4;
  var grad = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, r * (1.5 + pulse * 0.3));
  grad.addColorStop(0, 'rgba(125,91,255,0.55)');
  grad.addColorStop(1, 'rgba(125,91,255,0)');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(p.x, p.y, r * 2, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = hpFrac > 0.4 ? '#7d5bff' : '#ff4d6a';
  drawHexagon(p.x, p.y, r);
  ctx.fillStyle = '#0b0b1a';
  ctx.font = 'bold ' + (cellSize * 0.36) + 'px sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('◆', p.x, p.y);
}

function drawHexagon(cx, cy, r) {
  var ctx = dom.ctx;
  ctx.beginPath();
  for (var i = 0; i < 6; i++) {
    var ang = Math.PI / 6 + i * Math.PI / 3;
    var x = cx + r * Math.cos(ang), y = cy + r * Math.sin(ang);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
}

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  return { r: parseInt(hex.substr(0, 2), 16), g: parseInt(hex.substr(2, 2), 16), b: parseInt(hex.substr(4, 2), 16) };
}
function blendColor(c1, c2, t) {
  var a = hexToRgb(c1), b = hexToRgb(c2);
  var r = Math.round(a.r + (b.r - a.r) * t);
  var g = Math.round(a.g + (b.g - a.g) * t);
  var bl = Math.round(a.b + (b.b - a.b) * t);
  return 'rgb(' + r + ',' + g + ',' + bl + ')';
}

function drawTower(t) {
  var ctx = dom.ctx;
  var def = TOWER_DEFS[t.defKey];
  var p = cellCenterPx(t.col, t.row);
  var r = cellSize * (0.28 + t.level * 0.05);
  // Damaged-tower visual state (iteration 5, Bomber blasts) — tint toward a
  // scorched red as hp drops, plus an hp bar once it's actually taken damage
  // (kept hidden at full hp so undamaged towers don't get visual clutter).
  var dmgFrac = t.maxHp ? 1 - Math.max(0, t.hp) / t.maxHp : 0;
  ctx.save();
  ctx.shadowColor = def.glow;
  ctx.shadowBlur = cellSize * 0.35 * (1 - dmgFrac * 0.6);
  ctx.fillStyle = dmgFrac > 0 ? blendColor(def.color, '#3a1414', dmgFrac * 0.75) : def.color;
  if (t.defKey === 'spire') {
    ctx.beginPath();
    var n = 4;
    for (var i = 0; i < n; i++) {
      var ang = state.time * 0.6 + i * (Math.PI * 2 / n);
      var x = p.x + r * Math.cos(ang), y = p.y + r * Math.sin(ang);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.fill();
  } else if (t.defKey === 'volt') {
    ctx.beginPath();
    var m = 6;
    for (var k = 0; k < m; k++) {
      var ang2 = state.time * 1.4 + k * (Math.PI * 2 / m);
      var rr = k % 2 === 0 ? r : r * 0.55;
      var x2 = p.x + rr * Math.cos(ang2), y2 = p.y + rr * Math.sin(ang2);
      if (k === 0) ctx.moveTo(x2, y2); else ctx.lineTo(x2, y2);
    }
    ctx.closePath(); ctx.fill();
  } else {
    ctx.beginPath();
    for (var j = 0; j < 3; j++) {
      var a = -Math.PI / 2 + j * (Math.PI * 2 / 3);
      var xx = p.x + r * Math.cos(a), yy = p.y + r * Math.sin(a);
      if (j === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  if (t.level > 0) {
    ctx.fillStyle = '#05050d';
    ctx.font = 'bold ' + (cellSize * 0.22) + 'px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(t.level + 1), p.x, p.y);
  }
  if (dmgFrac > 0) {
    var barW = cellSize * 0.6, barH = 3;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(p.x - barW / 2, p.y - r - 9, barW, barH);
    ctx.fillStyle = dmgFrac < 0.6 ? '#ffd54a' : '#ff4d6a';
    ctx.fillRect(p.x - barW / 2, p.y - r - 9, barW * (1 - dmgFrac), barH);
  }
}

function drawProjectile(p) {
  var ctx = dom.ctx;
  ctx.save();
  if (p.kind === 'spire') {
    ctx.strokeStyle = p.color; ctx.lineWidth = 2; ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.arc(p.x, p.y, 2.6, 0, Math.PI * 2); ctx.fillStyle = p.color; ctx.fill();
  } else {
    var rad = p.radius * Math.min(1, p.progress + 0.15);
    ctx.strokeStyle = p.color; ctx.globalAlpha = 0.5 * (1 - p.progress) + 0.15;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p.tx, p.ty, rad, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = p.color; ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawEnemy(e) {
  var ctx = dom.ctx;
  var isBomber = e.kind === 'bomber';
  var r = cellSize * (0.16 + Math.min(e.tier, 3) * 0.02);
  var color = isBomber ? BOMBER_COLOR : tierColor(e.tier);
  ctx.save();
  ctx.shadowColor = color; ctx.shadowBlur = cellSize * (isBomber ? 0.3 : 0.25);
  ctx.fillStyle = color;
  if (isBomber) {
    // Spiky diamond, distinct from the round grunt at a glance.
    var br = r * 1.3;
    ctx.beginPath();
    for (var i = 0; i < 4; i++) {
      var ang = Math.PI / 4 + i * (Math.PI / 2);
      var x = e.pos.x + br * Math.cos(ang), y = e.pos.y + br * Math.sin(ang);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.fill();
  } else {
    ctx.beginPath(); ctx.arc(e.pos.x, e.pos.y, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  if (state.time < e.slowUntil) {
    ctx.strokeStyle = '#c04bff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(e.pos.x, e.pos.y, r + 2, 0, Math.PI * 2); ctx.stroke();
  }
  var barW = cellSize * 0.5, barH = 3;
  var frac = Math.max(0, e.hp / e.maxHp);
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(e.pos.x - barW / 2, e.pos.y - r - 8, barW, barH);
  ctx.fillStyle = frac > 0.4 ? '#6dff9a' : '#ff4d6a';
  ctx.fillRect(e.pos.x - barW / 2, e.pos.y - r - 8, barW * frac, barH);

  if (isBomber) {
    // Fuse telegraph: a filling ring that reads increasingly urgent as detonation
    // nears — both the fill and the pulse rate track fuse/fuseMax.
    var urgency = 1 - Math.max(0, e.fuse) / e.fuseMax; // 0 → just spawned, 1 → about to blow
    var pulse = 0.5 + 0.5 * Math.sin(state.time * (2 + urgency * 14));
    ctx.save();
    ctx.strokeStyle = '#ff4d6a';
    ctx.globalAlpha = 0.3 + urgency * 0.5 + pulse * 0.2;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(e.pos.x, e.pos.y, r + 4, -Math.PI / 2, -Math.PI / 2 + urgency * Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
}

function drawParticle(p) {
  var ctx = dom.ctx;
  var frac = 1 - p.age / p.life;
  ctx.save();
  ctx.globalAlpha = Math.max(0, frac);
  ctx.fillStyle = p.color;
  ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawBlast(b) {
  var ctx = dom.ctx;
  var frac = b.age / b.life;
  var rad = b.radius * (0.4 + frac * 0.6);
  ctx.save();
  ctx.globalAlpha = Math.max(0, 0.6 * (1 - frac));
  ctx.strokeStyle = '#ff4d6a';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(b.x, b.y, rad, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = 'rgba(255,90,31,' + (0.25 * (1 - frac)) + ')';
  ctx.beginPath(); ctx.arc(b.x, b.y, rad, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// ------------------------------------------------------------------
// HUD
// ------------------------------------------------------------------
export function updateSpeedBtn() { dom.speedBtn.textContent = currentSpeed() + 'x'; }

export function updateHud() {
  dom.goldVal.textContent = state.gold;
  dom.hpVal.textContent = state.coreHp;
  dom.hpBarInner.style.width = Math.max(0, (state.coreHp / metaStartCoreHp()) * 100) + '%';
  dom.waveVal.textContent = state.wave;
  if (state.phase === 'build') {
    dom.startWaveBtn.style.display = 'block';
    dom.startWaveBtn.textContent = '▶ Start Wave ' + state.wave;
    dom.waveProgress.style.display = 'none';
  } else if (state.phase === 'wave') {
    dom.startWaveBtn.style.display = 'none';
    dom.waveProgress.style.display = 'flex';
    var total = waveEnemyCount(state.wave);
    var remaining = state.enemies.length + state.enemiesToSpawn;
    var resolved = Math.max(0, total - remaining);
    dom.waveProgressInner.style.width = Math.min(100, (resolved / total) * 100) + '%';
    dom.waveStatusText.textContent = '👾 ' + remaining + ' left';
  }
}

// ------------------------------------------------------------------
// Toast
// ------------------------------------------------------------------
var toastTimer = null;
export function showToast(msg) {
  dom.toastEl.textContent = msg;
  dom.toastEl.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { dom.toastEl.classList.remove('show'); }, 1600);
}

// ------------------------------------------------------------------
// Sheet (build / tower action panel)
// ------------------------------------------------------------------
export function closeSheet() {
  dom.sheetBackdrop.classList.remove('show');
  dom.sheet.classList.remove('show');
  state.selectedCell = null;
}

export function handleSheetBackdropClick(ev) {
  var rect = dom.canvas.getBoundingClientRect();
  closeSheet();
  if (pointInRect(ev.clientX, ev.clientY, rect)) handleBoardTap(ev.clientX, ev.clientY);
}

export function openBuildSheet(col, row) {
  state.selectedCell = { col: col, row: row };
  dom.sheetTitle.textContent = 'Build here';
  dom.sheetRow.innerHTML = '';
  var keys = ['spire', 'prism', 'volt'];
  keys.forEach(function (key) {
    var def = TOWER_DEFS[key];
    var locked = key === 'volt' && meta.thirdTower <= 0;
    var btn = document.createElement('button');
    btn.className = 'sheetBtn';
    if (locked) {
      // Shown greyed-out with a lock rather than hidden — an invisible 3rd tower
      // read as "missing/broken" in iteration 2 playtesting; a locked slot reads as "not yet".
      btn.classList.add('locked');
      btn.innerHTML = '<span class="sbEmoji">🔒</span>' +
        '<span class="sbBody"><span class="sbName">' + def.name + '</span>' +
        '<span class="sbDesc">Unlock in ⬡ Upgrades</span></span>';
      btn.addEventListener('click', function () {
        showToast('🔒 Unlock Volt Coil in ⬡ Upgrades');
        audio.reject();
      });
    } else {
      var lvl = def.levels[0];
      var cost = effectiveCost(lvl.cost, true);
      var afford = state.gold >= cost;
      btn.disabled = !afford;
      btn.innerHTML = '<span class="sbEmoji">' + def.emoji + '</span>' +
        '<span class="sbBody"><span class="sbName">' + def.name + '</span>' +
        '<span class="sbDesc">' + def.desc + '</span></span>' +
        '<span class="sbCost">' + cost + 'g</span>';
      btn.addEventListener('click', function (k) {
        return function () {
          if (placeTower(col, row, k)) closeSheet();
        };
      }(key));
    }
    dom.sheetRow.appendChild(btn);
  });
  dom.sheetBackdrop.classList.add('show');
  dom.sheet.classList.add('show');
}

export function openTowerSheet(col, row) {
  var t = towerAt(col, row);
  if (!t) return;
  state.selectedCell = { col: col, row: row };
  var def = TOWER_DEFS[t.defKey];
  dom.sheetTitle.textContent = def.emoji + ' ' + def.name + ' — Lv ' + (t.level + 1);
  dom.sheetRow.innerHTML = '';

  var maxed = t.level >= def.levels.length - 1;
  var upBtn = document.createElement('button');
  upBtn.className = 'sheetBtn upgrade';
  if (maxed) {
    upBtn.disabled = true;
    upBtn.innerHTML = '<span class="sbEmoji">⬆️</span><span class="sbBody"><span class="sbName">Max Level</span></span>';
  } else {
    var nextLvl = def.levels[t.level + 1];
    var upCost = effectiveCost(nextLvl.cost);
    var afford = state.gold >= upCost;
    upBtn.disabled = !afford;
    upBtn.innerHTML = '<span class="sbEmoji">⬆️</span><span class="sbBody"><span class="sbName">Upgrade to Lv ' + (t.level + 2) + '</span>' +
      '<span class="sbDesc">+dmg / +range</span></span><span class="sbCost">' + upCost + 'g</span>';
    upBtn.addEventListener('click', function () { if (upgradeTower(col, row)) openTowerSheet(col, row); });
  }
  dom.sheetRow.appendChild(upBtn);

  var refund = Math.round(t.spent * SELL_REFUND_RATIO);
  var sellBtn = document.createElement('button');
  sellBtn.className = 'sheetBtn sell';
  sellBtn.innerHTML = '<span class="sbEmoji">💱</span><span class="sbBody"><span class="sbName">Sell</span></span><span class="sbCost">+' + refund + 'g</span>';
  sellBtn.addEventListener('click', function () { sellTower(col, row); closeSheet(); });
  dom.sheetRow.appendChild(sellBtn);

  dom.sheetBackdrop.classList.add('show');
  dom.sheet.classList.add('show');
}

// ------------------------------------------------------------------
// Input
// ------------------------------------------------------------------
// Handles a tap on the board, whether it came straight from the canvas or was
// redirected here after closing an already-open sheet (see handleSheetBackdropClick) —
// switching the selected cell used to take two taps: one to dismiss the old
// sheet (absorbed by the full-screen backdrop) and a second to act on the new
// cell. Routing both entry points through here makes a tap on a different cell
// switch selection immediately, including mid-wave.
export function handleBoardTap(clientX, clientY) {
  audio.unlock();
  if (state.paused || state.phase === 'gameover') return;
  var rect = dom.canvas.getBoundingClientRect();
  var x = clientX - rect.left, y = clientY - rect.top;
  var col = Math.floor(x / cellSize), row = Math.floor(y / cellSize);
  if (!inBounds(col, row)) return;
  if (isSpecialCell(col, row)) return;
  var existing = towerAt(col, row);
  if (existing) {
    openTowerSheet(col, row);
  } else {
    if (wouldSeal(col, row)) {
      showToast('🚧 Path must stay open');
      audio.reject();
      return;
    }
    openBuildSheet(col, row);
  }
}
export function pointInRect(x, y, rect) { return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom; }

// ------------------------------------------------------------------
// Pause / overlays
// ------------------------------------------------------------------
var mirrorOpenedFromGameOver = false;

// Single source of truth for tower copy (TOWER_DEFS) instead of hand-duplicated
// howto-overlay prose — also lets the legend reflect Volt Coil's unlock state live.
export function renderTowerLegend() {
  dom.towerLegendEl.innerHTML = '';
  ['spire', 'prism', 'volt'].forEach(function (key) {
    var def = TOWER_DEFS[key];
    var locked = key === 'volt' && meta.thirdTower <= 0;
    var row = document.createElement('div');
    row.className = 'legend';
    if (locked) {
      row.innerHTML = '<div class="swatch" style="background:#3a3a4a;"></div><span>🔒 ' + def.name + ' — unlock in ⬡ Upgrades</span>';
    } else {
      row.innerHTML = '<div class="swatch" style="background:' + def.color + ';"></div><span>' + def.name + ' — ' + def.desc + '</span>';
    }
    dom.towerLegendEl.appendChild(row);
  });
}

export function pauseGame() {
  if (state.phase === 'gameover') return;
  state.paused = true;
  dom.pauseOverlay.classList.add('show');
}
export function resumeGame() {
  state.paused = false;
  dom.pauseOverlay.classList.remove('show');
}

// Help opens the card directly — no intermediate pauseOverlay screen underneath it.
// Tracks whether the run was actually live so closing only resumes if it was.
var helpWasRunning = false;
export function openHelp() {
  helpWasRunning = state.phase !== 'gameover' && !state.paused;
  if (helpWasRunning) state.paused = true;
  renderTowerLegend();
  dom.howtoOverlay.classList.add('show');
}
export function closeHelp() {
  dom.howtoOverlay.classList.remove('show');
  if (helpWasRunning) state.paused = false;
  helpWasRunning = false;
}
// Iteration 1 auto-paused on blur/hidden/pagehide (Flow Glider precedent). Q8 feedback:
// the run should keep going in the background — pause only via the explicit ⏸ button
// or opening a menu (help/Mirror), never implicitly on focus loss.

export function handleSpeedBtnClick() {
  cycleSpeedIndex();
  updateSpeedBtn();
}

export function renderMirrorNodes() {
  dom.mirrorEssenceEl.textContent = meta.essence + ' ⚡';
  dom.mirrorNodesEl.innerHTML = '';
  for (var key in META_NODES) {
    var node = META_NODES[key];
    var rank = meta[key];
    var row = document.createElement('div');
    row.className = 'mirrorNode';
    var pips = '';
    for (var i = 0; i < node.maxRank; i++) pips += '<span class="mnPip' + (i < rank ? ' filled' : '') + '"></span>';
    var maxed = rank >= node.maxRank;
    var cost = maxed ? null : node.cost[rank];
    var afford = !maxed && meta.essence >= cost;
    var whenLabel = node.when === 'now' ? 'Now' : 'Next run';
    row.innerHTML = '<span class="mnEmoji">' + node.emoji + '</span>' +
      '<span class="mnBody"><span class="mnName">' + node.name +
      '<span class="mnWhen ' + node.when + '">' + whenLabel + '</span>' +
      (node.maxRank > 1 ? '<span class="mnPips">' + pips + '</span>' : '') + '</span>' +
      '<span class="mnDesc">' + node.desc + '</span></span>' +
      '<button class="mnBuy" ' + (maxed || !afford ? 'disabled' : '') + '>' + (maxed ? 'Maxed' : cost + ' ⚡') + '</button>';
    if (!maxed) {
      row.querySelector('.mnBuy').addEventListener('click', function (k, c) {
        return function () {
          if (meta.essence < c || meta[k] >= META_NODES[k].maxRank) return;
          meta.essence -= c;
          meta[k] += 1;
          saveMeta();
          renderMirrorNodes();
        };
      }(key, cost));
    }
    dom.mirrorNodesEl.appendChild(row);
  }
}
export function openMirror(fromGameOver) {
  mirrorOpenedFromGameOver = !!fromGameOver;
  if (fromGameOver) { dom.gameoverOverlay.classList.remove('show'); } else { state.paused = true; }
  renderMirrorNodes();
  dom.mirrorOverlay.classList.add('show');
}
export function closeMirror() {
  dom.mirrorOverlay.classList.remove('show');
  if (mirrorOpenedFromGameOver) { dom.gameoverOverlay.classList.add('show'); } else { state.paused = false; }
}

var gameOverHook = null;
// main.js registers a callback for best-wave tracking so gameplay.js doesn't
// need to know about that localStorage key directly.
export function setGameOverHook(fn) { gameOverHook = fn; }

export function triggerGameOver() {
  state.phase = 'gameover';
  audio.gameover();
  var earned = essenceReward(state.wave, state.killedThisRun);
  meta.essence += earned;
  saveMeta();
  dom.goWave.textContent = state.wave;
  dom.goStats.textContent = 'Enemies defeated: ' + state.killedThisRun;
  dom.goEssence.textContent = '+' + earned + ' ⚡ Essence banked (total ' + meta.essence + ')';
  dom.gameoverOverlay.classList.add('show');
  if (gameOverHook) gameOverHook(state.wave);
}

// ------------------------------------------------------------------
// Main loop
// ------------------------------------------------------------------
var lastT = null;
export function loop(ts) {
  requestAnimationFrame(loop);
  if (lastT === null) lastT = ts;
  var dt = Math.min((ts - lastT) / 1000, 0.05) * currentSpeed();
  lastT = ts;
  if (state.paused || state.phase === 'gameover') { draw(); return; }
  state.time += dt;
  updateSpawning(dt);
  updateEnemies(dt);
  if (state.phase === 'gameover') { draw(); return; }
  updateBombers(dt);
  updateTowers(dt);
  updateProjectiles(dt);
  updateParticles(dt);
  updateBlasts(dt);
  draw();
}

export function resetGame() {
  resetState();
  rebuildDistField();
  updateHud();
  lastT = null;
}
