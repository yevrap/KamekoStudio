// ═══════════════════════════════════════════════════════════════════════════
// GAMEPLAY — N-player Durak bout engine. Pure mutations on `state`. All
// actions return boolean success so main.js can decide whether to re-render.
// ═══════════════════════════════════════════════════════════════════════════

import {
  state, getPlayer, nextActiveSeat, adjacentContributors, activeCount
} from './state.js';
import { canBeat } from './constants.js';
import { logEvent } from './log.js';

// ── Predicates ─────────────────────────────────────────────────────────────

export function legalAttack(seat, card) {
  if (state.phase !== 'playing' && state.phase !== 'pileOn') return false;
  if (state.prioritySeat !== seat) return false;
  return canThrow(seat, card);
}

// Throw-in rules minus the turn check, so a seat that doesn't hold priority
// yet can be asked about too (anyContributorCanThrow).
function canThrow(seat, card) {
  if (!state.players[seat] || state.players[seat].isOut) return false;

  var contribs = adjacentContributors();
  if (contribs.indexOf(seat) === -1) return false;

  var attackCount = state.field.attacks.length;
  if (attackCount >= 6) return false;

  // Unbeaten cards may never outnumber the defender's hand — before a Take,
  // and in the pile-on after it (classic rule; the pile-on was uncapped).
  var undefended = 0;
  for (var i = 0; i < state.field.defenses.length; i++) {
    if (state.field.defenses[i] === null) undefended++;
  }
  var defender = getPlayer(state.defenderSeat);
  if (undefended >= defender.hand.length) return false;

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
  return defenseTargetIndex(card) !== -1;
}

// Every open attack this card can beat. After a transfer several attacks can
// be open at once; the defender may cover them in any order, so a defense is
// legal against any open attack, not just the first.
export function defenseTargets(card) {
  var out = [];
  for (var i = 0; i < state.field.attacks.length; i++) {
    if (state.field.defenses[i] === null &&
        canBeat(state.field.attacks[i], card, state.trumpSuit)) out.push(i);
  }
  return out;
}

// The default pairing — the first open attack it beats (AI, and a human tap
// with only one possible target).
export function defenseTargetIndex(card) {
  var targets = defenseTargets(card);
  return targets.length ? targets[0] : -1;
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
  
  if (state.field.attacks.length === 0) {
    state.attacksThisGame++;
  }
  
  removeFromHand(seat, cardId);
  state.field.attacks.push(card);
  state.field.defenses.push(null);
  
  logEvent('attack', { seat: seat, card: card });

  if (state.contributionOrder.indexOf(seat) === -1) state.contributionOrder.push(seat);

  if (state.phase === 'pileOn') {
    if (state.field.attacks.length >= 6) { endBout('taken'); return true; }
    cyclePilePriority(seat);
    return true;
  }

  // Normal attack phase: defender must now respond.
  state.prioritySeat = state.defenderSeat;
  state.attackerPassed = false;
  state.contributorPassed = false;
  return true;
}

export function legalTransfer(seat, card) {
  if (!state.variantPerevodnoy) return false;
  if (state.phase !== 'playing') return false;
  if (state.prioritySeat !== seat) return false;
  if (seat !== state.defenderSeat) return false;
  if (state.field.attacks.length === 0) return false;

  // Cannot transfer if any defense has already been made.
  for (var i = 0; i < state.field.defenses.length; i++) {
    if (state.field.defenses[i] !== null) return false;
  }

  // Rank must match the attacking card(s).
  var v = parseInt(card.value);
  for (var a = 0; a < state.field.attacks.length; a++) {
    if (parseInt(state.field.attacks[a].value) !== v) return false;
  }

  // Check first turn restriction
  if (state.attacksThisGame === 1 && !state.variantFirstTransfer) {
    return false;
  }

  // Next active player must have enough cards to defend against the combined attacks.
  var nextSeat = nextActiveSeat(seat);
  var nextPlayer = getPlayer(nextSeat);
  if (nextPlayer.hand.length < state.field.attacks.length + 1) return false;

  return true;
}

export function playTransfer(seat, cardId) {
  var card = findCard(seat, cardId);
  if (!card || !legalTransfer(seat, card)) return false;
  removeFromHand(seat, cardId);
  state.field.attacks.push(card);
  state.field.defenses.push(null);
  
  logEvent('transfer', { seat: seat, card: card });

  // Shift defender to the next player.
  state.attackerSeat = seat;
  state.defenderSeat = nextActiveSeat(seat);
  state.prioritySeat = state.defenderSeat;

  // Reset pass flags since the defender changed. contributionOrder is NOT
  // reset — the seat(s) that threw the original attack(s) already earned a
  // spot in the post-bout draw phase, and wiping it here would silently drop
  // them from drawPhase() forever. The transferrer is a contributor too.
  state.attackerPassed = false;
  state.contributorPassed = false;
  if (state.contributionOrder.indexOf(seat) === -1) state.contributionOrder.push(seat);

  return true;
}

