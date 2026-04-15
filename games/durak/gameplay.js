// ═══════════════════════════════════════════════════════════════════════════
// GAMEPLAY — N-player Durak bout engine. Pure mutations on `state`. All
// actions return boolean success so main.js can decide whether to re-render.
// ═══════════════════════════════════════════════════════════════════════════

import {
  state, getPlayer, nextActiveSeat, adjacentContributors, activeCount
} from './state.js';
import { canBeat } from './constants.js';

// ── Predicates ─────────────────────────────────────────────────────────────

export function legalAttack(seat, card) {
  if (state.phase !== 'playing' && state.phase !== 'pileOn') return false;
  if (state.prioritySeat !== seat) return false;
  if (!state.players[seat] || state.players[seat].isOut) return false;

  var contribs = adjacentContributors();
  if (contribs.indexOf(seat) === -1) return false;

  var attackCount = state.field.attacks.length;
  if (attackCount >= 6) return false;

  if (state.phase === 'playing') {
    // Defender must be able to beat any remaining undefended attacks.
    var undefended = 0;
    for (var i = 0; i < state.field.defenses.length; i++) {
      if (state.field.defenses[i] === null) undefended++;
    }
    var defender = getPlayer(state.defenderSeat);
    if (undefended >= defender.hand.length) return false;
  }

  if (attackCount === 0) return seat === state.attackerSeat;

  var v = parseInt(card.value);
  for (var a = 0; a < state.field.attacks.length; a++) {
    if (parseInt(state.field.attacks[a].value) === v) return true;
  }
  for (var d = 0; d < state.field.defenses.length; d++) {
    var def = state.field.defenses[d];
    if (def && parseInt(def.value) === v) return true;
  }
  return false;
}

export function legalDefense(seat, card) {
  if (state.phase !== 'playing') return false;
  if (state.prioritySeat !== seat) return false;
  if (seat !== state.defenderSeat) return false;
  var firstOpen = state.field.defenses.indexOf(null);
  if (firstOpen === -1) return false;
  var atk = state.field.attacks[firstOpen];
  return canBeat(atk, card, state.trumpSuit);
}

// ── Card play ──────────────────────────────────────────────────────────────

function removeFromHand(seat, cardId) {
  var hand = getPlayer(seat).hand;
  for (var i = 0; i < hand.length; i++) {
    if (hand[i].id === cardId) {
      return hand.splice(i, 1)[0];
    }
  }
  return null;
}

function findCard(seat, cardId) {
  var hand = getPlayer(seat).hand;
  for (var i = 0; i < hand.length; i++) if (hand[i].id === cardId) return hand[i];
  return null;
}

export function playAttack(seat, cardId) {
  var card = findCard(seat, cardId);
  if (!card || !legalAttack(seat, card)) return false;
  removeFromHand(seat, cardId);
  state.field.attacks.push(card);
  state.field.defenses.push(null);
  if (state.contributionOrder.indexOf(seat) === -1) state.contributionOrder.push(seat);

  if (state.phase === 'pileOn') {
    if (state.field.attacks.length >= 6) { endBout('taken'); return true; }
    if (getPlayer(state.defenderSeat).hand.length <= 0) { /* defender can't hold more? they still take */ }
    cyclePilePriority(seat);
    return true;
  }

  // Normal attack phase: defender must now respond.
  state.prioritySeat = state.defenderSeat;
  state.attackerPassed = false;
  state.contributorPassed = false;
  return true;
}

export function playDefense(seat, cardId) {
  var card = findCard(seat, cardId);
  if (!card || !legalDefense(seat, card)) return false;
  removeFromHand(seat, cardId);
  var firstOpen = state.field.defenses.indexOf(null);
  state.field.defenses[firstOpen] = card;

  // Back to primary attacker; reset pass flags for the new round.
  state.prioritySeat = state.attackerSeat;
  state.attackerPassed = false;
  state.contributorPassed = false;
  return true;
}

