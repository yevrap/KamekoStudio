import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  COLS, ROWS, SPAWN, CORE, cellKey, LATE_WAVE_START,
  waveEnemyCount, waveEnemyHp, waveEnemySpeed,
  killReward, waveClearBonus, essenceReward,
  bomberChance, bomberFuseSeconds
} from '../games/maze-warden/constants.js';
import { state, resetState, meta, defaultMeta, effectiveCost, effectiveDmg, effectiveHp } from '../games/maze-warden/state.js';
import { computeDistField, wouldSeal, cellCenterPx } from '../games/maze-warden/gameplay.js';

function resetMeta() { Object.assign(meta, defaultMeta()); }

// ─── computeDistField (BFS) ──────────────────────────────────────────────────

test('computeDistField: core is distance 0 from itself', () => {
  const field = computeDistField({});
  assert.equal(field[CORE.row][CORE.col], 0);
});

test('computeDistField: an open grid gives spawn its Manhattan distance from core', () => {
  const field = computeDistField({});
  assert.equal(field[SPAWN.row][SPAWN.col], Math.abs(SPAWN.row - CORE.row));
});

test('computeDistField: the spawn cell is always traversable, even if towersMap marks it occupied', () => {
  const towersMap = { [cellKey(SPAWN.col, SPAWN.row)]: true };
  const field = computeDistField(towersMap);
  assert.equal(field[SPAWN.row][SPAWN.col], Math.abs(SPAWN.row - CORE.row));
});

test('computeDistField: a fully walled row leaves everything above it unreachable', () => {
  const towersMap = {};
  for (let c = 0; c < COLS; c++) towersMap[cellKey(c, 5)] = true; // no gap at all, incl. spawn's own column
  const field = computeDistField(towersMap);
  assert.equal(field[0][SPAWN.col], Infinity);
});

// ─── wouldSeal — the "never fully seal the core" guarantee ──────────────────

test('wouldSeal: false on an empty board far from any path', () => {
  resetState();
  assert.equal(wouldSeal(0, 0), false);
});

test('wouldSeal: true when the candidate closes the only remaining gap in a wall', () => {
  resetState();
  for (let c = 0; c < COLS; c++) {
    if (c === 4) continue; // single gap
    state.towers[cellKey(c, 5)] = {};
  }
  assert.equal(wouldSeal(4, 5), true);
});

test('wouldSeal: false when an alternate gap in the wall still leaves a path', () => {
  resetState();
  for (let c = 0; c < COLS; c++) {
    if (c === 4 || c === 5) continue; // two gaps
    state.towers[cellKey(c, 5)] = {};
  }
  assert.equal(wouldSeal(4, 5), false);
});

test('wouldSeal: true when the candidate seals an active enemy into a pocket, even with the main path open', () => {
  resetState();
  // Wall three sides of (1,2), leaving (1,3) as the only exit.
  state.towers[cellKey(0, 2)] = {};
  state.towers[cellKey(2, 2)] = {};
  state.towers[cellKey(1, 1)] = {};
  state.enemies.push({ pos: cellCenterPx(1, 2) });
  assert.equal(wouldSeal(1, 3), true);
});

// ─── Wave scaling, incl. the iteration 6 LATE_WAVE_START breakpoint ─────────

test('LATE_WAVE_START is the old speed-cap wave (37)', () => {
  assert.equal(LATE_WAVE_START, 37);
});

test('waveEnemyCount: linear growth before the late-wave breakpoint', () => {
  assert.equal(waveEnemyCount(1), 6 + Math.floor(1 * 1.5));
  assert.equal(waveEnemyCount(LATE_WAVE_START), 6 + Math.floor(LATE_WAVE_START * 1.5));
});

test('waveEnemyCount: an extra accelerating term kicks in past the breakpoint', () => {
  assert.equal(waveEnemyCount(40), 6 + Math.floor(40 * 1.5) + Math.floor((40 - LATE_WAVE_START) * 0.4));
});

test('waveEnemyHp: no bonus at or before the breakpoint', () => {
  assert.equal(waveEnemyHp(LATE_WAVE_START), 9 + Math.round(LATE_WAVE_START * 3.3));
});

test('waveEnemyHp: quadratic bonus past the breakpoint keeps outpacing linear growth', () => {
  const n = 47, over = n - LATE_WAVE_START;
  assert.equal(waveEnemyHp(n), 9 + Math.round(n * 3.3) + Math.round(over * over * 0.12));
});

test('waveEnemySpeed: approaches but stays under the old hard cap right at the breakpoint', () => {
  assert.equal(waveEnemySpeed(LATE_WAVE_START), 1.1 + LATE_WAVE_START * 0.035);
  assert.ok(waveEnemySpeed(LATE_WAVE_START) < 2.4);
});

test('waveEnemySpeed: keeps climbing past the old 2.4 hard cap instead of flattening', () => {
  assert.equal(waveEnemySpeed(38), 2.4 + 0.01);
  assert.ok(waveEnemySpeed(100) > 2.4);
});

// ─── Gold / essence reward formulas ─────────────────────────────────────────

test('killReward scales with wave', () => {
  assert.equal(killReward(1), 3);
  assert.equal(killReward(20), 8);
});

test('waveClearBonus scales with wave', () => {
  assert.equal(waveClearBonus(1), 12);
  assert.equal(waveClearBonus(30), 70);
});

test('essenceReward combines wave-reached and kill count', () => {
  assert.equal(essenceReward(10, 25), 7);
  assert.equal(essenceReward(1, 0), 0);
});

// ─── Bomber fuse / spawn chance ──────────────────────────────────────────────

test('bomberChance: zero before its start wave, ramping after', () => {
  assert.equal(bomberChance(5), 0);
  assert.equal(bomberChance(6), 0.15);
});

test('bomberChance: caps at 0.5 in the late game', () => {
  assert.equal(bomberChance(20), 0.5);
});

test('bomberFuseSeconds: starts at 9s and floors at 4s', () => {
  assert.equal(bomberFuseSeconds(6), 9);
  assert.equal(bomberFuseSeconds(40), 4);
});

// ─── effectiveCost / effectiveDmg / effectiveHp, incl. iteration 7 inflation ─

test('effectiveCost: no inflation with no towers built yet this run', () => {
  resetMeta();
  resetState();
  assert.equal(effectiveCost(25, true), 25);
});

test('effectiveCost: iteration 7 inflation raises the cost of each additional initial build', () => {
  resetMeta();
  resetState();
  state.towersBuiltThisRun = 5;
  assert.equal(effectiveCost(25, true), Math.round(25 * 1.25));
});

test('effectiveCost: inflation applies ONLY to initial placement, not upgrades', () => {
  resetMeta();
  resetState();
  state.towersBuiltThisRun = 5;
  assert.equal(effectiveCost(25), 25); // isInitialBuild omitted — an upgrade cost
});

test('effectiveCost: Cheap Walls meta discount stacks under the inflation multiplier', () => {
  resetMeta();
  resetState();
  meta.cheapWalls = 2;
  assert.equal(effectiveCost(40), Math.round(40 * 0.8));
});

test('effectiveDmg: Overcharge meta rank scales damage', () => {
  resetMeta();
  assert.equal(effectiveDmg(10), 10);
  meta.overcharge = 2;
  assert.equal(effectiveDmg(10), 13);
});

test('effectiveHp: Reinforced Walls meta rank scales tower HP', () => {
  resetMeta();
  assert.equal(effectiveHp(40), 40);
  meta.reinforcedWalls = 3;
  assert.equal(effectiveHp(40), 54);
});
