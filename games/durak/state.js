// ═══════════════════════════════════════════════════════════════════════════
// STATE — single shared mutable state object + query helpers
// ═══════════════════════════════════════════════════════════════════════════

import { buildDeck } from './constants.js';

// Player IDs are 'top' and 'bottom' (preserved from the original implementation
// because CSS classes and DOM container IDs reference them). They map to slots
// in the players array; later phases may grow this array beyond two entries.
export var state = {
  players: [
    { id: 'bottom', isHuman: true,  hand: [], board: [] },
    { id: 'top',    isHuman: false, hand: [], board: [] }
  ],
  deck: [],
  discard: [],
  trumpSuit: 4,
  trumpCard: null,
  attacker: 'bottom',
  priority: 'bottom',
  phase: 'start',     // 'start' | 'playing' | 'paused' | 'gameover'
  aiMode: true,
  winnerText: ''
};

// ── Query helpers ──────────────────────────────────────────────────────────

export function getPlayer(id) {
  for (var i = 0; i < state.players.length; i++) {
    if (state.players[i].id === id) return state.players[i];
  }
  return null;
}

export function otherPlayerId(id) {
  return id === 'top' ? 'bottom' : 'top';
}

export function isAIControlled(id) {
  return state.aiMode && id === 'top';
}

export function isTrump(suit) {
  return parseInt(suit) === state.trumpSuit;
}

// ── Mutations ──────────────────────────────────────────────────────────────

export function setAiMode(enabled) {
  state.aiMode = !!enabled;
  getPlayer('top').isHuman = !state.aiMode;
}

// Reset to a fresh game; trump is set from the bottom of the new deck.
export function newGame() {
  state.deck = buildDeck();
  state.trumpCard = state.deck[0];
  state.trumpSuit = parseInt(state.trumpCard.suit);
  state.discard = [];
  for (var i = 0; i < state.players.length; i++) {
    state.players[i].hand.length = 0;
    state.players[i].board.length = 0;
  }
  state.attacker = 'bottom';
  state.priority = 'bottom';
  state.phase = 'playing';
  state.winnerText = '';
  // Re-sync isHuman flags against current aiMode
  setAiMode(state.aiMode);
}
