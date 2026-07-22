// Maze Warden — mutable run state, meta-progression persistence, and the few
// formulas that depend on `meta`/`state` rather than being pure math (see
// constants.js for those). localStorage access is confined to loadMeta/saveMeta/
// loadSpeedIndex — never called at module load, only from main.js's boot sequence,
// so this module stays import-safe under `node --test` (no DOM/localStorage there).

import { BASE_START_GOLD, BASE_START_CORE_HP, META_KEY, SPEED_LEVELS, SPEED_KEY } from './constants.js';

export let state = null;

export function freshState() {
  return {
    gold: metaStartGold(),
    coreHp: metaStartCoreHp(),
    wave: 1,
    phase: 'build', // 'build' | 'wave' | 'gameover'
    paused: false,
    towers: {}, // key `${col},${row}` -> {defKey, level, col, row, cooldown, spent, hp, maxHp}
    enemies: [],
    particles: [],
    blasts: [], // Bomber detonation radius-flashes
    projectiles: [],
    distField: null,
    spawnQueue: 0,
    spawnTimer: 0,
    enemiesToSpawn: 0,
    killedThisRun: 0,
    selectedCell: null,
    time: 0,
    towersBuiltThisRun: 0
  };
}

export function resetState() {
  state = freshState();
  return state;
}

// ------------------------------------------------------------------
// Meta-progression persistence
// ------------------------------------------------------------------
export function defaultMeta() {
  return { essence: 0, deepPockets: 0, fortifiedCore: 0, cheapWalls: 0, overcharge: 0, reinforcedWalls: 0, thirdTower: 0 };
}

export let meta = defaultMeta();

export function loadMeta() {
  try {
    var raw = localStorage.getItem(META_KEY);
    if (!raw) return defaultMeta();
    var parsed = JSON.parse(raw);
    var m = defaultMeta();
    for (var k in m) if (typeof parsed[k] === 'number') m[k] = parsed[k];
    return m;
  } catch (e) { return defaultMeta(); }
}
export function saveMeta() { localStorage.setItem(META_KEY, JSON.stringify(meta)); }
// Called once from main.js at boot — keeps localStorage reads out of module load.
export function initMeta() { meta = loadMeta(); }

export function metaStartGold() { return BASE_START_GOLD + meta.deepPockets * 10; }
export function metaStartCoreHp() { return BASE_START_CORE_HP + meta.fortifiedCore * 3; }

// Iteration 7 (Q2=A): every tower placed this run makes the next tower's construction
// cost progressively more — a gold sink for the late-game surplus a maxed maze
// otherwise has nothing to spend on. First-guess formula, same category as the
// Bomber's own numbers, flagged for a future retune pass once fresh playtest data
// lands. Applies ONLY at initial placement (isInitialBuild=true) — upgrading an
// already-placed tower keeps its existing per-level TOWER_DEFS cost untouched,
// matching iteration 6's "don't retroactively change what's already banked" precedent.
export function towerInflationMultiplier() { return 1 + 0.05 * state.towersBuiltThisRun; }
export function effectiveCost(baseCost, isInitialBuild) {
  var cost = baseCost * (1 - meta.cheapWalls * 0.1);
  if (isInitialBuild) cost *= towerInflationMultiplier();
  return Math.max(1, Math.round(cost));
}
export function effectiveDmg(baseDmg) { return baseDmg * (1 + meta.overcharge * 0.15); }
export function effectiveHp(baseHp) { return Math.round(baseHp * (1 + meta.reinforcedWalls * 0.12)); }

// ------------------------------------------------------------------
// Speed toggle persistence
// ------------------------------------------------------------------
export let speedIndex = 1;

export function loadSpeedIndex() {
  try {
    var raw = localStorage.getItem(SPEED_KEY);
    var idx = raw !== null ? parseInt(raw, 10) : 1;
    if (isNaN(idx) || idx < 0 || idx >= SPEED_LEVELS.length) idx = 1;
    return idx;
  } catch (e) { return 1; }
}
// Called once from main.js at boot.
export function initSpeedIndex() { speedIndex = loadSpeedIndex(); }
export function cycleSpeedIndex() {
  speedIndex = (speedIndex + 1) % SPEED_LEVELS.length;
  try { localStorage.setItem(SPEED_KEY, String(speedIndex)); } catch (e) {}
  return speedIndex;
}
export function currentSpeed() { return SPEED_LEVELS[speedIndex]; }

// DOM element references, populated by main.js once the document is ready —
// gameplay.js reads these lazily inside functions, never at module load, so it
// stays importable with no DOM present (see materials-run/blob-zapper precedent).
export const dom = {};
