// ─── State — shared mutable game state ────────────────────────────────────────
// All modules import { state } and read/write state.x directly.
// Using a single object wrapper so reassignments (e.g. state.enemies = []) are
// visible to all importers without re-importing.

const canvas = document.getElementById('game-canvas');

export const state = {
  // Game control
  gameState: 'menu',
  chillMode: false,

  // Deck / current question
  deck: [],
  deckIdx: 0,
  currentPair: null,
  numericMode: false,

  // Wave / score
  wave: 0, score: 0, waveScore: 0,
  streak: 0, correctW: 0, wrongW: 0,
  waveStartTime: 0,
  totalSpawned: 0, totalThisWave: 0,
  spawnTimer: 0, spawnInterval: 1.0,
  answerCount: 0,
  hintUsed: false,

  // Entity arrays
  enemies: [], towers: [], projs: [],
  particles: [], ripples: [], floats: [],
  stars: [],
  slots: [], selectedTower: null, waveOver: false,

  // Input
  inputMode: localStorage.getItem('keypadQuest_inputMode') || 'scroll',
  t9buf: '', t9pend: '', t9pendKey: '', t9pendIdx: 0, t9timer: null,
  t9pos: 0,

  // Canvas / geometry
  canvas: canvas,
  ctx: canvas.getContext('2d'),
  W: 0, H: 0,
  pathCX: 0, pathCY: 0, pathRX: 0, pathRY: 0,
  rafId: null, lastTs: 0,

  // Decks
  userDecks: [],
  activeDeckIds: [],
  pendingImport: null
};