// `target` picks which open attack to cover (tap-to-target); omitted, the
// card covers the first open attack it beats.
export function playDefense(seat, cardId, target) {
  var card = findCard(seat, cardId);
  if (!card || !legalDefense(seat, card)) return false;
  if (target === undefined) target = defenseTargetIndex(card);
  else if (defenseTargets(card).indexOf(target) === -1) return false;
  removeFromHand(seat, cardId);
  state.field.defenses[target] = card;

  logEvent('defend', { seat: seat, card: card });

  // Priority returns to the primary attacker only once every attack is
  // covered. After a transfer several attacks are open at once; handing
  // priority back early deadlocks the attacker, who can neither add a card
  // (no rank match) nor pass (field not fully defended).
  var stillOpen = state.field.defenses.indexOf(null) !== -1;
  state.prioritySeat = stillOpen ? state.defenderSeat : state.attackerSeat;
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

  logEvent('pass', { seat: seat });
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

  logEvent('take', { seat: seat });

  // If no eligible attacker can act, close immediately.
  if (!anyContributorCanThrow()) { endBout('taken'); }
  return true;
}

export function pileOnPass(seat) {
  if (state.phase !== 'pileOn') return false;
  if (state.prioritySeat !== seat) return false;
  var contribs = adjacentContributors();
  if (contribs.indexOf(seat) === -1) return false;

  logEvent('pass', { seat: seat });
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
      if (canThrow(contribs[i], hand[h])) return true;
    }
  }
  return false;
}

// ── Forced moves ───────────────────────────────────────────────────────────

export function cardPlayable(seat, card) {
  return legalAttack(seat, card) || legalDefense(seat, card) || legalTransfer(seat, card);
}

// The move left to a seat that holds priority but can't play any card:
// 'pass' or 'done' for a thrower, 'take' for the defender. null while some
// card is playable or it isn't this seat's turn. The AI passes on its own;
// main.js plays this for a human so the table never waits on a dead turn.
export function forcedAction(seat) {
  if (state.phase !== 'playing' && state.phase !== 'pileOn') return null;
  if (state.prioritySeat !== seat) return null;
  var p = getPlayer(seat);
  if (!p || p.isOut) return null;
  if (state.field.attacks.length === 0) return null;
  for (var i = 0; i < p.hand.length; i++) {
    if (cardPlayable(seat, p.hand[i])) return null;
  }
  if (state.phase === 'pileOn') return 'done';
  return seat === state.defenderSeat ? 'take' : 'pass';
}

export function playForcedAction(seat) {
  var action = forcedAction(seat);
  if (action === 'take') return declareTake(seat);
  if (action === 'pass') return passAttack(seat);
  if (action === 'done') return pileOnPass(seat);
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

  logEvent(outcome === 'defended' ? 'bout_defended' : 'bout_taken', { seat: defenderSeat });
  state.boutNum++;

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
    if (!p.isOut && p.hand.length === 0) {
      p.isOut = true;
      if (state.finishOrder.indexOf(p.seat) === -1) state.finishOrder.push(p.seat);
    }
  }
}

// ── Game over ──────────────────────────────────────────────────────────────

// Seat 0 is always human (state.js), in both AI and hot-seat modes, so its
// outcome doubles as the device-owner's personal win/loss record.
function recordMatchResult(outcome) {
  if (typeof localStorage === 'undefined') return;
  var key = outcome === 'win' ? 'durak_wins' : outcome === 'loss' ? 'durak_losses' : 'durak_draws';
  var count = parseInt(localStorage.getItem(key), 10) || 0;
  localStorage.setItem(key, String(count + 1));
}

export function getMatchStats() {
  if (typeof localStorage === 'undefined') return { wins: 0, losses: 0, draws: 0 };
  return {
    wins: parseInt(localStorage.getItem('durak_wins'), 10) || 0,
    losses: parseInt(localStorage.getItem('durak_losses'), 10) || 0,
    draws: parseInt(localStorage.getItem('durak_draws'), 10) || 0
  };
}

export function checkGameOver() {
  if (state.phase === 'gameover') return true;
  var n = activeCount();
  if (n > 1) return false;
  state.phase = 'gameover';
  if (n === 0) {
    state.winnerOutcome = { kind: 'draw' };
    recordMatchResult('draw');
  } else {
    // The single remaining player holding cards is the Durak.
    var durak = null;
    for (var i = 0; i < state.players.length; i++) {
      if (!state.players[i].isOut) { durak = state.players[i]; break; }
    }
    if (durak && state.finishOrder.indexOf(durak.seat) === -1) {
      state.finishOrder.push(durak.seat);
    }
    if (durak && durak.isHuman && durak.seat === 0) {
      state.winnerOutcome = { kind: 'durak', isYou: true };
      recordMatchResult('loss');
    } else if (durak) {
      state.winnerOutcome = { kind: 'durak', isYou: false, name: durak.name };
      recordMatchResult('win');
    } else {
      state.winnerOutcome = { kind: 'gameover' };
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
