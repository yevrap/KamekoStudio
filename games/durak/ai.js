// ═══════════════════════════════════════════════════════════════════════════
// AI — decision logic for non-human seats. One move per scheduled tick so the
// orchestrator in main.js can drive consecutive AI turns with visible pacing.
// ═══════════════════════════════════════════════════════════════════════════

import { state, getPlayer, isTrump, adjacentContributors } from './state.js';
import { cardStrength } from './constants.js';
import {
  legalAttack, legalDefense, playAttack, playDefense,
  passAttack, declareTake, pileOnPass
} from './gameplay.js';

var aiTimeout = null;

export function clearAiTimeout() {
  if (aiTimeout !== null) { clearTimeout(aiTimeout); aiTimeout = null; }
}

// Schedule the AI player at `seat` to take one action.
export function scheduleAiAction(seat, onDone) {
  clearAiTimeout();
  if (state.phase !== 'playing' && state.phase !== 'pileOn') return;
  if (state.prioritySeat !== seat) return;
  if (getPlayer(seat).isHuman) return;

  var delay = 500 + Math.floor(Math.random() * 400);
  aiTimeout = setTimeout(function () {
    aiTimeout = null;
    if (state.phase !== 'playing' && state.phase !== 'pileOn') return;
    if (state.prioritySeat !== seat) return;
    if (getPlayer(seat).isHuman) return;

    aiTurn(seat);
    if (onDone) onDone();
  }, delay);
}

function aiTurn(seat) {
  if (state.phase === 'pileOn') { aiPileOn(seat); return; }
  if (seat === state.defenderSeat) { aiDefend(seat); return; }
  aiAttack(seat);
}

function playableAttackCards(seat) {
  var hand = getPlayer(seat).hand;
  var out = [];
  for (var i = 0; i < hand.length; i++) {
    if (legalAttack(seat, hand[i])) out.push(hand[i]);
  }
  out.sort(function (a, b) { return cardStrength(a, state.trumpSuit) - cardStrength(b, state.trumpSuit); });
  return out;
}

function playableDefenseCards(seat) {
  var hand = getPlayer(seat).hand;
  var out = [];
  for (var i = 0; i < hand.length; i++) {
    if (legalDefense(seat, hand[i])) out.push(hand[i]);
  }
  out.sort(function (a, b) { return cardStrength(a, state.trumpSuit) - cardStrength(b, state.trumpSuit); });
  return out;
}

function fieldFullyDefended() {
  if (state.field.attacks.length === 0) return false;
  for (var i = 0; i < state.field.defenses.length; i++) {
    if (state.field.defenses[i] === null) return false;
  }
  return true;
}

function aiAttack(seat) {
  var playable = playableAttackCards(seat);
  var hand = getPlayer(seat).hand;

  if (state.field.attacks.length === 0) {
    // Opening attack — required. Play cheapest.
    if (playable.length > 0) { playAttack(seat, playable[0].id); return; }
    // No cards? Nothing to do; other contributor or defender will proceed.
    return;
  }

  // Throw-on window: field must be fully defended (otherwise priority would be defender's).
  if (playable.length === 0) { passAttack(seat); return; }

  // Conserve cards when low; prefer non-trumps as filler.
  if (fieldFullyDefended() && hand.length <= 2) { passAttack(seat); return; }

  var nonTrump = [];
  for (var i = 0; i < playable.length; i++) {
    if (!isTrump(playable[i].suit)) nonTrump.push(playable[i]);
  }
  if (nonTrump.length > 0) { playAttack(seat, nonTrump[0].id); return; }
  // Only trumps left; throw one only if it meaningfully pressures a weak defender.
  var defender = getPlayer(state.defenderSeat);
  if (defender.hand.length <= 2) { playAttack(seat, playable[0].id); return; }
  passAttack(seat);
}

function aiDefend(seat) {
  var playable = playableDefenseCards(seat);
  if (playable.length === 0) { declareTake(seat); return; }

  var firstOpen = state.field.defenses.indexOf(null);
  var atk = state.field.attacks[firstOpen];
  var atkSuit = parseInt(atk.suit);

  // Prefer cheapest same-suit; otherwise cheapest trump.
  var sameSuit = [];
  var trumpOnly = [];
  for (var i = 0; i < playable.length; i++) {
    var c = playable[i];
    if (parseInt(c.suit) === atkSuit) sameSuit.push(c);
    else trumpOnly.push(c);
  }
  var pick = sameSuit.length > 0 ? sameSuit[0] : trumpOnly[0];
  playDefense(seat, pick.id);
}

function aiPileOn(seat) {
  var playable = playableAttackCards(seat);
  if (playable.length === 0) { pileOnPass(seat); return; }

  // Pile on aggressively against a weak defender; otherwise conserve.
  var defender = getPlayer(state.defenderSeat);
  var hand = getPlayer(seat).hand;
  if (defender.hand.length <= 2 || hand.length > 4) {
    // Prefer non-trump in pile-on too.
    var nonTrump = [];
    for (var i = 0; i < playable.length; i++) {
      if (!isTrump(playable[i].suit)) nonTrump.push(playable[i]);
    }
    var pick = (nonTrump.length > 0) ? nonTrump[0] : playable[0];
    playAttack(seat, pick.id);
    return;
  }
  pileOnPass(seat);
}

// Silence unused-import hint for adjacentContributors (kept available for future heuristics).
void adjacentContributors;
