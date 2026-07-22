// Maze Warden — static data and pure formulas. No DOM, no state, no localStorage:
// safe to import under `node --test`.

export const COLS = 8, ROWS = 14; // aspect ~0.57, close to a phone's usable portrait area — minimizes letterbox matte
export const SPAWN = { col: 4, row: 0 };
export const CORE = { col: 4, row: ROWS - 1 };
export const BASE_START_GOLD = 120;
export const BASE_START_CORE_HP = 20;
export const LEAK_DAMAGE = 1;
export const SELL_REFUND_RATIO = 0.6;

export function cellKey(col, row) { return col + ',' + row; }
export function inBounds(col, row) { return col >= 0 && col < COLS && row >= 0 && row < ROWS; }
export function isSpecialCell(col, row) {
  return (col === SPAWN.col && row === SPAWN.row) || (col === CORE.col && row === CORE.row);
}

// Retuned for iteration 2 (Q4 flagged the two towers as indistinguishable):
// Spire leans harder into long-range single-target focus fire; Prism leans harder into
// short-range crowd control (bigger radius/slow, less dmg) so the placement tradeoff reads clearly.
// Iteration 5: every level also carries an `hp` — towers had no HP concept before
// the Breaker enemy needed something to chip down. Upgrading fully repairs to the
// new level's hp (no partial-damage carry-across-levels, matching how dmg/range
// already reset per-level rather than accumulating).
export const TOWER_DEFS = {
  spire: {
    key: 'spire', name: 'Pulse Spire', emoji: '🟦', color: '#2fe6ff', glow: 'rgba(47,230,255,0.55)',
    desc: 'Long range, single target',
    levels: [
      { cost: 25, range: 2.1, rate: 2.4, dmg: 5, hp: 40 },
      { cost: 20, range: 2.3, rate: 2.5, dmg: 9, hp: 55 },
      { cost: 35, range: 2.6, rate: 2.7, dmg: 14, hp: 75 }
    ]
  },
  prism: {
    key: 'prism', name: 'Frost Prism', emoji: '🟪', color: '#c04bff', glow: 'rgba(192,75,255,0.55)',
    desc: 'Short range, big splash + slow',
    levels: [
      { cost: 40, range: 1.15, rate: 0.85, dmg: 4, radius: 1.25, slow: 0.55, slowDur: 1.7, hp: 55 },
      { cost: 30, range: 1.2, rate: 0.9, dmg: 6, radius: 1.4, slow: 0.6, slowDur: 1.8, hp: 70 },
      { cost: 45, range: 1.3, rate: 0.95, dmg: 9, radius: 1.55, slow: 0.65, slowDur: 2.0, hp: 90 }
    ]
  },
  volt: {
    key: 'volt', name: 'Volt Coil', emoji: '🟡', color: '#ffd54a', glow: 'rgba(255,213,74,0.55)',
    desc: 'Cheap, rapid, low damage',
    levels: [
      { cost: 15, range: 1.3, rate: 4.2, dmg: 2, hp: 25 },
      { cost: 15, range: 1.4, rate: 4.6, dmg: 3, hp: 35 },
      { cost: 20, range: 1.5, rate: 5.0, dmg: 5, hp: 45 }
    ]
  }
};

// ------------------------------------------------------------------
// Bomber enemy (iteration 5 revision) — Q5=C, the pick that answers "too easy":
// a finished maze was previously a permanent safe solution. Supersedes the original
// blocked-detection Breaker (unreachable without a redundant loop/fork maze) with a
// fuse-based self-destruct that doesn't depend on maze topology at all: left alone
// long enough, a Bomber detonates and damages every tower in its blast radius.
// ------------------------------------------------------------------
export const BOMBER_START_WAVE = 6; // a few build-only waves first before Bombers mix in
export function bomberChance(n) {
  if (n < BOMBER_START_WAVE) return 0;
  return Math.min(0.15 + (n - BOMBER_START_WAVE) * 0.03, 0.5);
}
export function bomberFuseSeconds(n) { return Math.max(4, 9 - (n - BOMBER_START_WAVE) * 0.15); }
export const BOMBER_EXPLOSION_RADIUS = 1.5; // cells
export const BOMBER_EXPLOSION_DMG = 30; // flat, no falloff, towers only
export const BOMBER_COLOR = '#ff5a1f';

