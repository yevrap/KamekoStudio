import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getRankLabel } from '../games/durak-alchemist/constants.js';
import { state } from '../games/durak-alchemist/state.js';
import { spawnCard, getEmptyCells, spawnRandomBaseCard, slideGrid, isGameOver } from '../games/durak-alchemist/gridLogic.js';
import { canBeat, canTransfer, getExposedRanks } from '../games/durak-alchemist/combatLogic.js';

function emptyGrid() {
  return Array(4).fill(null).map(() => Array(4).fill(null));
}

function resetGrid() {
  state.grid = emptyGrid();
  state.score = 0;
}

// ─── getRankLabel ────────────────────────────────────────────────────────────

test('getRankLabel: numeric ranks 6-10 return their own string', () => {
  for (let r = 6; r <= 10; r++) assert.equal(getRankLabel(r), r.toString());
});

test('getRankLabel: face ranks map to letters', () => {
  assert.equal(getRankLabel(11), 'J');
  assert.equal(getRankLabel(12), 'Q');
  assert.equal(getRankLabel(13), 'K');
  assert.equal(getRankLabel(14), 'A');
});

test('getRankLabel: out-of-range rank returns ?', () => {
  assert.equal(getRankLabel(20), '?');
});

// ─── spawnCard / getEmptyCells ──────────────────────────────────────────────

test('spawnCard: places a card at the given cell', () => {
  resetGrid();
  const card = spawnCard(7, 'S', 1, 2);
  assert.equal(state.grid[1][2], card);
  assert.equal(card.rank, 7);
  assert.equal(card.suit, 'S');
});

test('spawnCard: assigns unique ids across calls', () => {
  resetGrid();
  const a = spawnCard(6, 'H', 0, 0);
  const b = spawnCard(6, 'H', 0, 1);
  assert.notEqual(a.id, b.id);
});

test('getEmptyCells: full grid returns no empty cells', () => {
  resetGrid();
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) spawnCard(6, 'S', r, c);
  assert.equal(getEmptyCells().length, 0);
});

test('getEmptyCells: reports every unoccupied cell', () => {
  resetGrid();
  spawnCard(6, 'S', 0, 0);
  assert.equal(getEmptyCells().length, 15);
});

// ─── spawnRandomBaseCard ─────────────────────────────────────────────────────

test('spawnRandomBaseCard: returns null when grid is full', () => {
  resetGrid();
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) spawnCard(6, 'S', r, c);
  assert.equal(spawnRandomBaseCard(), null);
});

test('spawnRandomBaseCard: fills the sole empty cell', () => {
  resetGrid();
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) spawnCard(6, 'S', r, c);
  state.grid[2][3] = null;
  const card = spawnRandomBaseCard();
  assert.ok(card);
  assert.equal(state.grid[2][3], card);
  assert.ok(card.rank === 6 || card.rank === 7);
});

// ─── slideGrid ───────────────────────────────────────────────────────────────

test('slideGrid: single card slides to the far edge', () => {
  resetGrid();
  const card = spawnCard(8, 'C', 0, 0);
  const moved = slideGrid('right');
  assert.equal(moved, true);
  assert.equal(state.grid[0][3], card);
  assert.equal(state.grid[0][0], null);
});

test('slideGrid: matching rank+suit cards merge and raise rank', () => {
  resetGrid();
  spawnCard(9, 'S', 0, 0);
  spawnCard(9, 'S', 0, 1);
  const moved = slideGrid('left');
  assert.equal(moved, true);
  assert.equal(state.grid[0][0].rank, 10);
  assert.equal(state.grid[0][0].suit, 'S');
  assert.equal(state.grid[0][1], null);
  assert.equal(state.score, 100);
});

test('slideGrid: different suits do not merge, only stack', () => {
  resetGrid();
  spawnCard(9, 'S', 0, 0);
  spawnCard(9, 'H', 0, 1);
  const moved = slideGrid('left');
  assert.equal(moved, false);
  assert.equal(state.grid[0][0].suit, 'S');
  assert.equal(state.grid[0][0].rank, 9);
  assert.equal(state.grid[0][1].suit, 'H');
  assert.equal(state.grid[0][1].rank, 9);
});

test('slideGrid: only one merge per pair per swipe (no chain merging)', () => {
  resetGrid();
  spawnCard(9, 'S', 0, 0);
  spawnCard(9, 'S', 0, 1);
  spawnCard(9, 'S', 0, 2);
  slideGrid('left');
  assert.equal(state.grid[0][0].rank, 10);
  assert.equal(state.grid[0][1].rank, 9);
  assert.equal(state.grid[0][2], null);
});

