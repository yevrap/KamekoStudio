(function () {
'use strict';

// ─── Arcade Decks ─────────────────────────────────────────────────────────────

const BUILTIN_DECKS = [
  { id: 'b-capitals', name: 'World Capitals', pairs: [
    {k:'France',v:'Paris'},{k:'Japan',v:'Tokyo'},{k:'Germany',v:'Berlin'},
    {k:'Brazil',v:'Brasilia'},{k:'Australia',v:'Canberra'},{k:'Canada',v:'Ottawa'},
    {k:'Italy',v:'Rome'},{k:'Spain',v:'Madrid'},{k:'China',v:'Beijing'},
    {k:'India',v:'New Delhi'},{k:'Mexico',v:'Mexico City'},{k:'Egypt',v:'Cairo'},
    {k:'Russia',v:'Moscow'},{k:'UK',v:'London'},{k:'Greece',v:'Athens'},
    {k:'Norway',v:'Oslo'},{k:'Poland',v:'Warsaw'},{k:'Thailand',v:'Bangkok'},
    {k:'Kenya',v:'Nairobi'},{k:'Argentina',v:'Buenos Aires'}
  ]},
  { id: 'b-math', name: 'Multiplication', pairs: [
    {k:'3 × 3',v:'9'},{k:'3 × 4',v:'12'},{k:'4 × 4',v:'16'},{k:'4 × 6',v:'24'},
    {k:'6 × 6',v:'36'},{k:'6 × 7',v:'42'},{k:'7 × 7',v:'49'},{k:'7 × 8',v:'56'},
    {k:'8 × 8',v:'64'},{k:'8 × 9',v:'72'},{k:'9 × 9',v:'81'},{k:'6 × 8',v:'48'}
  ]},
  { id: 'b-elements', name: 'Elements', pairs: [
    {k:'H',v:'Hydrogen'},{k:'He',v:'Helium'},{k:'Li',v:'Lithium'},{k:'C',v:'Carbon'},
    {k:'N',v:'Nitrogen'},{k:'O',v:'Oxygen'},{k:'Na',v:'Sodium'},{k:'Fe',v:'Iron'},
    {k:'Au',v:'Gold'},{k:'Ag',v:'Silver'},{k:'Cu',v:'Copper'},{k:'K',v:'Potassium'},
    {k:'Ca',v:'Calcium'},{k:'Mg',v:'Magnesium'},{k:'Al',v:'Aluminium'},{k:'Zn',v:'Zinc'}
  ]}
];

// ─── T9 ───────────────────────────────────────────────────────────────────────

const T9_MAP = {
  '2':['a','b','c'],'3':['d','e','f'],'4':['g','h','i'],
  '5':['j','k','l'],'6':['m','n','o'],'7':['p','q','r','s'],
  '8':['t','u','v'],'9':['w','x','y','z']
};

const T9_KEYS = [
  {n:'1',l:'',id:'t9-key-next'},{n:'2',l:'ABC'},{n:'3',l:'DEF'},
  {n:'4',l:'GHI'},{n:'5',l:'JKL'},{n:'6',l:'MNO'},
  {n:'7',l:'PQRS'},{n:'8',l:'TUV'},{n:'9',l:'WXYZ'},
  {n:'⌫',l:'',a:'back'},{n:'0',l:''},{n:'✓',l:'',a:'ok'}
];

// ─── Tower type definitions ────────────────────────────────────────────────────

const TTYPES = [
  {name:'Basic', color:'#4488ff',glow:'#4488ff',range:95, dmg:14,rate:1.4, streak:0},
  {name:'Rapid', color:'#ff44aa',glow:'#ff44aa',range:62, dmg:7, rate:0.45,streak:3},
  {name:'Sniper',color:'#ffaa00',glow:'#ffaa00',range:165,dmg:38,rate:2.4, streak:5},
  {name:'Splash',color:'#44ffaa',glow:'#44ffaa',range:82, dmg:18,rate:1.6, streak:8, splash:true}
];

// ─── Constants ────────────────────────────────────────────────────────────────

const TR = 14;
const ER_X = 11, ER_Y = 8, PR = 4;
const RING_ANGLES = 12;
const RINGS = [1.22, 1.46];

// ─── State ────────────────────────────────────────────────────────────────────

let gameState = 'menu';
let chillMode = false;
let deck = [];
let deckIdx = 0;
let currentPair = null;
let numericMode = false;
let wave = 0, score = 0, waveScore = 0;
let streak = 0, correctW = 0, wrongW = 0;
let waveStartTime = 0;
let totalSpawned = 0, totalThisWave = 0;
let spawnTimer = 0, spawnInterval = 1.0;
let answerCount = 0;
let hintUsed = false;

let enemies = [], towers = [], projs = [], particles = [], ripples = [], floats = [], stars = [];
let slots = [], selectedTower = null, waveOver = false;

let inputMode = localStorage.getItem('keypadQuest_inputMode') || 'scroll';
let t9buf = '', t9pend = '', t9pendKey = '', t9pendIdx = 0, t9timer = null;
let t9pos = 0; // predict mode: position in currentPair.v

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
let W = 0, H = 0, pathCX = 0, pathCY = 0, pathRX = 0, pathRY = 0, rafId = null, lastTs = 0;

// ─── Multi-deck storage ───────────────────────────────────────────────────────

let userDecks = [];      // [{ id, name, pairs }]
let activeDeckIds = [];  // IDs of selected decks (built-in + user)
let pendingImport = null; // deck data from ?import= URL param

function loadDecks() {
  // Migrate old single custom deck if present
  const old = localStorage.getItem('keypadQuest_customDeck');
  if (old) {
    try {
      const pairs = JSON.parse(old);
      if (pairs.length > 0) {
        const id = 'u-' + Date.now();
        const migrated = JSON.parse(localStorage.getItem('keypadQuest_decks') || '[]');
        if (!migrated.find(d => d.name === 'My Deck')) {
          migrated.unshift({ id, name: 'My Deck', pairs });
          localStorage.setItem('keypadQuest_decks', JSON.stringify(migrated));
        }
      }
    } catch(e) {}
    localStorage.removeItem('keypadQuest_customDeck');
  }
  try { userDecks = JSON.parse(localStorage.getItem('keypadQuest_decks') || '[]'); } catch(e) { userDecks = []; }
  try { activeDeckIds = JSON.parse(localStorage.getItem('keypadQuest_activeDeckIds') || 'null'); } catch(e) { activeDeckIds = null; }
  if (!activeDeckIds) activeDeckIds = BUILTIN_DECKS.map(d => d.id); // default: all built-in
  updateMenuPlayBtn();
}

function saveDecks() {
  localStorage.setItem('keypadQuest_decks', JSON.stringify(userDecks));
}

// ─── Deck text format helpers (parsePlainText, deckToPlainText: see shared/utils.js)

function deckToShareUrl(deck) {
  const payload = btoa(JSON.stringify({ name: deck.name, pairs: deck.pairs }));
  return location.origin + location.pathname + '?import=' + payload;
}

function saveActiveDeckIds() {
  localStorage.setItem('keypadQuest_activeDeckIds', JSON.stringify(activeDeckIds));
  updateMenuPlayBtn();
}

function getAllDecks() {
  return [...BUILTIN_DECKS, ...userDecks];
}

function buildActiveDeck() {
  const all = getAllDecks();
  const pairs = [];
  for (const id of activeDeckIds) {
    const d = all.find(x => x.id === id);
    if (d) pairs.push(...d.pairs);
  }
  return pairs;
}

function activePairCount() { return buildActiveDeck().length; }
function activeDeckCount() { return activeDeckIds.length; }

function updateMenuPlayBtn() {
  const count = activePairCount();
  const deckCount = activeDeckCount();
  const btn = document.getElementById('btn-play');
  if (!btn) return;
  if (count === 0) {
    btn.textContent = '▶ Play — select a deck first';
    btn.disabled = true; btn.style.opacity = '0.4';
  } else {
    btn.textContent = '▶ Play — ' + count + ' pairs from ' + deckCount + ' deck' + (deckCount > 1 ? 's' : '');
    btn.disabled = false; btn.style.opacity = '';
  }
}

// ─── Persistence ──────────────────────────────────────────────────────────────

function getHW() { return parseInt(localStorage.getItem('keypadQuestHighWave') || '0', 10); }
function saveHW(w) { if (w > getHW()) localStorage.setItem('keypadQuestHighWave', w); }
function getBT(n) { return parseInt(localStorage.getItem('keypadQuestBestTime_' + n) || '0', 10); }
function saveBT(n, ms) {
  const p = getBT(n);
  if (p === 0 || ms < p) { localStorage.setItem('keypadQuestBestTime_' + n, ms); return true; }
  return false;
}
function saveCP() {
  if (wave % 5 !== 0) return;
  const data = { wave, score, towers: towers.map(t => ({ si: slots.indexOf(t.slot), ti: t.ti, lv: t.lv })), ts: Date.now() };
  localStorage.setItem('keypadQuestCheckpoint', JSON.stringify(data));
}
function loadCP() { try { return JSON.parse(localStorage.getItem('keypadQuestCheckpoint')); } catch(e) { return null; } }
function clearCP() { localStorage.removeItem('keypadQuestCheckpoint'); }

// ─── Canvas / Slots ───────────────────────────────────────────────────────────

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;
  canvas.width = Math.floor(rect.width); canvas.height = Math.floor(rect.height);
  W = canvas.width; H = canvas.height;
  const outerScale = Math.max(...RINGS);
  const slotMarginX = 32, slotMarginY = 38;
  pathCX = W * 0.5; pathCY = H * 0.44;
  pathRX = (W / 2 - slotMarginX) / outerScale;
  const topRoom = pathCY - slotMarginY;
  const botRoom = (H - pathCY) - slotMarginY;
  pathRY = Math.min(Math.min(topRoom, botRoom) / outerScale, pathRX * 0.68);
  buildSlots(); buildStars();
}

function buildSlots() {
  slots = [];
  for (const scale of RINGS) {
    for (let i = 0; i < RING_ANGLES; i++) {
      const ang = (i / RING_ANGLES) * Math.PI * 2;
      slots.push({
        x: pathCX + Math.cos(ang) * pathRX * scale,
        y: pathCY + Math.sin(ang) * pathRY * scale,
        occupied: false, tower: null
      });
    }
  }
}

// ─── Stars ────────────────────────────────────────────────────────────────────

function buildStars() {
  stars = Array.from({length:60}, () => ({
    x: Math.random()*W, y: Math.random()*H, r: Math.random()*1.2+0.3,
    a: Math.random()*0.35+0.05, vx: (Math.random()-0.5)*0.08, vy: (Math.random()-0.5)*0.08
  }));
}

function drawStars() {
  ctx.save();
  for (const s of stars) {
    s.x = (s.x + s.vx + W) % W; s.y = (s.y + s.vy + H) % H;
    ctx.globalAlpha = s.a; ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha = 1; ctx.restore();
}

// ─── Particles ────────────────────────────────────────────────────────────────

function burst(x, y, color, n) {
  for (let i = 0; i < n; i++) {
    const a = (Math.PI*2/n)*i + Math.random()*0.4, spd = 1.5 + Math.random()*3;
    particles.push({ x, y, vx: Math.cos(a)*spd, vy: Math.sin(a)*spd,
      a: 1, r: 1.5+Math.random()*2, color, decay: 0.03+Math.random()*0.02 });
  }
}

function ripple(x, y, color) { ripples.push({ x, y, r: TR, maxR: 65, color, a: 0.85 }); }
function floatText(x, y, text, color) { floats.push({ x, y: y-8, text, color, a: 1, vy: -0.75 }); }

function updateFX() {
  for (const p of particles) { p.x+=p.vx; p.y+=p.vy; p.vy+=0.05; p.a-=p.decay; }
  particles = particles.filter(p => p.a > 0);
  for (const r of ripples) { r.r += 2.2; r.a -= 0.042; }
  ripples = ripples.filter(r => r.a > 0 && r.r < r.maxR);
  for (const f of floats) { f.y += f.vy; f.a -= 0.018; }
  floats = floats.filter(f => f.a > 0);
}

// ─── Enemies ──────────────────────────────────────────────────────────────────

function makeEnemy() {
  const hp = Math.round(10 * Math.pow(1.2, wave - 1));
  let pixelSpd = 55 * Math.pow(1.03, wave - 1);
  if (chillMode) pixelSpd *= 0.5;
  const avgR = (pathRX + pathRY) / 2;
  const spd = pixelSpd / avgR; // radians per second
  const angle = -Math.PI + (totalSpawned / Math.max(totalThisWave, 1)) * Math.PI * 0.4;
  const ex = pathCX + Math.cos(angle) * pathRX;
  const ey = pathCY + Math.sin(angle) * pathRY;
  return { angle, spd, hp, maxHp: hp, ex, ey, trail: [], dead: false };
}

function updateEnemies(dt) {
  for (const e of enemies) {
    if (e.dead) continue;
    e.trail.unshift({x: e.ex, y: e.ey});
    if (e.trail.length > 9) e.trail.pop();
    e.angle += e.spd * dt;
    e.ex = pathCX + Math.cos(e.angle) * pathRX;
    e.ey = pathCY + Math.sin(e.angle) * pathRY;
  }
  enemies = enemies.filter(e => !e.dead);
}

function killEnemy(e) {
  if (e.dead) return;
  e.dead = true;
  burst(e.ex, e.ey, lerpHex('#4488ff','#ff4422', 1 - e.hp/e.maxHp), 12);
  waveScore += 10;
}

// ─── Towers ───────────────────────────────────────────────────────────────────

function makeTower(slot, ti) {
  return { slot, ti, type: TTYPES[ti], lv: 1, cd: 0, pulse: Math.random()*Math.PI*2 };
}

function placeTower(ti) {
  const slot = bestSlot();
  if (!slot) return;
  slot.occupied = true;
  const t = makeTower(slot, ti);
  slot.tower = t; towers.push(t);
  ripple(slot.x, slot.y, TTYPES[ti].color);
  burst(slot.x, slot.y, TTYPES[ti].color, 10);
  if (navigator.vibrate) navigator.vibrate(30);
}

function bestSlot() {
  const free = slots.filter(s => !s.occupied);
  if (free.length === 0) return null;
  if (towers.length === 0) return free.reduce((a, b) => a.x < b.x ? a : b);
  let best = null, bestScore = -1;
  for (const s of free) {
    let minD = Infinity;
    for (const t of towers) {
      const d = Math.hypot(s.x - t.slot.x, s.y - t.slot.y);
      if (d < minD) minD = d;
    }
    if (minD > bestScore) { bestScore = minD; best = s; }
  }
  return best;
}

function upgradeRandom() {
  if (towers.length === 0) return;
  const t = towers[Math.floor(Math.random()*towers.length)];
  t.lv++;
  floatText(t.slot.x, t.slot.y, '▲ Lv'+t.lv, t.type.color);
  ripple(t.slot.x, t.slot.y, t.type.color);
}

function updateTowers(dt) {
  for (const t of towers) {
    t.pulse += dt * 1.8;
    if (t.cd > 0) { t.cd -= dt; continue; }
    let target = null, minD = Infinity;
    for (const e of enemies) {
      if (e.dead) continue;
      const d = Math.hypot(e.ex - t.slot.x, e.ey - t.slot.y);
      if (d <= t.type.range && d < minD) { minD = d; target = e; }
    }
    if (!target) continue;
    t.cd = t.type.rate;
    const dx = target.ex - t.slot.x, dy = target.ey - t.slot.y, len = Math.hypot(dx, dy) || 1;
    projs.push({ x: t.slot.x, y: t.slot.y, vx: (dx/len)*210, vy: (dy/len)*210,
      dmg: t.type.dmg * t.lv, color: t.type.color, splash: !!t.type.splash, trail: [], dead: false });
  }
}

// ─── Projectiles ──────────────────────────────────────────────────────────────

function updateProjs(dt) {
  for (const p of projs) {
    if (p.dead) continue;
    p.trail.unshift({x:p.x, y:p.y});
    if (p.trail.length > 4) p.trail.pop();
    p.x += p.vx*dt; p.y += p.vy*dt;
    for (const e of enemies) {
      if (e.dead) continue;
      if (Math.abs(p.x-e.ex) < ER_X && Math.abs(p.y-e.ey) < ER_Y) {
        if (p.splash) {
          for (const e2 of enemies) {
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
    if (p.x < -20 || p.x > W+20 || p.y < -20 || p.y > H+20) p.dead = true;
  }
  projs = projs.filter(p => !p.dead);
}

// ─── Wave management ──────────────────────────────────────────────────────────

function startWave(n) {
  wave = n; waveScore = 0; correctW = 0; wrongW = 0;
  waveStartTime = performance.now();
  totalThisWave = 5 + wave * 2; totalSpawned = 0;
  spawnInterval = Math.max(0.2, 1.0 - (wave-1)*0.03); spawnTimer = 0;
  enemies = []; projs = []; particles = []; ripples = []; floats = [];
  selectedTower = null; waveOver = false;
  document.getElementById('wave-display').textContent = 'Wave ' + wave;
  if (!currentPair) showNextPrompt();
}

function updateWave(dt) {
  if (totalSpawned < totalThisWave) {
    spawnTimer -= dt;
    if (spawnTimer <= 0) { enemies.push(makeEnemy()); totalSpawned++; spawnTimer = spawnInterval; }
  }
  if (!waveOver && totalSpawned >= totalThisWave) {
    const alive = enemies.filter(e => !e.dead);
    if (alive.length === 0) { waveOver = true; endWave(); }
  }
}

function endWave() {
  const elapsed = performance.now() - waveStartTime;
  score += waveScore;
  saveHW(wave);
  const newBest = !chillMode && saveBT(wave, elapsed);
  if (!chillMode && wave % 5 === 0) saveCP();
  const msg = newBest ? 'Wave ' + wave + ' — new best!' : 'Wave ' + wave + ' clear!';
  floatText(pathCX, pathCY - pathRY * 0.5, msg, '#00ffee');
  startWave(wave + 1);
}

// ─── Drawing ──────────────────────────────────────────────────────────────────

function drawPath() {
  ctx.save();
  ctx.shadowBlur = 24; ctx.shadowColor = '#00ffee'; ctx.strokeStyle = '#00ffee33'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.ellipse(pathCX, pathCY, pathRX, pathRY, 0, 0, Math.PI*2); ctx.stroke();
  ctx.shadowBlur = 8; ctx.strokeStyle = '#00ffee88'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.ellipse(pathCX, pathCY, pathRX, pathRY, 0, 0, Math.PI*2); ctx.stroke();
  ctx.restore();
}

function drawSlots() {
  ctx.save();
  for (const s of slots) {
    if (s.occupied) continue;
    ctx.globalAlpha = 0.22; ctx.strokeStyle = '#4488ff';
    ctx.shadowBlur = 5; ctx.shadowColor = '#4488ff'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(s.x, s.y, TR-1, 0, Math.PI*2); ctx.stroke();
  }
  ctx.globalAlpha = 1; ctx.restore();
}

function drawTowers() {
  ctx.save();
  for (const t of towers) {
    const sx = t.slot.x, sy = t.slot.y, p = Math.sin(t.pulse)*0.3+0.7;
    ctx.shadowBlur = 14 + p*10; ctx.shadowColor = t.type.glow; ctx.fillStyle = t.type.color; ctx.globalAlpha = 0.88;
    ctx.beginPath(); ctx.arc(sx, sy, TR, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha = 1; ctx.fillStyle = '#fff'; ctx.shadowBlur = 3; ctx.shadowColor = '#fff';
    ctx.font = 'bold 9px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(t.lv > 1 ? t.lv : t.type.name[0], sx, sy);
    if (selectedTower === t) {
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
  ctx.save();
  for (const e of enemies) {
    if (e.dead) continue;
    const hp = e.hp/e.maxHp, color = lerpHex('#4488ff','#ff4422', 1-hp);
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
  ctx.save();
  for (const p of projs) {
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
  ctx.save();
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0,p.a); ctx.shadowBlur = 5; ctx.shadowColor = p.color; ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
  }
  for (const r of ripples) {
    ctx.globalAlpha = Math.max(0,r.a); ctx.strokeStyle = r.color;
    ctx.shadowBlur = 8; ctx.shadowColor = r.color; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, Math.PI*2); ctx.stroke();
  }
  ctx.font = 'bold 10px Courier New'; ctx.textAlign = 'center';
  for (const f of floats) {
    ctx.globalAlpha = Math.max(0,f.a); ctx.fillStyle = f.color;
    ctx.shadowBlur = 7; ctx.shadowColor = f.color; ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1; ctx.restore();
}

function drawFrame() {
  ctx.fillStyle = 'rgba(5,5,16,0.84)'; ctx.fillRect(0, 0, W, H);
  drawStars(); drawPath(); drawSlots(); drawFX(); drawEnemies(); drawTowers(); drawProjs();
}

// ─── Game loop ────────────────────────────────────────────────────────────────

function loop(ts) {
  const dt = Math.min((ts - lastTs)/1000, 0.1); lastTs = ts;
  if (gameState === 'playing') {
    updateWave(dt); updateEnemies(dt); updateTowers(dt); updateProjs(dt); updateFX();
  } else { updateFX(); }
  drawFrame();
  rafId = requestAnimationFrame(loop);
}

function startLoop() {
  if (rafId) cancelAnimationFrame(rafId);
  lastTs = performance.now(); rafId = requestAnimationFrame(loop);
}

// ─── T9 input ────────────────────────────────────────────────────────────────

function autoFillScrollSpecials() {
  if (!currentPair) return;
  const v = currentPair.v;
  while (t9buf.length < v.length && !/[a-z0-9]/i.test(v[t9buf.length])) {
    t9buf += v[t9buf.length];
  }
  updateInputDisplay();
}

function confirmScrollChar() {
  if (!t9pend) return;
  t9buf += t9pend; t9pend = ''; t9pendKey = ''; t9pendIdx = 0;
  autoFillScrollSpecials();
}

function flashInputError() {
  const el = document.getElementById('input-display');
  const meta = document.getElementById('predict-meta');
  el.style.color = '#ff4466';
  el.style.textShadow = '0 0 14px #ff4466';
  if (meta) { meta.textContent = 'wrong key'; meta.style.color = '#ff4466'; }
  setTimeout(() => {
    el.style.color = '';
    el.style.textShadow = '';
    if (meta) { meta.textContent = ''; meta.style.color = ''; }
  }, 350);
}

function handleT9(key) {
  if (gameState !== 'playing') return;

  if (key === 'back') {
    clearTimeout(t9timer);
    if (inputMode === 'scroll') {
      if (t9pend) { t9pend = ''; t9pendKey = ''; t9pendIdx = 0; }
      else if (t9buf.length > 0) {
        // Strip any trailing auto-filled special chars first, then remove the last typed char
        while (t9buf.length > 0 && !/[a-z0-9]/i.test(t9buf[t9buf.length - 1])) {
          t9buf = t9buf.slice(0, -1);
        }
        if (t9buf.length > 0) t9buf = t9buf.slice(0, -1);
      }
      autoFillScrollSpecials();
    } else if (inputMode === 'predict' && currentPair && t9pos > 0) {
      const v = currentPair.v;
      let pos = t9pos;
      // Step back past any auto-inserted special chars, then one typeable char
      while (pos > 0 && !/[a-z0-9]/i.test(v[pos - 1])) pos--;
      if (pos > 0) pos--;
      t9pos = pos;
    }
    updateInputDisplay(); return;
  }

  if (key === 'ok') {
    if (inputMode === 'scroll') {
      clearTimeout(t9timer); confirmScrollChar();
      if (t9buf.length > 0) { submitAnswer(t9buf); }
      else flashInputError();
    } else if (inputMode === 'predict') {
      if (currentPair && t9pos >= currentPair.v.length) submitAnswer(currentPair.v);
      else flashInputError();
    }
    updateInputDisplay(); return;
  }

  if (inputMode === 'scroll') {
    if (/^[0-9]$/.test(key)) {
      // Direct digit entry: always for all-digit answers, or when expected char at current position is a digit
      const currentPos = t9buf.length + (t9pend ? 1 : 0);
      const expectedAtPos = currentPair?.v[currentPos];
      if (numericMode || !T9_MAP[key] || /^[0-9]$/.test(expectedAtPos)) {
        clearTimeout(t9timer); confirmScrollChar();
        t9buf += key; autoFillScrollSpecials(); return;
      }
    }
    const letters = T9_MAP[key];
    if (!letters || letters.length === 0) return;
    clearTimeout(t9timer);
    if (t9pendKey === key) {
      t9pendIdx = (t9pendIdx + 1) % (letters.length + 1);
      t9pend = t9pendIdx === letters.length ? key : letters[t9pendIdx].toUpperCase();
    } else {
      confirmScrollChar(); t9pendKey = key; t9pendIdx = 0; t9pend = letters[0].toUpperCase();
    }
    t9timer = setTimeout(confirmScrollChar, 820);
    updateInputDisplay();
  } else if (inputMode === 'predict') {
    if (!currentPair) return;
    const v = currentPair.v;
    if (t9pos >= v.length) return;
    const expected = v[t9pos].toLowerCase();
    const isDigit = /^[0-9]$/.test(expected);
    const correct = isDigit
      ? (key === expected)
      : (T9_MAP[key] || []).includes(expected);
    if (correct) {
      t9pos++;
      while (t9pos < v.length && !/[a-z0-9]/i.test(v[t9pos])) t9pos++;
      updateInputDisplay();
    } else {
      flashInputError();
    }
  }
}

function updateInputDisplay() {
  const el = document.getElementById('input-display');
  const meta = document.getElementById('predict-meta');
  if (inputMode === 'scroll') {
    if (numericMode) {
      const expected = currentPair ? currentPair.v.length : 1;
      let display = t9buf;
      for (let i = t9buf.length; i < expected; i++) display += '_';
      el.textContent = display || '_';
      if (meta) meta.textContent = '[123]';
    } else {
      if (currentPair) {
        const v = currentPair.v.toUpperCase();
        let display = '';
        for (let i = 0; i < v.length; i++) {
          if (i < t9buf.length) {
            display += t9buf[i];
          } else if (t9pend && i === t9buf.length) {
            display += '[' + t9pend + ']';
          } else {
            display += /[A-Z0-9]/.test(v[i]) ? '_' : v[i];
          }
        }
        el.textContent = display;
      } else {
        el.textContent = (t9buf + (t9pend ? '['+t9pend+']' : '')) || '▶';
      }
      if (meta) meta.textContent = '';
    }
  } else if (inputMode === 'predict') {
    if (!currentPair) {
      el.textContent = '▶'; if (meta) meta.textContent = ''; return;
    }
    const v = currentPair.v.toUpperCase();
    let display = '';
    for (let i = 0; i < v.length; i++) {
      if (i < t9pos) {
        display += v[i]; // revealed (including auto-inserted specials)
      } else {
        display += /[A-Z0-9]/.test(v[i]) ? '_' : v[i]; // show structure of specials
      }
    }
    el.textContent = display;
    if (meta) meta.textContent = '';
  } else {
    const ki = document.getElementById('keyboard-input');
    const val = ki.value; // alphanumeric only
    if (!currentPair) {
      el.textContent = val || '▶'; if (meta) meta.textContent = ''; return;
    }
    const v = currentPair.v.toUpperCase();
    let display = '';
    let ci = 0;
    for (let i = 0; i < v.length; i++) {
      if (/[A-Z0-9]/.test(v[i])) {
        display += ci < val.length ? val[ci++].toUpperCase() : '_';
      } else {
        display += v[i];
      }
    }
    el.textContent = display || '▶';
    const fb = document.getElementById('keyboard-focus-btn');
    if (fb) fb.textContent = val ? 'typing... ▸' : 'Tap to type ▸';
    if (meta) meta.textContent = '';
  }
}

// ─── Hint ─────────────────────────────────────────────────────────────────────

function showHint() {
  if (!currentPair || hintUsed) return;
  hintUsed = true;
  if (!chillMode) { streak = 0; updateStreakDisplay(); }
  const el = document.getElementById('hint-text');
  el.textContent = '→ ' + currentPair.v;
  el.classList.add('visible');
  document.getElementById('btn-hint').classList.add('used');
  setTimeout(() => { el.classList.remove('visible'); }, 2500);
}

// ─── Answer handling ──────────────────────────────────────────────────────────

function showNextPrompt() {
  if (!deck.length) return;
  currentPair = deck[deckIdx % deck.length]; deckIdx++;
  numericMode = /^\d+$/.test(currentPair.v);
  document.getElementById('question-text').textContent = currentPair.k;
  t9buf = ''; t9pend = ''; t9pendKey = ''; t9pendIdx = 0; t9pos = 0;
  if (inputMode === 'predict' && currentPair) {
    const v = currentPair.v;
    while (t9pos < v.length && !/[a-z0-9]/i.test(v[t9pos])) t9pos++;
  }
  if (inputMode === 'scroll') autoFillScrollSpecials();
  if (inputMode === 'keyboard') { const ki = document.getElementById('keyboard-input'); if (ki) ki.value = ''; }
  hintUsed = false;
  document.getElementById('btn-hint').classList.remove('used');
  const ht = document.getElementById('hint-text');
  ht.classList.remove('visible'); ht.textContent = '';
  updateInputDisplay();
  if (inputMode === 'keyboard') setTimeout(() => document.getElementById('keyboard-input').focus(), 50);
}

// typeForStreak: see shared/utils.js

// Reconstructs the full answer by inserting typed alphanumeric chars into the
// special-char positions of the answer template. This lets keyboard mode accept
// only letters/digits while the game auto-inserts parens, spaces, hyphens, etc.
function buildKeyboardAnswer(typed) {
  if (!currentPair) return typed;
  const v = currentPair.v;
  let result = '';
  let ti = 0;
  for (let i = 0; i < v.length; i++) {
    if (/[a-z0-9]/i.test(v[i])) {
      result += ti < typed.length ? typed[ti++] : '\x00';
    } else {
      result += v[i];
    }
  }
  return result;
}

function submitAnswer(raw) {
  if (!currentPair) return;
  const ans = raw.trim().toLowerCase();
  const correct = ans === currentPair.v.toLowerCase();
  if (correct) {
    streak++; correctW++; answerCount++;
    placeTower(typeForStreak(streak));
    floatText(W/2, pathCY - pathRY - 20, '✓ '+currentPair.v, '#44ffaa');
    if (answerCount % 10 === 0) upgradeRandom();
    updateStreakDisplay();
    t9buf = ''; t9pend = ''; t9pendKey = ''; t9pendIdx = 0; t9pos = 0;
    showNextPrompt();
  } else {
    streak = 0; wrongW++;
    updateStreakDisplay();
    flashEl('rgba(255,50,50,0.14)');
    t9pend = ''; t9pendKey = ''; t9pendIdx = 0;
    updateInputDisplay();
    if (navigator.vibrate) navigator.vibrate([50,30,50]);
  }
}

function flashEl(bg) {
  const el = document.getElementById('feedback-flash');
  el.style.background = bg; el.style.opacity = '1';
  setTimeout(() => { el.style.opacity = '0'; }, 280);
}

function updateStreakDisplay() {
  document.getElementById('streak-display').textContent = streak >= 3 ? '⚡ ×'+streak : '';
  updateTowerStrip();
}

function buildTowerStrip() {
  const strip = document.getElementById('tower-strip');
  strip.innerHTML = '';
  TTYPES.forEach((tt, i) => {
    const chip = document.createElement('div');
    chip.className = 'tc'; chip.id = 'tc-' + i;
    const dot = document.createElement('div');
    dot.className = 'tc-dot'; dot.style.background = tt.color; dot.style.boxShadowColor = tt.color;
    const name = document.createElement('div');
    name.className = 'tc-name'; name.textContent = tt.name;
    const req = document.createElement('div');
    req.className = 'tc-req'; req.id = 'tc-req-' + i;
    req.textContent = tt.streak > 0 ? '×'+tt.streak+' streak' : 'default';
    chip.appendChild(dot); chip.appendChild(name); chip.appendChild(req);
    strip.appendChild(chip);
  });
  updateTowerStrip();
}

function updateTowerStrip() {
  const ti = typeForStreak(streak);
  TTYPES.forEach((tt, i) => {
    const chip = document.getElementById('tc-' + i);
    if (!chip) return;
    chip.classList.toggle('active', i === ti);
    const isNext = i === ti + 1;
    chip.classList.toggle('next-up', isNext && i < TTYPES.length);
    const req = document.getElementById('tc-req-' + i);
    if (!req) return;
    if (i === ti) {
      req.textContent = ti === TTYPES.length - 1 ? 'max!' : 'active';
    } else if (i < ti) {
      req.textContent = '✓ done';
    } else if (isNext) {
      const need = tt.streak - streak;
      req.textContent = need + ' more';
    } else {
      req.textContent = '×'+tt.streak+' streak';
    }
  });
}

// ─── Screens ──────────────────────────────────────────────────────────────────

function showMenu() {
  gameState = 'menu';
  towers = []; enemies = []; projs = [];
  for (const s of slots) { s.occupied = false; s.tower = null; }
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


// ─── Game start / continue ────────────────────────────────────────────────────

function startGame(mode, fromCP) {
  if (!window.KamekoTokens || !window.KamekoTokens.spend()) {
    if (window.KamekoTokens) window.KamekoTokens.toast();
    return;
  }
  localStorage.setItem('lastPlayed_keypadQuest', Date.now());
  chillMode = (mode === 'chill');

  const activePairs = buildActiveDeck();
  if (activePairs.length === 0) {
    window.KamekoTokens && window.KamekoTokens.add(1);
    alert('No pairs selected! Choose at least one deck from "Choose Decks".');
    return;
  }
  deck = shuffle(activePairs.slice());

  deckIdx = 0; answerCount = 0; streak = 0; score = 0; currentPair = null;
  document.getElementById('menu-overlay').classList.add('hidden');
  for (const s of slots) { s.occupied = false; s.tower = null; }
  towers = [];

  if (fromCP) {
    const cp = loadCP();
    if (cp) {
      score = cp.score || 0;
      if (cp.towers) {
        for (const td of cp.towers) {
          if (td.si >= 0 && td.si < slots.length) {
            const s = slots[td.si]; s.occupied = true;
            const t = makeTower(s, td.ti); t.lv = td.lv;
            s.tower = t; towers.push(t);
          }
        }
      }
      startWave(cp.wave + 1);
      gameState = 'playing';
      updateStreakDisplay(); updateInputDisplay(); return;
    }
  }
  clearCP();
  startWave(1);
  gameState = 'playing';
  updateStreakDisplay(); updateInputDisplay();
}

// ─── Input mode switching ─────────────────────────────────────────────────────

function setInputMode(mode) {
  clearTimeout(t9timer); t9timer = null;

  // Capture current progress as a character index into currentPair.v
  let progress = 0;
  const ki = document.getElementById('keyboard-input');
  if (currentPair) {
    if (inputMode === 'scroll') {
      const matchesPrefix = currentPair &&
        currentPair.v.toLowerCase().startsWith(t9buf.toLowerCase());
      progress = matchesPrefix ? t9buf.length : 0;
    }
    else if (inputMode === 'predict')  progress = t9pos;
    else if (inputMode === 'keyboard') {
      const typed = ki.value.toLowerCase();
      const ans   = currentPair.v.toLowerCase();
      progress = (ans.startsWith(typed) && typed.length > 0) ? typed.length : 0;
    }
  }

  // Clear pending scroll char state (never carries across modes)
  t9pend = ''; t9pendKey = ''; t9pendIdx = 0;

  // Convert progress to new mode's state representation
  if (mode === 'scroll') {
    t9buf = currentPair ? currentPair.v.slice(0, progress) : '';
    t9pos = 0;
    ki.value = '';
    autoFillScrollSpecials();
  } else if (mode === 'predict') {
    t9buf = '';
    t9pos = progress;
    if (t9pos === 0 && currentPair) {
      const v = currentPair.v;
      while (t9pos < v.length && !/[a-z0-9]/i.test(v[t9pos])) t9pos++;
    }
    ki.value = '';
  } else if (mode === 'keyboard') {
    const prefix = currentPair ? currentPair.v.slice(0, progress) : '';
    ki.value = prefix.replace(/[^a-z0-9]/gi, '');
    t9buf = ''; t9pos = 0;
  }

  inputMode = mode;
  localStorage.setItem('keypadQuest_inputMode', mode);

  const pad = document.getElementById('t9-pad');
  const kw  = document.getElementById('keyboard-wrap');
  if (mode === 'keyboard') {
    pad.style.display = 'none'; kw.style.display = '';
    if (gameState === 'playing') setTimeout(() => ki.focus(), 50);
  } else {
    pad.style.display = ''; kw.style.display = 'none';
  }
  document.querySelectorAll('.mode-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.mode === mode));

  updateInputDisplay();
}

function buildT9Pad() {
  const pad = document.getElementById('t9-pad');
  pad.innerHTML = '';
  for (const key of T9_KEYS) {
    const btn = document.createElement('button');
    btn.className = 't9-key' + (key.a ? ' ak' : '');
    if (key.id) btn.id = key.id;
    btn.innerHTML = '<span class="kn">'+key.n+'</span>' + (key.l ? '<span class="kl">'+key.l+'</span>' : '');
    const k = key.a || key.n;
    btn.addEventListener('pointerdown', e => { e.preventDefault(); btn.classList.add('pressed'); handleT9(k); });
    btn.addEventListener('pointerup',    () => btn.classList.remove('pressed'));
    btn.addEventListener('pointerleave', () => btn.classList.remove('pressed'));
    pad.appendChild(btn);
  }

}


// ─── Deck selector ────────────────────────────────────────────────────────────

function showDeckSelector() {
  document.getElementById('deck-selector-overlay').classList.remove('hidden');
  renderDeckSelector();
}

function hideDeckSelector() {
  document.getElementById('deck-selector-overlay').classList.add('hidden');
  updateMenuPlayBtn();
}

function renderDeckSelector() {
  const list = document.getElementById('deck-selector-list');
  list.innerHTML = '';
  const allDecks = getAllDecks();
  allDecks.forEach(d => {
    const isBuiltin = d.id.startsWith('b-');
    const isSel = activeDeckIds.includes(d.id);
    const row = document.createElement('div');
    row.className = 'ds-row' + (isSel ? ' sel' : '');
    const check = document.createElement('div');
    check.className = 'ds-check'; check.textContent = isSel ? '✓' : '';
    const info = document.createElement('div');
    info.className = 'ds-info';
    const name = document.createElement('div');
    name.className = 'ds-name'; name.textContent = d.name;
    const meta = document.createElement('div');
    meta.className = 'ds-meta'; meta.textContent = d.pairs.length + ' pairs';
    info.appendChild(name); info.appendChild(meta);
    row.appendChild(check); row.appendChild(info);
    if (isBuiltin) {
      const badge = document.createElement('div');
      badge.className = 'ds-badge'; badge.textContent = '★ Built-in';
      row.appendChild(badge);
    } else {
      const editBtn = document.createElement('button');
      editBtn.className = 'ds-edit'; editBtn.textContent = '✏';
      editBtn.addEventListener('click', e => { e.stopPropagation(); hideDeckSelector(); showDeckManager(d.id); });
      row.appendChild(editBtn);
    }
    row.addEventListener('click', () => {
      const idx = activeDeckIds.indexOf(d.id);
      if (idx >= 0) activeDeckIds.splice(idx, 1);
      else activeDeckIds.push(d.id);
      saveActiveDeckIds(); renderDeckSelector();
    });
    list.appendChild(row);
  });
  const btn = document.getElementById('btn-play-selected');
  if (btn) {
    const count = activePairCount();
    btn.textContent = count > 0 ? '▶ Play Selected (' + count + ' pairs)' : 'Select at least one deck';
    btn.disabled = count === 0; btn.style.opacity = count === 0 ? '0.4' : '';
  }
}

// ─── Deck manager ─────────────────────────────────────────────────────────────

function showDeckManager(focusDeckId) {
  document.getElementById('deck-overlay').classList.remove('hidden');
  document.getElementById('deck-new-form-wrap').style.display = 'none';
  document.getElementById('deck-new-form-wrap').innerHTML = '';
  document.getElementById('deck-import-wrap').style.display = 'none';
  document.getElementById('deck-import-wrap').innerHTML = '';
  renderDeckManagerList(focusDeckId);
}

function hideDeckManager() {
  document.getElementById('deck-overlay').classList.add('hidden');
}

// ─── Import prompt (URL share link) ──────────────────────────────────────────

function showImportPrompt(data) {
  pendingImport = data;
  const overlay = document.getElementById('import-prompt-overlay');
  document.getElementById('import-deck-name').textContent = '"' + data.name + '"';
  document.getElementById('import-deck-meta').textContent = data.pairs.length + ' pairs';
  const existing = userDecks.find(d => d.name === data.name);
  const btn = document.getElementById('btn-import-confirm');
  btn.textContent = existing ? 'Replace "' + data.name + '"?' : 'Import as New Deck';
  overlay.style.display = 'flex';
}

function hideImportPrompt() {
  document.getElementById('import-prompt-overlay').style.display = 'none';
  pendingImport = null;
}

function doImport(data) {
  if (!data) return;
  const existingIdx = userDecks.findIndex(d => d.name === data.name);
  if (existingIdx >= 0) {
    userDecks[existingIdx].pairs = data.pairs;
  } else {
    userDecks.push({ id: 'u-' + Date.now(), name: data.name, pairs: data.pairs });
  }
  saveDecks();
  updateMenuPlayBtn();
}

document.getElementById('btn-import-confirm').addEventListener('click', () => {
  doImport(pendingImport);
  hideImportPrompt();
  // If deck manager is open, refresh it
  if (!document.getElementById('deck-overlay').classList.contains('hidden')) {
    renderDeckManagerList(null);
  }
});
document.getElementById('btn-import-cancel').addEventListener('click', hideImportPrompt);

// ─── Paste import textarea ────────────────────────────────────────────────────

function showImportTextarea() {
  const wrap = document.getElementById('deck-import-wrap');
  if (wrap.style.display !== 'none') { wrap.style.display = 'none'; wrap.innerHTML = ''; return; }
  // Also hide new deck form if open
  document.getElementById('deck-new-form-wrap').style.display = 'none';
  document.getElementById('deck-new-form-wrap').innerHTML = '';
  const form = document.createElement('div');
  form.className = 'deck-form';
  const ta = document.createElement('textarea');
  ta.rows = 7;
  ta.placeholder = '# Deck Name\nquestion: answer\nquestion: answer';
  ta.style.cssText = 'width:100%;padding:10px 12px;font-size:0.82em;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:#fff;font-family:"Courier New",monospace;outline:none;resize:vertical;touch-action:auto;-webkit-user-select:auto;user-select:auto;';
  ta.addEventListener('focus', () => { ta.style.borderColor = 'rgba(0,255,238,0.5)'; });
  ta.addEventListener('blur',  () => { ta.style.borderColor = 'rgba(255,255,255,0.2)'; });
  const btns = document.createElement('div');
  btns.className = 'deck-form-btns';
  const importBtn = document.createElement('button');
  importBtn.className = 'save'; importBtn.textContent = 'Import Deck';
  importBtn.addEventListener('click', () => {
    const parsed = parsePlainText(ta.value);
    if (!parsed) { ta.style.borderColor = 'rgba(255,80,80,0.6)'; return; }
    doImport(parsed);
    wrap.style.display = 'none'; wrap.innerHTML = '';
    renderDeckManagerList(null);
  });
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'cancel'; cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', () => { wrap.style.display = 'none'; wrap.innerHTML = ''; });
  btns.appendChild(importBtn); btns.appendChild(cancelBtn);
  form.appendChild(ta); form.appendChild(btns);
  wrap.appendChild(form); wrap.style.display = '';
  setTimeout(() => ta.focus(), 80);
}

function renderDeckManagerList(openId) {
  const list = document.getElementById('deck-manager-list');
  list.innerHTML = '';
  if (userDecks.length === 0) {
    list.innerHTML = '<div style="color:rgba(255,255,255,0.35);font-size:0.85em;text-align:center;padding:20px 0;">No custom decks yet. Tap "+ New Deck" to create one.</div>';
    return;
  }
  userDecks.forEach((d, di) => {
    const card = document.createElement('div');
    card.className = 'dm-card';
    const header = document.createElement('div');
    header.className = 'dm-card-header';
    const nameWrap = document.createElement('div');
    nameWrap.className = 'dm-card-name';
    const nameInput = document.createElement('input');
    nameInput.type = 'text'; nameInput.value = d.name;
    nameInput.addEventListener('change', () => { d.name = nameInput.value.trim() || d.name; saveDecks(); });
    nameInput.addEventListener('click', e => e.stopPropagation());
    nameWrap.appendChild(nameInput);
    const toggle = document.createElement('div');
    toggle.className = 'dm-card-toggle'; toggle.textContent = '▾';
    let delDeckPending = false;
    const delDeck = document.createElement('button');
    delDeck.className = 'dm-del-deck'; delDeck.textContent = '🗑 Deck';
    delDeck.addEventListener('click', e => {
      e.stopPropagation();
      if (!delDeckPending) {
        delDeckPending = true; delDeck.textContent = '✓ sure?'; delDeck.style.borderColor = 'rgba(255,80,80,0.5)'; delDeck.style.color = '#ff6666';
        setTimeout(() => { delDeckPending = false; delDeck.textContent = '🗑 Deck'; delDeck.style.borderColor = ''; delDeck.style.color = ''; }, 2500);
      } else {
        activeDeckIds = activeDeckIds.filter(id => id !== d.id);
        saveActiveDeckIds();
        userDecks.splice(di, 1); saveDecks(); renderDeckManagerList();
      }
    });
    // Copy plain text button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'dm-del-deck'; copyBtn.textContent = '📋';
    copyBtn.title = 'Copy as text';
    copyBtn.addEventListener('click', e => {
      e.stopPropagation();
      navigator.clipboard.writeText(deckToPlainText(d)).then(() => {
        copyBtn.textContent = '✓ Copied!'; copyBtn.style.color = '#44ffaa';
        setTimeout(() => { copyBtn.textContent = '📋'; copyBtn.style.color = ''; }, 1500);
      }).catch(() => {
        copyBtn.textContent = '✗ Error';
        setTimeout(() => { copyBtn.textContent = '📋'; }, 1500);
      });
    });

    // Share link button
    const shareBtn = document.createElement('button');
    shareBtn.className = 'dm-del-deck'; shareBtn.textContent = '🔗';
    shareBtn.title = 'Share link';
    shareBtn.addEventListener('click', e => {
      e.stopPropagation();
      const url = deckToShareUrl(d);
      if (navigator.share) {
        navigator.share({ title: 'Keypad Quest — ' + d.name, url }).catch(() => {});
      } else {
        navigator.clipboard.writeText(url).then(() => {
          shareBtn.textContent = '✓ Copied!'; shareBtn.style.color = '#00ffee';
          setTimeout(() => { shareBtn.textContent = '🔗'; shareBtn.style.color = ''; }, 1500);
        });
      }
    });

    header.appendChild(nameWrap); header.appendChild(copyBtn); header.appendChild(shareBtn); header.appendChild(delDeck); header.appendChild(toggle);
    const body = document.createElement('div');
    body.className = 'dm-card-body' + (d.id === openId ? ' open' : '');
    if (d.id === openId) toggle.textContent = '▴';
    header.addEventListener('click', () => {
      const isOpen = body.classList.toggle('open');
      toggle.textContent = isOpen ? '▴' : '▾';
    });
    // Pair list
    const pairList = document.createElement('div');
    pairList.style.cssText = 'margin-top:6px;';
    const addBtn = document.createElement('button');
    addBtn.className = 'dact edit'; addBtn.textContent = '+ Add Pair'; addBtn.style.cssText = 'width:100%;margin-bottom:6px;min-height:34px;font-size:0.75em;';
    addBtn.addEventListener('click', () => showPairForm(d, -1, pairList, addBtn));
    body.appendChild(addBtn); body.appendChild(pairList);
    renderPairList(d, pairList, addBtn);
    card.appendChild(header); card.appendChild(body);
    list.appendChild(card);
  });
}

function renderPairList(d, container, addBtn) {
  // Remove old pair rows (not the addBtn)
  Array.from(container.children).forEach(c => container.removeChild(c));
  if (d.pairs.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'color:rgba(255,255,255,0.3);font-size:0.78em;text-align:center;padding:10px 0;';
    empty.textContent = 'No pairs yet.';
    container.appendChild(empty);
    return;
  }
  d.pairs.forEach((pair, pi) => {
    const row = document.createElement('div');
    row.className = 'deck-row';
    const keyEl = document.createElement('span');
    keyEl.className = 'deck-row-key'; keyEl.textContent = pair.k;
    const valEl = document.createElement('span');
    valEl.className = 'deck-row-val'; valEl.textContent = pair.v;
    const acts = document.createElement('div');
    acts.className = 'deck-row-acts';
    const editBtn = document.createElement('button');
    editBtn.className = 'dact edit'; editBtn.textContent = '✏';
    editBtn.addEventListener('click', () => showPairForm(d, pi, container, addBtn));
    const delBtn = document.createElement('button');
    delBtn.className = 'dact del'; delBtn.textContent = '🗑';
    let delPending = false;
    delBtn.addEventListener('click', () => {
      if (!delPending) {
        delPending = true; delBtn.classList.add('confirm'); delBtn.textContent = '✓?';
        setTimeout(() => { delPending = false; delBtn.classList.remove('confirm'); delBtn.textContent = '🗑'; }, 2500);
      } else {
        d.pairs.splice(pi, 1); saveDecks(); renderPairList(d, container, addBtn);
      }
    });
    acts.appendChild(editBtn); acts.appendChild(delBtn);
    row.appendChild(keyEl); row.appendChild(valEl); row.appendChild(acts);
    container.appendChild(row);
  });
}

function showPairForm(d, pi, pairListEl, addBtn) {
  const existing = pairListEl.parentNode.querySelector('.deck-form');
  if (existing) existing.remove();
  const pair = pi >= 0 ? d.pairs[pi] : {k:'', v:''};
  const form = document.createElement('div');
  form.className = 'deck-form'; form.style.marginBottom = '6px';
  const kInput = document.createElement('input');
  kInput.type = 'text'; kInput.placeholder = 'Prompt (e.g. France)'; kInput.value = pair.k;
  const vInput = document.createElement('input');
  vInput.type = 'text'; vInput.placeholder = 'Answer (e.g. Paris)'; vInput.value = pair.v;
  const btns = document.createElement('div');
  btns.className = 'deck-form-btns';
  const saveBtn = document.createElement('button');
  saveBtn.className = 'save'; saveBtn.textContent = pi >= 0 ? 'Save' : 'Add Pair';
  saveBtn.addEventListener('click', () => {
    const k = kInput.value.trim(), v = vInput.value.trim();
    if (!k || !v) { kInput.style.borderColor = k ? '' : 'rgba(255,80,80,0.6)'; vInput.style.borderColor = v ? '' : 'rgba(255,80,80,0.6)'; return; }
    if (pi >= 0) d.pairs[pi] = {k, v};
    else d.pairs.push({k, v});
    saveDecks(); form.remove(); renderPairList(d, pairListEl, addBtn);
  });
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'cancel'; cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', () => form.remove());
  btns.appendChild(saveBtn); btns.appendChild(cancelBtn);
  form.appendChild(kInput); form.appendChild(vInput); form.appendChild(btns);
  addBtn.insertAdjacentElement('afterend', form);
  setTimeout(() => kInput.focus(), 80);
}

function showNewDeckForm() {
  // Close import textarea if open
  const iw = document.getElementById('deck-import-wrap');
  iw.style.display = 'none'; iw.innerHTML = '';
  const wrap = document.getElementById('deck-new-form-wrap');
  if (wrap.style.display !== 'none') { wrap.style.display = 'none'; wrap.innerHTML = ''; return; }
  const form = document.createElement('div');
  form.className = 'deck-form';
  const nameInput = document.createElement('input');
  nameInput.type = 'text'; nameInput.placeholder = 'Deck name (e.g. Spanish Words)';
  const btns = document.createElement('div');
  btns.className = 'deck-form-btns';
  const saveBtn = document.createElement('button');
  saveBtn.className = 'save'; saveBtn.textContent = 'Create Deck';
  saveBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    if (!name) { nameInput.style.borderColor = 'rgba(255,80,80,0.6)'; return; }
    const id = 'u-' + Date.now();
    userDecks.push({ id, name, pairs: [] });
    saveDecks(); wrap.style.display = 'none'; wrap.innerHTML = '';
    renderDeckManagerList(id);
  });
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'cancel'; cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', () => { wrap.style.display = 'none'; wrap.innerHTML = ''; });
  btns.appendChild(saveBtn); btns.appendChild(cancelBtn);
  form.appendChild(nameInput); form.appendChild(btns);
  wrap.appendChild(form); wrap.style.display = '';
  setTimeout(() => nameInput.focus(), 80);
}

// ─── Canvas click — tower selection & move ────────────────────────────────────

canvas.addEventListener('pointerdown', e => {
  if (gameState !== 'playing' && gameState !== 'paused') return;
  const rect = canvas.getBoundingClientRect();
  const cx = (e.clientX - rect.left) * (W / rect.width);
  const cy = (e.clientY - rect.top) * (H / rect.height);
  for (const t of towers) {
    if (Math.hypot(cx - t.slot.x, cy - t.slot.y) < TR + 8) {
      selectedTower = (selectedTower === t) ? null : t; return;
    }
  }
  if (selectedTower) {
    for (const s of slots) {
      if (s.occupied) continue;
      if (Math.hypot(cx - s.x, cy - s.y) < TR + 10) {
        selectedTower.slot.occupied = false; selectedTower.slot.tower = null;
        s.occupied = true; s.tower = selectedTower; selectedTower.slot = s; selectedTower = null; return;
      }
    }
    selectedTower = null;
  }
});

// ─── Keyboard shortcuts ───────────────────────────────────────────────────────

window.addEventListener('keydown', e => {
  if (gameState !== 'playing' || inputMode === 'keyboard') return;
  if (e.key === 'Backspace') { handleT9('back'); e.preventDefault(); return; }
  if (e.key === 'Enter' || e.key === ' ') { handleT9('ok'); e.preventDefault(); return; }
  if (/^[0-9]$/.test(e.key)) { handleT9(e.key); e.preventDefault(); }
});

// ─── Keyboard mode submit ─────────────────────────────────────────────────────

document.getElementById('keyboard-submit').addEventListener('click', () => {
  const ki = document.getElementById('keyboard-input');
  const typed = ki.value; ki.value = '';
  submitAnswer(buildKeyboardAnswer(typed)); updateInputDisplay(); ki.focus();
});

document.getElementById('keyboard-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const typed = e.target.value; e.target.value = '';
    submitAnswer(buildKeyboardAnswer(typed)); updateInputDisplay(); e.target.focus();
  }
});
document.getElementById('keyboard-input').addEventListener('input', () => {
  const ki = document.getElementById('keyboard-input');
  const filtered = ki.value.replace(/[^a-z0-9]/gi, '');
  if (ki.value !== filtered) ki.value = filtered;
  updateInputDisplay();
});

document.getElementById('keyboard-focus-btn').addEventListener('pointerdown', e => {
  e.preventDefault();
  document.getElementById('keyboard-input').focus();
});

document.getElementById('input-area').addEventListener('pointerdown', () => {
  if (inputMode === 'keyboard') document.getElementById('keyboard-input').focus();
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && inputMode === 'keyboard' && gameState === 'playing') {
    setTimeout(() => document.getElementById('keyboard-input').focus(), 100);
  }
});

// ─── Button wiring ────────────────────────────────────────────────────────────

document.addEventListener('click', e => { const btn = e.target.closest('.mode-btn'); if (btn) setInputMode(btn.dataset.mode); });

document.getElementById('btn-play').addEventListener('click',        () => startGame('play', false));
document.getElementById('btn-chill').addEventListener('click',       () => startGame('chill', false));
document.getElementById('continue-btn').addEventListener('click',    () => startGame('play', true));
document.getElementById('btn-choose-decks').addEventListener('click', showDeckSelector);
document.getElementById('btn-deck-mgr').addEventListener('click',    () => showDeckManager(null));

document.getElementById('deck-selector-back').addEventListener('click', hideDeckSelector);
document.getElementById('btn-play-selected').addEventListener('click', () => { hideDeckSelector(); startGame('play', false); });

document.getElementById('deck-back').addEventListener('click', hideDeckManager);
document.getElementById('btn-new-deck').addEventListener('click', showNewDeckForm);
document.getElementById('btn-import-deck').addEventListener('click', showImportTextarea);

document.getElementById('btn-hint').addEventListener('click', showHint);
document.getElementById('btn-skip').addEventListener('click', () => {
  if (gameState !== 'playing' || !currentPair) return;
  if (!chillMode) { streak = 0; updateStreakDisplay(); }
  floatText(pathCX, pathCY, 'skipped', 'rgba(255,255,255,0.45)');
  showNextPrompt();
});

// ─── Settings integration ─────────────────────────────────────────────────────

function injectInputModeSection() {
  if (document.getElementById('kq-input-mode')) return;
  const panel = document.getElementById('settings-panel');
  if (!panel) return;
  const sec = document.createElement('div');
  sec.id = 'kq-input-mode';
  sec.style.cssText = 'padding:14px 4px 0; font-family:sans-serif;';
  const lbl = document.createElement('div');
  lbl.textContent = 'Input Mode';
  lbl.style.cssText = 'font-size:0.7em;color:rgba(255,255,255,0.35);letter-spacing:0.1em;margin-bottom:8px;';
  const row = document.createElement('div');
  row.style.cssText = 'display:flex; gap:6px; flex-wrap:wrap;';
  [['scroll','Tap to Spell'],['predict','T9 Smart'],['keyboard','Keyboard']].forEach(([mode, name]) => {
    const btn = document.createElement('button');
    btn.className = 'mode-btn';
    btn.dataset.mode = mode;
    btn.textContent = name;
    btn.classList.toggle('active', mode === inputMode);
    row.appendChild(btn);
  });
  sec.appendChild(lbl);
  sec.appendChild(row);
  const devSection = document.getElementById('dev-mode-section');
  if (devSection) panel.insertBefore(sec, devSection);
  else panel.appendChild(sec);
}

function injectGameStatsSection() {
  if (document.getElementById('kq-game-stats')) {
    updateGameStatsSection(); return;
  }
  const panel = document.getElementById('settings-panel');
  if (!panel) return;
  const sec = document.createElement('div');
  sec.id = 'kq-game-stats';
  sec.style.cssText = 'width:100%;max-width:300px;margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.1);';

  const title = document.createElement('div');
  title.style.cssText = 'font-size:0.7em;color:rgba(255,255,255,0.35);letter-spacing:0.1em;margin-bottom:6px;';
  title.textContent = 'CURRENT RUN';
  sec.appendChild(title);

  const statsWrap = document.createElement('div');
  statsWrap.id = 'kq-stats-rows';
  sec.appendChild(statsWrap);

  const quitBtn = document.createElement('button');
  quitBtn.className = 'mbtn dim center';
  quitBtn.style.cssText = 'margin-top:8px;max-width:300px;font-size:0.82em;';
  quitBtn.textContent = '← Back to Game Menu';
  quitBtn.addEventListener('click', () => {
    document.getElementById('kq-game-stats')?.remove();
    // Close settings panel (simulate close by dispatching event or calling shared function)
    const closeBtn = document.querySelector('#settings-panel .settings-close, #settings-overlay .close-btn, button[aria-label="Close settings"]');
    if (closeBtn) closeBtn.click();
    showMenu();
  });
  sec.appendChild(quitBtn);
  const devSection = document.getElementById('dev-mode-section');
  if (devSection) panel.insertBefore(sec, devSection);
  else panel.appendChild(sec);
  updateGameStatsSection();
}

function updateGameStatsSection() {
  const rows = document.getElementById('kq-stats-rows');
  if (!rows) return;
  const acc = correctW + wrongW > 0 ? Math.round(correctW / (correctW + wrongW) * 100) : 100;
  const bms = getBT(wave);
  const data = [
    ['Wave', wave],
    ['Score', score],
    ['Accuracy', acc + '%'],
    ['Towers', towers.length + '/' + slots.length],
    ['Best time W' + wave, bms > 0 ? (bms / 1000).toFixed(1) + 's' : '—']
  ];
  rows.innerHTML = '';
  for (const [label, val] of data) {
    const r = document.createElement('div');
    r.className = 'srow';
    r.innerHTML = '<span class="slabel">' + label + '</span><span class="sval">' + val + '</span>';
    rows.appendChild(r);
  }
}

window.addEventListener('settingsOpened', () => {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  if (gameState === 'playing') gameState = 'paused';
  injectInputModeSection();
  if (gameState === 'paused') injectGameStatsSection();
});

window.addEventListener('settingsClosed', () => {
  document.getElementById('kq-input-mode')?.remove();
  document.getElementById('kq-game-stats')?.remove();
  if (gameState === 'paused') gameState = 'playing';
  startLoop();
});

// ─── Init ─────────────────────────────────────────────────────────────────────

function init() {
  loadDecks();
  // Check for ?import= share link
  const raw = new URLSearchParams(location.search).get('import');
  if (raw) {
    try {
      const data = JSON.parse(atob(raw));
      if (data.name && Array.isArray(data.pairs) && data.pairs.length > 0) {
        pendingImport = data;
      }
    } catch(e) {}
    history.replaceState(null, '', location.pathname);
  }
  resizeCanvas(); buildT9Pad(); buildTowerStrip(); setInputMode(inputMode);
  showMenu(); startLoop();
  if (pendingImport) showImportPrompt(pendingImport);
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('pageshow', e => { if (e.persisted && gameState === 'menu') showMenu(); });

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
