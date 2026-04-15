// ═══════════════════════════════════════════════════════════════════════════
// AI — opponent decision logic. Pure functions for choosing actions, plus a
// scheduled wrapper that introduces human-feel delay before applying the move.
// ═══════════════════════════════════════════════════════════════════════════

import { state, getPlayer, otherPlayerId, isTrump } from './state.js';
import { cardStrength } from './constants.js';
import { canPlayCard, playCard, takeCards, passRound } from './gameplay.js';

var aiTimeout = null;

export function clearAiTimeout() {
  if (aiTimeout !== null) {
    clearTimeout(aiTimeout);
    aiTimeout = null;
  }
}

// Schedule a single AI action. `onDone` is called after the action mutates state.
export function scheduleAiAction(onDone) {
  clearAiTimeout();
  if (state.phase !== 'playing' || state.priority !== 'top') return;

  var delay = 500 + Math.floor(Math.random() * 400);
  aiTimeout = setTimeout(function () {
    aiTimeout = null;
    if (state.phase !== 'playing' || state.priority !== 'top') return;
    if (state.attacker === 'top') aiAttack();
    else aiDefend();
    if (onDone) onDone();
  }, delay);
}

// ── Decision helpers ───────────────────────────────────────────────────────

function findPlayableCards(hand, who) {
  var playable = [];
  for (var i = 0; i < hand.length; i++) {
    if (canPlayCard(hand[i], who)) playable.push(hand[i]);
  }
  playable.sort(function (a, b) {
    return cardStrength(a, state.trumpSuit) - cardStrength(b, state.trumpSuit);
  });
  return playable;
}

function aiAttack() {
  var hand = getPlayer('top').hand;
  if (hand.length === 0) { passRound('top'); return; }

  var playable = findPlayableCards(hand, 'top');
  var atkBoard = getPlayer('top').board;
  var defBoard = getPlayer(otherPlayerId('top')).board;
  var fieldFullyDefended = atkBoard.length > 0 && atkBoard.length === defBoard.length;

  if (playable.length > 0) {
    // If everything is defended and the AI is low on cards, don't extend the bout
    if (fieldFullyDefended && hand.length <= 2) {
      passRound('top');
      return;
    }
    // When throwing on, prefer non-trump (don't waste trumps as filler)
    if (fieldFullyDefended) {
      var nonTrump = [];
      for (var i = 0; i < playable.length; i++) {
        if (!isTrump(playable[i].suit)) nonTrump.push(playable[i]);
      }
      if (nonTrump.length > 0) { playCard(nonTrump[0].id, 'top'); return; }
      passRound('top');
      return;
    }
    playCard(playable[0].id, 'top');
    return;
  }

  // Nothing playable — pass if a complete bout sits on the field
  if (fieldFullyDefended) passRound('top');
}

function aiDefend() {
  var hand = getPlayer('top').hand;
  if (hand.length === 0) { takeCards('top'); return; }

  var valid = findPlayableCards(hand, 'top');
  if (valid.length === 0) { takeCards('top'); return; }

  var attackerBoard = getPlayer(state.attacker).board;
  var lastAtk = attackerBoard[attackerBoard.length - 1];
  var atkSuit = parseInt(lastAtk.suit);

  // Prefer beating with same-suit (cheapest); fall back to cheapest trump.
  var sameSuit = [];
  var trumpDef = [];
  for (var i = 0; i < valid.length; i++) {
    if (parseInt(valid[i].suit) === atkSuit) sameSuit.push(valid[i]);
    else trumpDef.push(valid[i]);
  }
  var pick = sameSuit.length > 0 ? sameSuit[0] : trumpDef[0];
  playCard(pick.id, 'top');
}
