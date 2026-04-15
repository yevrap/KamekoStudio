// ═══════════════════════════════════════════════════════════════════════════
// GAMEPLAY — pure rule mutations on `state`. Returns boolean success so the
// orchestrator (main.js) can decide whether to re-render and tick the AI.
// ═══════════════════════════════════════════════════════════════════════════

import { state, getPlayer, otherPlayerId } from './state.js';
import { canBeat } from './constants.js';

// Can `who` legally play `card` right now?
export function canPlayCard(card, who) {
  if (state.phase !== 'playing') return false;
  if (who !== state.priority) return false;

  var cardVal  = parseInt(card.value);
  var isAttacker = (who === state.attacker);
  var attackerBoard = getPlayer(state.attacker).board;
  var defenderBoard = getPlayer(otherPlayerId(state.attacker)).board;

  if (isAttacker) {
    // Opening attack — any card legal
    if (attackerBoard.length === 0 && defenderBoard.length === 0) return true;
    // Throw-on — rank must already be on the field
    for (var i = 0; i < attackerBoard.length; i++) {
      if (parseInt(attackerBoard[i].value) === cardVal) return true;
    }
    for (var j = 0; j < defenderBoard.length; j++) {
      if (parseInt(defenderBoard[j].value) === cardVal) return true;
    }
    return false;
  }

  // Defender — must beat the most recent attacker card (the last unbeaten)
  var lastAttack = attackerBoard.length > 0 ? attackerBoard[attackerBoard.length - 1] : null;
  if (!lastAttack) return false;
  return canBeat(lastAttack, card, state.trumpSuit);
}

// Attacker draws to 6 first, then defender (standard Durak draw order)
export function autoDrawBoth() {
  var first  = getPlayer(state.attacker).hand;
  var second = getPlayer(otherPlayerId(state.attacker)).hand;
  while (first.length < 6 && state.deck.length > 0)  first.push(state.deck.pop());
  while (second.length < 6 && state.deck.length > 0) second.push(state.deck.pop());
}

// Play a specific card. Returns true if the action mutated state.
export function playCard(cardId, who) {
  if (state.phase !== 'playing') return false;
  if (who !== state.priority) return false;

  var hand = getPlayer(who).hand;
  var idx = -1;
  for (var i = 0; i < hand.length; i++) {
    if (hand[i].id === cardId) { idx = i; break; }
  }
  if (idx === -1) return false;

  var card = hand[idx];
  if (!canPlayCard(card, who)) return false;

  hand.splice(idx, 1);
  getPlayer(who).board.push(card);
  state.priority = otherPlayerId(who);
  return true;
}

// Defender takes all cards from the field. Attacker then draws back to six.
export function takeCards(who) {
  if (state.phase !== 'playing') return false;
  if (who !== state.priority) return false;
  if (who === state.attacker) return false;

  var atkBoard = getPlayer(state.attacker).board;
  var defBoard = getPlayer(who).board;
  if (atkBoard.length === 0 && defBoard.length === 0) return false;

  var defHand = getPlayer(who).hand;
  while (atkBoard.length > 0) defHand.push(atkBoard.pop());
  while (defBoard.length > 0) defHand.push(defBoard.pop());

  // Attacker keeps role next bout; defender skips their own attack turn
  state.priority = otherPlayerId(who);

  // Attacker re-draws to six
  var atkHand = getPlayer(state.attacker).hand;
  while (atkHand.length < 6 && state.deck.length > 0) atkHand.push(state.deck.pop());

  return true;
}

// Attacker passes / ends a fully-defended bout. Field clears, roles swap.
export function passRound(who) {
  if (state.phase !== 'playing') return false;
  if (who !== state.priority) return false;
  if (who !== state.attacker) return false;

  var atkBoard = getPlayer(state.attacker).board;
  var defBoard = getPlayer(otherPlayerId(state.attacker)).board;
  if (atkBoard.length === 0) return false;
  if (atkBoard.length !== defBoard.length) return false;

  while (atkBoard.length > 0) state.discard.push(atkBoard.pop());
  while (defBoard.length > 0) state.discard.push(defBoard.pop());

  autoDrawBoth();

  state.attacker = otherPlayerId(state.attacker);
  state.priority = state.attacker;
  return true;
}

// Returns true and sets state.phase = 'gameover' + winnerText if the game ended
export function checkGameOver() {
  if (state.phase !== 'playing') return state.phase === 'gameover';
  if (state.deck.length > 0) return false;
  var top = getPlayer('top');
  var bot = getPlayer('bottom');
  if (top.board.length > 0 || bot.board.length > 0) return false;
  if (top.hand.length === 0) {
    state.phase = 'gameover';
    state.winnerText = state.aiMode ? 'You lose!' : 'Top player wins!';
    return true;
  }
  if (bot.hand.length === 0) {
    state.phase = 'gameover';
    state.winnerText = state.aiMode ? 'You win!' : 'Bottom player wins!';
    return true;
  }
  return false;
}
