// ═══════════════════════════════════════════════════════════════════════════
// STATE — seat-indexed N-player model (2–6). Seat order is clockwise.
// ═══════════════════════════════════════════════════════════════════════════

import { buildDeck } from './constants.js';

export var state = {
  players: [],        // [{ seat, name, isHuman, hand, isOut }]
  deck: [],
  discard: [],
  trumpSuit: 4,
  trumpCard: null,

  attackerSeat: 0,
  defenderSeat: 1,
  prioritySeat: 0,

  field: { attacks: [], defenses: [] },  // defenses[i] is null or the card beating attacks[i]
  contributionOrder: [],                 // seats in attack-contribution order (for draw order)
  attackerPassed: false,                 // primary attacker has passed this round
  contributorPassed: false,              // right-of-defender contributor has passed this round

  phase: 'start',     // 'start' | 'playing' | 'pileOn' | 'passDevice' | 'paused' | 'gameover'
  pendingReveal: null, // { seat } during passDevice
  mode: 'ai',         // 'ai' | 'hotseat'
  playerCount: 2,
  winnerText: ''
};

// ── Query helpers ──────────────────────────────────────────────────────────

export function getPlayer(seat) {
  return state.players[seat] || null;
}

export function activePlayers() {
  return state.players.filter(function (p) { return !p.isOut; });
}

export function activeCount() {
  var n = 0;
  for (var i = 0; i < state.players.length; i++) if (!state.players[i].isOut) n++;
  return n;
}

export function nextActiveSeat(fromSeat) {
  var n = state.players.length;
  for (var step = 1; step <= n; step++) {
    var s = (fromSeat + step) % n;
    if (!state.players[s].isOut) return s;
  }
  return fromSeat;
}

export function prevActiveSeat(fromSeat) {
  var n = state.players.length;
  for (var step = 1; step <= n; step++) {
    var s = ((fromSeat - step) % n + n) % n;
    if (!state.players[s].isOut) return s;
  }
  return fromSeat;
}

// Seats allowed to throw cards into the current bout: the two active seats
// adjacent to the defender (left and right neighbors). Deduplicated at small
// tables where the neighbors coincide (2- and 3-player).
export function adjacentContributors() {
  var d = state.defenderSeat;
  var left = prevActiveSeat(d);
  var right = nextActiveSeat(d);
  var out = [];
  if (left !== d) out.push(left);
  if (right !== d && right !== left) out.push(right);
  return out;
}

export function isTrump(suit) {
  return parseInt(suit) === state.trumpSuit;
}

// Seat 0 is always the local human in both modes.
export function isLocalHumanSeat(seat) {
  return state.players[seat] && state.players[seat].isHuman && seat === 0;
}

export function humanSeats() {
  var out = [];
  for (var i = 0; i < state.players.length; i++) {
    if (state.players[i].isHuman) out.push(i);
  }
  return out;
}

// ── Mutations ──────────────────────────────────────────────────────────────

export function setupPlayers(mode, count) {
  state.mode = mode;
  state.playerCount = count;
  state.players = [];
  for (var i = 0; i < count; i++) {
    var isHuman = (mode === 'hotseat') ? true : (i === 0);
    var name;
    if (i === 0) name = (mode === 'hotseat') ? 'Player 1' : 'You';
    else name = (mode === 'hotseat') ? ('Player ' + (i + 1)) : ('CPU ' + i);
    state.players.push({
      seat: i,
      name: name,
      isHuman: isHuman,
      hand: [],
      isOut: false
    });
  }
}

export function newGame(mode, count) {
  setupPlayers(mode, count);
  state.deck = buildDeck();
  state.trumpCard = state.deck[0];
  state.trumpSuit = parseInt(state.trumpCard.suit);
  state.discard = [];
  state.field.attacks = [];
  state.field.defenses = [];
  state.contributionOrder = [];
  state.attackerPassed = false;
  state.contributorPassed = false;
  state.attackerSeat = 0;
  state.defenderSeat = nextActiveSeat(0);
  state.prioritySeat = 0;
  state.phase = 'playing';
  state.pendingReveal = null;
  state.winnerText = '';
}