test('slideGrid: Ace (rank 14) cards do not merge further', () => {
  resetGrid();
  spawnCard(14, 'D', 0, 0);
  spawnCard(14, 'D', 0, 1);
  const moved = slideGrid('left');
  assert.equal(moved, false);
  assert.equal(state.grid[0][0].rank, 14);
  assert.equal(state.grid[0][1].rank, 14);
  assert.equal(state.score, 0);
});

test('slideGrid: already-settled cards report no movement', () => {
  resetGrid();
  spawnCard(6, 'S', 0, 0);
  spawnCard(6, 'H', 0, 1);
  const moved = slideGrid('left');
  assert.equal(moved, false);
});

// ─── isGameOver ──────────────────────────────────────────────────────────────

test('isGameOver: false when an empty cell exists', () => {
  resetGrid();
  spawnCard(6, 'S', 0, 0);
  assert.equal(isGameOver(), false);
});

test('isGameOver: false when a full grid has an adjacent mergeable pair', () => {
  resetGrid();
  const ranks = [6, 7, 8, 9];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const suit = (r + c) % 2 === 0 ? 'S' : 'H';
      spawnCard(ranks[r], suit, r, c);
    }
  }
  state.grid[0][1] = { id: 99, rank: ranks[0], suit: state.grid[0][0].suit };
  assert.equal(isGameOver(), false);
});

test('isGameOver: true when full grid has no possible merges', () => {
  resetGrid();
  const ranks = [6, 7, 8, 9];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const suit = (r + c) % 2 === 0 ? 'S' : 'H';
      spawnCard(ranks[r], suit, r, c);
    }
  }
  assert.equal(isGameOver(), true);
});

// ─── canBeat ─────────────────────────────────────────────────────────────────

test('canBeat: trump defense beats non-trump attack', () => {
  assert.equal(canBeat({ rank: 14, suit: 'C' }, { rank: 6, suit: 'S' }, 'S'), true);
});

test('canBeat: non-trump defense cannot beat trump attack', () => {
  assert.equal(canBeat({ rank: 6, suit: 'S' }, { rank: 14, suit: 'C' }, 'S'), false);
});

test('canBeat: same suit higher rank beats lower rank', () => {
  assert.equal(canBeat({ rank: 7, suit: 'C' }, { rank: 9, suit: 'C' }, 'S'), true);
});

test('canBeat: same suit lower rank cannot beat higher rank', () => {
  assert.equal(canBeat({ rank: 10, suit: 'C' }, { rank: 8, suit: 'C' }, 'S'), false);
});

test('canBeat: different non-trump suits cannot beat', () => {
  assert.equal(canBeat({ rank: 6, suit: 'C' }, { rank: 14, suit: 'D' }, 'S'), false);
});

test('canBeat: missing attack or defense card returns false', () => {
  assert.equal(canBeat(null, { rank: 6, suit: 'S' }, 'S'), false);
  assert.equal(canBeat({ rank: 6, suit: 'S' }, null, 'S'), false);
});

// ─── canTransfer ─────────────────────────────────────────────────────────────

test('canTransfer: true when defense card rank matches all attack ranks', () => {
  const attacks = [{ rank: 8, suit: 'S' }, { rank: 8, suit: 'H' }];
  assert.equal(canTransfer(attacks, { rank: 8, suit: 'C' }), true);
});

test('canTransfer: false when defense card rank does not match', () => {
  const attacks = [{ rank: 8, suit: 'S' }];
  assert.equal(canTransfer(attacks, { rank: 9, suit: 'C' }), false);
});

test('canTransfer: false when there are no attack cards', () => {
  assert.equal(canTransfer([], { rank: 8, suit: 'C' }), false);
});

// ─── getExposedRanks ─────────────────────────────────────────────────────────

test('getExposedRanks: collects unique ranks from attack and defense cards', () => {
  const bout = [
    { attack: { rank: 6, suit: 'S' }, defense: { rank: 9, suit: 'S' } },
    { attack: { rank: 6, suit: 'H' }, defense: null }
  ];
  const ranks = getExposedRanks(bout).sort((a, b) => a - b);
  assert.deepEqual(ranks, [6, 9]);
});

test('getExposedRanks: empty bout returns empty array', () => {
  assert.deepEqual(getExposedRanks([]), []);
});
