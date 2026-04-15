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

// ── Entry Router ─────────────────────────────────────────────────────────────
function aiTurn(seat) {
  var diff = (typeof localStorage !== 'undefined') ? (localStorage.getItem('durak_difficulty') || 'normal') : 'normal';

  if (diff === 'easy') { aiPlayEasy(seat); return; }
  if (diff === 'hard') { aiPlayHard(seat); return; }
  
  // Normal
  if (state.phase === 'pileOn') { aiPileOn(seat); return; }
  if (seat === state.defenderSeat) { aiDefend(seat); return; }
  aiAttack(seat);
}

// ── Shared Helpers ───────────────────────────────────────────────────────────
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

function countTrumps(hand) {
  var t = 0;
  for (var i = 0; i < hand.length; i++) if (isTrump(hand[i].suit)) t++;
  return t;
}

// ═══════════════════════════════════════════════════════════════════════════
// NORMAL AI LOGIC (Legacy Greedy)
// ═══════════════════════════════════════════════════════════════════════════
function aiAttack(seat) {
  var playable = playableAttackCards(seat);
  var hand = getPlayer(seat).hand;

  if (state.field.attacks.length === 0) {
    if (playable.length > 0) { playAttack(seat, playable[0].id); return; }
    return;
  }

  if (playable.length === 0) { passAttack(seat); return; }

  if (fieldFullyDefended() && hand.length <= 2) { passAttack(seat); return; }

  var nonTrump = [];
  for (var i = 0; i < playable.length; i++) {
    if (!isTrump(playable[i].suit)) nonTrump.push(playable[i]);
  }
  if (nonTrump.length > 0) { playAttack(seat, nonTrump[0].id); return; }

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

  var defender = getPlayer(state.defenderSeat);
  var hand = getPlayer(seat).hand;
  if (defender.hand.length <= 2 || hand.length > 4) {
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

// ═══════════════════════════════════════════════════════════════════════════
// EASY AI LOGIC (Random / Erratic)
// ═══════════════════════════════════════════════════════════════════════════
function aiPlayEasy(seat) {
  if (state.phase === 'pileOn') {
    var pp = playableAttackCards(seat);
    if (pp.length === 0 || Math.random() < 0.5) { pileOnPass(seat); return; }
    playAttack(seat, pp[Math.floor(Math.random() * pp.length)].id);
    return;
  }

  if (seat === state.defenderSeat) {
    var pd = playableDefenseCards(seat);
    // Occasionally artificially miss a defense! But usually play one if able to.
    if (pd.length === 0 || Math.random() < 0.15) { declareTake(seat); return; }
    playDefense(seat, pd[Math.floor(Math.random() * pd.length)].id);
    return;
  }

  var pa = playableAttackCards(seat);
  if (state.field.attacks.length === 0) {
    if (pa.length > 0) { playAttack(seat, pa[Math.floor(Math.random() * pa.length)].id); return; }
    return;
  }
  if (pa.length === 0 || Math.random() < 0.3) { passAttack(seat); return; }
  playAttack(seat, pa[Math.floor(Math.random() * pa.length)].id);
}

// ═══════════════════════════════════════════════════════════════════════════
// HARD AI LOGIC
// ═══════════════════════════════════════════════════════════════════════════
function aiPlayHard(seat) {
  if (state.phase === 'pileOn') {
    var playable = playableAttackCards(seat);
    if (playable.length === 0) { pileOnPass(seat); return; }
    // Dump worst non-trumps aggressively on a player taking cards.
    var nonTrump = [];
    for (var i = 0; i < playable.length; i++) if (!isTrump(playable[i].suit)) nonTrump.push(playable[i]);
    if (nonTrump.length > 0) { playAttack(seat, nonTrump[0].id); return; }
    pileOnPass(seat); // Don't waste trumps on a taker in pile-on
    return;
  }

  if (seat === state.defenderSeat) {
    var pd = playableDefenseCards(seat);
    if (pd.length === 0) { declareTake(seat); return; }

    var firstOpen = state.field.defenses.indexOf(null);
    var atk = state.field.attacks[firstOpen];
    var atkSuit = parseInt(atk.suit);
    var atkVal = parseInt(atk.value);

    var sameSuit = [];
    var trumpOnly = [];
    for (var k = 0; k < pd.length; k++) {
      if (parseInt(pd[k].suit) === atkSuit) sameSuit.push(pd[k]);
      else trumpOnly.push(pd[k]);
    }

    if (sameSuit.length > 0) { playDefense(seat, sameSuit[0].id); return; }
    if (state.deck.length === 0) { playDefense(seat, trumpOnly[0].id); return; } // Endgame survival

    // We must use a trump. Do we want to?
    var cheapestTrumpVal = trumpOnly[0].value;
    if (atkVal < 10 && cheapestTrumpVal >= 11 && state.field.attacks.length === 1) {
      if (getPlayer(seat).hand.length <= 6) { declareTake(seat); return; }
    }
    playDefense(seat, trumpOnly[0].id);
    return;
  }

  // Attack logic
  var pa = playableAttackCards(seat);
  var hand = getPlayer(seat).hand;
  if (state.field.attacks.length === 0) {
    if (pa.length === 0) return;
    var counts = {};
    var nonTrumps = [];
    for (var j = 0; j < pa.length; j++) {
      counts[pa[j].value] = (counts[pa[j].value] || 0) + 1;
      if (!isTrump(pa[j].suit)) nonTrumps.push(pa[j]);
    }
    var pick = pa[0];
    if (nonTrumps.length > 0) {
      pick = nonTrumps[0];
      for (var p = 0; p < nonTrumps.length; p++) {
        if (counts[nonTrumps[p].value] > 1) { pick = nonTrumps[p]; break; }
      }
    }
    playAttack(seat, pick.id);
    return;
  }

  if (pa.length === 0) { passAttack(seat); return; }

  // Hard prefers to maximize discards if there is chance of success or endgame is near.
  if (fieldFullyDefended()) {
    if (hand.length <= 1) { passAttack(seat); return; }
    if (state.deck.length > 0 && hand.length <= 3) { passAttack(seat); return; }
  }

  // Hard mode actively throws trash, NEVER throws trumps to continue an attack unless its the kill stroke.
  var nT = [];
  for (var w = 0; w < pa.length; w++) if (!isTrump(pa[w].suit)) nT.push(pa[w]);
  if (nT.length > 0) { playAttack(seat, nT[0].id); return; }

  if (state.deck.length === 0) { playAttack(seat, pa[0].id); return; }
  passAttack(seat);
}

// Silence unused-import hint for adjacentContributors
void adjacentContributors;

export { aiTurn as _test_aiTurn };