// Primary attacker or contributor declines to add another card.
// Only legal when field is fully defended (otherwise priority is defender's).
export function passAttack(seat) {
  if (state.phase !== 'playing') return false;
  if (state.prioritySeat !== seat) return false;
  if (state.field.attacks.length === 0) return false;
  for (var i = 0; i < state.field.defenses.length; i++) {
    if (state.field.defenses[i] === null) return false;
  }
  var contribs = adjacentContributors();
  if (contribs.indexOf(seat) === -1) return false;

  if (seat === state.attackerSeat) state.attackerPassed = true;
  else state.contributorPassed = true;

  if (allContributorsPassed(contribs)) { endBout('defended'); return true; }

  // Hand priority to the other contributor who hasn't passed.
  for (var c = 0; c < contribs.length; c++) {
    var s = contribs[c];
    if (s === seat) continue;
    var passed = (s === state.attackerSeat) ? state.attackerPassed : state.contributorPassed;
    if (!passed) { state.prioritySeat = s; return true; }
  }
  endBout('defended');
  return true;
}

export function declareTake(seat) {
  if (state.phase !== 'playing') return false;
  if (state.prioritySeat !== seat) return false;
  if (seat !== state.defenderSeat) return false;
  if (state.field.attacks.length === 0) return false;

  state.phase = 'pileOn';
  state.attackerPassed = false;
  state.contributorPassed = false;
  state.prioritySeat = state.attackerSeat;

  // If no eligible attacker can act, close immediately.
  if (!anyContributorCanThrow()) { endBout('taken'); }
  return true;
}

export function pileOnPass(seat) {
  if (state.phase !== 'pileOn') return false;
  if (state.prioritySeat !== seat) return false;
  var contribs = adjacentContributors();
  if (contribs.indexOf(seat) === -1) return false;

  if (seat === state.attackerSeat) state.attackerPassed = true;
  else state.contributorPassed = true;

  if (allContributorsPassed(contribs)) { endBout('taken'); return true; }

  for (var c = 0; c < contribs.length; c++) {
    var s = contribs[c];
    if (s === seat) continue;
    var passed = (s === state.attackerSeat) ? state.attackerPassed : state.contributorPassed;
    if (!passed) { state.prioritySeat = s; return true; }
  }
  endBout('taken');
  return true;
}

function cyclePilePriority(fromSeat) {
  var contribs = adjacentContributors();
  if (contribs.length <= 1) { state.prioritySeat = fromSeat; return; }
  for (var i = 0; i < contribs.length; i++) {
    var s = contribs[i];
    if (s === fromSeat) continue;
    var passed = (s === state.attackerSeat) ? state.attackerPassed : state.contributorPassed;
    if (!passed) { state.prioritySeat = s; return; }
  }
  state.prioritySeat = fromSeat;
}

function allContributorsPassed(contribs) {
  for (var i = 0; i < contribs.length; i++) {
    var s = contribs[i];
    var passed = (s === state.attackerSeat) ? state.attackerPassed : state.contributorPassed;
    if (!passed) return false;
  }
  return true;
}

function anyContributorCanThrow() {
  var contribs = adjacentContributors();
  for (var i = 0; i < contribs.length; i++) {
    var hand = getPlayer(contribs[i]).hand;
    for (var h = 0; h < hand.length; h++) {
      var card = hand[h];
      // Rank must match something on the field (attacks + defenses).
      var v = parseInt(card.value);
      for (var a = 0; a < state.field.attacks.length; a++) {
        if (parseInt(state.field.attacks[a].value) === v) return true;
      }
      for (var d = 0; d < state.field.defenses.length; d++) {
        var def = state.field.defenses[d];
        if (def && parseInt(def.value) === v) return true;
      }
    }
  }
  return false;
}

// ── Bout end ───────────────────────────────────────────────────────────────

