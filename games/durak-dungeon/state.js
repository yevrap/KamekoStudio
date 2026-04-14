// ═══════════════════════════════════════════════════════════════════════════
// STATE — shared mutable run object + state query helpers
// ═══════════════════════════════════════════════════════════════════════════

import { Card, resetCardId, mulberry32, seedFromString, shuffle } from './constants.js';

// Single shared state object. All modules import { state } and access state.run.
// Using a wrapper object so modules always get the current run after newRun() is called.
export var state = { run: null };

export function newRun(seed) {
  resetCardId();
  var r = {
    seed: seed,
    rng: mulberry32(seedFromString(seed)),
    trumpSuit: 0,
    floor: 1,
    hp: 50,
    maxHp: 50,
    gold: 0,
    deck: [],
    relics: [],
    phase: 'title',
    enemy: null,
    hand: [],
    enemyAttackIndex: 0,
    floorHitsTaken: 0,
    wildCardUsedThisFloor: false,
    defenseCards: [],
    attackDamageDealt: 0,
    lastDefendSuit: 0,
    currentTrumpOverride: null,
    stats: {
      floorsCleared: 0,
      totalDamageDealt: 0,
      totalDamageTaken: 0,
      enemiesDefeated: 0,
      goldEarned: 0,
      cardsPlayed: 0
    }
  };

  // Pick trump suit
  r.trumpSuit = Math.floor(r.rng() * 4) + 1;

  // Build starting deck: 18 cards, two non-trump suits, values 6-14
  var suits = [1, 2, 3, 4].filter(function (s) { return s !== r.trumpSuit; });
  shuffle(suits, r.rng);
  var deckSuits = [suits[0], suits[1]];
  for (var si = 0; si < deckSuits.length; si++) {
    for (var v = 6; v <= 14; v++) {
      r.deck.push(new Card(v, deckSuits[si]));
    }
  }
  shuffle(r.deck, r.rng);

  state.run = r;
}

// ── State query helpers (read-only access to state.run) ────────────────────

export function hasRelic(id) {
  for (var i = 0; i < state.run.relics.length; i++) {
    if (state.run.relics[i].id === id) return true;
  }
  return false;
}

export function getActiveTrumpSuit() {
  if (!state.run) return 1;
  if (state.run.currentTrumpOverride) return state.run.currentTrumpOverride;
  return state.run.trumpSuit;
}

export function canDefend(card, attackCard) {
  if (!attackCard) return false;
  var activeTrump = getActiveTrumpSuit();
  if (state.run.enemy && state.run.enemy.mutations.indexOf('no-trumps') !== -1) {
    return card.suit === attackCard.suit && card.value > attackCard.value;
  }
  if (card.suit === attackCard.suit && card.value > attackCard.value) return true;
  if (card.suit === activeTrump && attackCard.suit !== activeTrump) return true;
  if (card.suit === activeTrump && attackCard.suit === activeTrump && card.value > attackCard.value) return true;
  return false;
}