// ------------------------------------------------------------------
// Meta-progression (iteration 2) — permanent upgrade tree, Q5=A / Q7=A.
// Bank Essence on death, spend on nodes; persists across runs in localStorage.
// ------------------------------------------------------------------
// Iteration 6 (Q6=A): rank caps raised 3→5 and costs extended for ranks 4-5, on the
// same growth ratio the original 3 ranks already used — ranks 1-3 keep their exact
// original cost/effect so existing banked progress isn't retroactively changed, ranks
// 4-5 are new tiers on top. Total essence to max the whole tree goes from ~76 to ~266,
// pushing max-out from well-under-10 runs to several dozen. Reinforced Walls is a new
// node (tower HP, mirroring the existing effectiveDmg/effectiveCost multiplier pattern)
// — the tree's first defensive lever, previously flagged as a gap once Bombers made
// tower HP a real stat.
export const META_KEY = 'mazeWarden_meta';
export const META_NODES = {
  deepPockets: { name: 'Deep Pockets', emoji: '💰', desc: '+10 starting gold / rank', when: 'next', maxRank: 5, cost: [3, 5, 8, 13, 20] },
  fortifiedCore: { name: 'Fortified Core', emoji: '❤️', desc: '+3 starting core HP / rank', when: 'next', maxRank: 5, cost: [3, 5, 8, 13, 20] },
  cheapWalls: { name: 'Cheap Walls', emoji: '🔨', desc: '-10% tower cost / rank', when: 'now', maxRank: 5, cost: [4, 6, 9, 14, 21] },
  overcharge: { name: 'Overcharge', emoji: '⚡', desc: '+15% tower damage / rank', when: 'now', maxRank: 5, cost: [4, 6, 9, 14, 21] },
  reinforcedWalls: { name: 'Reinforced Walls', emoji: '🛡️', desc: '+12% tower HP / rank', when: 'now', maxRank: 5, cost: [4, 6, 9, 14, 21] },
  thirdTower: { name: 'Volt Coil', emoji: '🟡', desc: 'Unlocks Volt Coil, a cheap rapid-chip tower', when: 'now', maxRank: 1, cost: [6] }
};

export function essenceReward(waveReached, kills) { return Math.floor(waveReached / 2) + Math.floor(kills / 10); }

// Iteration 3: player-facing simulation speed toggle (industry-standard TD pattern —
// Bloons TD / Kingdom Rush style fast-forward), persisted across sessions.
export const SPEED_LEVELS = [0.5, 1, 2, 3];
export const SPEED_KEY = 'mazeWarden_speed';

// Iteration 6 (Q6=C): the old waveEnemySpeed hard-capped at 2.4 cells/sec around wave
// 37 ((2.4-1.1)/0.035), and count/hp's growth rate never picked up the slack — so total
// pressure flattened right where the run is deepest. LATE_WAVE_START pins that same
// wave as a single shared breakpoint: past it, count and hp growth accelerate and speed
// keeps climbing (much more slowly) instead of going flat, so late waves keep getting
// harder instead of plateauing. Waves 1-37 are untouched — only the tail changes.
export const LATE_WAVE_START = Math.round((2.4 - 1.1) / 0.035); // 37
export function waveEnemyCount(n) {
  var count = 6 + Math.floor(n * 1.5);
  if (n > LATE_WAVE_START) count += Math.floor((n - LATE_WAVE_START) * 0.4);
  return count;
}
export function waveEnemyHp(n) {
  var hp = 9 + Math.round(n * 3.3);
  if (n > LATE_WAVE_START) {
    var over = n - LATE_WAVE_START;
    hp += Math.round(over * over * 0.12); // accelerating, not linear — keeps outpacing tower dps growth
  }
  return hp;
}
export function waveEnemySpeed(n) { // cells/sec
  if (n <= LATE_WAVE_START) return 1.1 + n * 0.035;
  return 2.4 + (n - LATE_WAVE_START) * 0.01; // no hard ceiling — eases off rather than flattening
}
export function waveSpawnInterval(n) { return Math.max(0.9 - n * 0.02, 0.28); } // seconds
export function killReward(n) { return 3 + Math.floor(n / 4); }
export function waveClearBonus(n) { return 10 + n * 2; }