export function endBout(outcome) {
  var defenderSeat = state.defenderSeat;
  var attackerSeat = state.attackerSeat;
  var defenderHand = getPlayer(defenderSeat).hand;

  if (outcome === 'defended') {
    for (var i = 0; i < state.field.attacks.length; i++) state.discard.push(state.field.attacks[i]);
    for (var j = 0; j < state.field.defenses.length; j++) {
      if (state.field.defenses[j]) state.discard.push(state.field.defenses[j]);
    }
  } else {
    // 'taken'
    for (var k = 0; k < state.field.attacks.length; k++) defenderHand.push(state.field.attacks[k]);
    for (var m = 0; m < state.field.defenses.length; m++) {
      if (state.field.defenses[m]) defenderHand.push(state.field.defenses[m]);
    }
  }

  drawPhase();

  state.field.attacks = [];
  state.field.defenses = [];
  state.attackerPassed = false;
  state.contributorPassed = false;

  eliminationSweep();

  // Determine next roles
  if (outcome === 'defended') {
    state.attackerSeat = defenderSeat;
    if (state.players[state.attackerSeat].isOut) {
      state.attackerSeat = nextActiveSeat(defenderSeat);
    }
  } else {
    // Defender skipped this cycle
    state.attackerSeat = nextActiveSeat(defenderSeat);
  }
  state.defenderSeat = nextActiveSeat(state.attackerSeat);
  state.prioritySeat = state.attackerSeat;
  state.contributionOrder = [];

  if (checkGameOver()) return;
  state.phase = 'playing';
}

// Draw order: primary attacker → contributors in order-of-contribution → defender.
function drawPhase() {
  var order = [];
  if (state.contributionOrder.indexOf(state.attackerSeat) !== -1) {
    order.push(state.attackerSeat);
  }
  for (var i = 0; i < state.contributionOrder.length; i++) {
    var s = state.contributionOrder[i];
    if (s !== state.attackerSeat && order.indexOf(s) === -1) order.push(s);
  }
  // Ensure primary attacker draws even if they never contributed (edge case).
  if (order.indexOf(state.attackerSeat) === -1 && !state.players[state.attackerSeat].isOut) {
    order.unshift(state.attackerSeat);
  }
  if (order.indexOf(state.defenderSeat) === -1) order.push(state.defenderSeat);

  for (var d = 0; d < order.length; d++) {
    var seat = order[d];
    var hand = getPlayer(seat).hand;
    while (hand.length < 6 && state.deck.length > 0) hand.push(state.deck.pop());
  }
}

function eliminationSweep() {
  if (state.deck.length > 0) return;
  for (var i = 0; i < state.players.length; i++) {
    var p = state.players[i];
    if (!p.isOut && p.hand.length === 0) p.isOut = true;
  }
}

// ── Game over ──────────────────────────────────────────────────────────────

export function checkGameOver() {
  if (state.phase === 'gameover') return true;
  var n = activeCount();
  if (n > 1) return false;
  state.phase = 'gameover';
  if (n === 0) {
    state.winnerText = 'Draw!';
  } else {
    // The single remaining player holding cards is the Durak.
    var durak = null;
    for (var i = 0; i < state.players.length; i++) {
      if (!state.players[i].isOut) { durak = state.players[i]; break; }
    }
    if (durak && durak.isHuman && durak.seat === 0) {
      state.winnerText = 'You are the Durak!';
    } else if (durak) {
      state.winnerText = durak.name + ' is the Durak!';
    } else {
      state.winnerText = 'Game over';
    }
  }
  return true;
}

// ── Initial deal ───────────────────────────────────────────────────────────

// Draw 6 cards each, starting from the primary attacker and going clockwise.
export function dealInitial() {
  var n = state.players.length;
  for (var step = 0; step < n; step++) {
    var seat = (state.attackerSeat + step) % n;
    var hand = state.players[seat].hand;
    while (hand.length < 6 && state.deck.length > 0) hand.push(state.deck.pop());
  }
}
