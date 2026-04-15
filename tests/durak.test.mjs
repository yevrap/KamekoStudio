import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Card, canBeat, buildDeck, cardStrength } from '../games/durak/constants.js';
import {
  state, newGame, setupPlayers, getPlayer, isTrump,
  nextActiveSeat, adjacentContributors, activeCount
} from '../games/durak/state.js';
import {
  legalAttack, legalDefense, playAttack, playDefense,
  passAttack, declareTake, pileOnPass, endBout, dealInitial, checkGameOver
} from '../games/durak/gameplay.js';
import { _test_aiTurn } from '../games/durak/ai.js';

global.localStorage = {
  _store: {},
  getItem: function(k) { return this._store[k] || null; },
  setItem: function(k, v) { this._store[k] = String(v); }
};

// ─── canBeat (pure rule) ─────────────────────────────────────────────────────

test('canBeat: higher same suit beats lower same suit', () => {
  assert.equal(canBeat(new Card(7, 1), new Card(9, 1), 4), true);
});

test('canBeat: lower same suit cannot beat higher same suit', () => {
  assert.equal(canBeat(new Card(10, 1), new Card(8, 1), 4), false);
});

test('canBeat: equal value same suit cannot beat', () => {
  assert.equal(canBeat(new Card(10, 1), new Card(10, 1), 4), false);
});

test('canBeat: trump beats any non-trump', () => {
  assert.equal(canBeat(new Card(14, 1), new Card(6, 4), 4), true);
});

test('canBeat: non-trump cannot beat trump', () => {
  assert.equal(canBeat(new Card(6, 4), new Card(14, 1), 4), false);
});

test('canBeat: higher trump beats lower trump', () => {
  assert.equal(canBeat(new Card(7, 4), new Card(8, 4), 4), true);
});

test('canBeat: lower trump cannot beat higher trump', () => {
  assert.equal(canBeat(new Card(10, 4), new Card(8, 4), 4), false);
});

test('canBeat: different non-trump suits cannot beat', () => {
  assert.equal(canBeat(new Card(6, 1), new Card(14, 2), 4), false);
});

// ─── buildDeck ───────────────────────────────────────────────────────────────

test('buildDeck: 36 unique cards (4 suits × 9 ranks 6-14)', () => {
  const deck = buildDeck();
  assert.equal(deck.length, 36);
  assert.equal(new Set(deck.map(c => c.id)).size, 36);
});

test('buildDeck: covers all suits and ranks 6–14', () => {
  const deck = buildDeck();
  for (let s = 1; s <= 4; s++) {
    for (let v = 6; v <= 14; v++) {
      assert.ok(deck.find(c => c.value === v && c.suit === s), `missing ${v}/${s}`);
    }
  }
});

// ─── cardStrength ────────────────────────────────────────────────────────────

test('cardStrength: trump always ranks above any non-trump', () => {
  assert.ok(cardStrength(new Card(6, 4), 4) > cardStrength(new Card(14, 1), 4));
});

test('cardStrength: within same group, higher value wins', () => {
  assert.ok(cardStrength(new Card(10, 1), 4) > cardStrength(new Card(7, 1), 4));
});

// ─── newGame / dealInitial ──────────────────────────────────────────────────

test('newGame(ai,2): trump set from bottom; deck is 36 pre-deal', () => {
  newGame('ai', 2);
  assert.equal(state.trumpSuit, parseInt(state.trumpCard.suit));
  assert.equal(state.deck.length, 36);
  assert.equal(state.players.length, 2);
  assert.equal(state.players[0].isHuman, true);
  assert.equal(state.players[1].isHuman, false);
});

test('newGame + dealInitial: everyone holds 6 cards (2 players)', () => {
  newGame('ai', 2);
  dealInitial();
  assert.equal(state.players[0].hand.length, 6);
  assert.equal(state.players[1].hand.length, 6);
  assert.equal(state.deck.length, 24);
});

test('newGame + dealInitial: 4-player deal draws 24 total', () => {
  newGame('ai', 4);
  dealInitial();
  assert.equal(state.players.length, 4);
  for (let i = 0; i < 4; i++) assert.equal(state.players[i].hand.length, 6);
  assert.equal(state.deck.length, 36 - 24);
});

test('hotseat mode marks all players human', () => {
  newGame('hotseat', 3);
  for (let i = 0; i < 3; i++) assert.equal(state.players[i].isHuman, true);
});

// ─── Rotation helpers ───────────────────────────────────────────────────────

test('nextActiveSeat skips eliminated seats', () => {
  setupPlayers('ai', 4);
  state.players[1].isOut = true;
  assert.equal(nextActiveSeat(0), 2);
  assert.equal(nextActiveSeat(2), 3);
  assert.equal(nextActiveSeat(3), 0);
});

// ─── adjacentContributors ───────────────────────────────────────────────────

test('adjacentContributors at 2 players = [attacker] only', () => {
  newGame('ai', 2);
  state.attackerSeat = 0; state.defenderSeat = 1;
  assert.deepEqual(adjacentContributors(), [0]);
});

test('adjacentContributors at 3 players = [attacker, rightOfDefender]', () => {
  newGame('ai', 3);
  state.attackerSeat = 0; state.defenderSeat = 1;
  assert.deepEqual(adjacentContributors(), [0, 2]);
});

test('adjacentContributors at 4 players excludes the far seat', () => {
  newGame('ai', 4);
  state.attackerSeat = 0; state.defenderSeat = 1;
  // primary = 0, right of defender (1) = 2. Seat 3 must NOT be a contributor.
  assert.deepEqual(adjacentContributors(), [0, 2]);
});

test('adjacentContributors at 6 players excludes far seats', () => {
  newGame('ai', 6);
  state.attackerSeat = 0; state.defenderSeat = 1;
  assert.deepEqual(adjacentContributors(), [0, 2]);
});

// ─── legalAttack ────────────────────────────────────────────────────────────

function seatContributor(count, attacker, defender) {
  newGame('ai', count);
  state.attackerSeat = attacker;
  state.defenderSeat = defender;
  state.prioritySeat = attacker;
  state.phase = 'playing';
  state.field.attacks = [];
  state.field.defenses = [];
  state.contributionOrder = [];
  for (const p of state.players) p.hand = [];
}

test('legalAttack: opening attacker can play any card', () => {
  seatContributor(4, 0, 1);
  const c = new Card(7, 1);
  state.players[0].hand = [c];
  state.players[1].hand = [new Card(8, 1), new Card(8, 2), new Card(8, 3), new Card(8, 4), new Card(9, 1), new Card(9, 2)];
  assert.equal(legalAttack(0, c), true);
});

test('legalAttack: non-adjacent seat cannot throw in', () => {
  seatContributor(4, 0, 1);
  // Bout in progress, a 7 is on the field.
  state.field.attacks = [new Card(7, 1)];
  state.field.defenses = [null];
  state.prioritySeat = 3;
  const c = new Card(7, 2);
  state.players[3].hand = [c];
  state.players[1].hand = [new Card(10, 1), new Card(10, 2), new Card(10, 3)];
  assert.equal(legalAttack(3, c), false);
});

test('legalAttack: 6-card cap enforced', () => {
  seatContributor(3, 0, 1);
  // Field already has 6 attacks all defended.
  state.field.attacks = [
    new Card(7, 1), new Card(7, 2), new Card(7, 3), new Card(7, 4),
    new Card(8, 1), new Card(8, 2)
  ];
  state.field.defenses = [
    new Card(9, 1), new Card(9, 2), new Card(9, 3), new Card(9, 4),
    new Card(10, 1), new Card(10, 2)
  ];
  const c = new Card(7, 1);
  state.players[0].hand = [new Card(8, 3)];
  assert.equal(legalAttack(0, new Card(8, 3)), false);
});

test('legalAttack: capped by defender hand size', () => {
  seatContributor(3, 0, 1);
  // Defender has 1 card, 0 defenses so far, 1 undefended attack already.
  state.field.attacks = [new Card(7, 1)];
  state.field.defenses = [null];
  state.prioritySeat = 0;  // Can't happen normally (priority should be defender) — force it
  const c = new Card(7, 2);
  state.players[0].hand = [c];
  state.players[1].hand = [new Card(14, 4)];
  // Undefended (1) >= defender.hand.length (1) → blocked
  assert.equal(legalAttack(0, c), false);
});

// ─── Full bout: attack → defend → pass → rotation ──────────────────────────

test('bout: defended round → defender becomes next attacker (3 players)', () => {
  newGame('ai', 3);
  state.deck = []; // skip draws for determinism
  state.trumpSuit = 4;
  state.attackerSeat = 0; state.defenderSeat = 1; state.prioritySeat = 0;
  state.phase = 'playing';
  state.field.attacks = []; state.field.defenses = [];
  state.contributionOrder = [];
  // Give each player an extra card so none are eliminated on this bout.
  state.players[0].hand = [new Card(7, 1), new Card(12, 3)];
  state.players[1].hand = [new Card(9, 1), new Card(12, 2)];
  state.players[2].hand = [new Card(14, 2), new Card(12, 1)];

  const c1 = state.players[0].hand[0];
  assert.equal(playAttack(0, c1.id), true);
  assert.equal(state.prioritySeat, 1);

  const c2 = state.players[1].hand[0];
  assert.equal(playDefense(1, c2.id), true);
  assert.equal(state.prioritySeat, 0);

  // Attacker passes, then contributor passes → defended
  assert.equal(passAttack(0), true);
  assert.equal(state.prioritySeat, 2);
  assert.equal(passAttack(2), true);

  assert.equal(state.attackerSeat, 1); // defender became attacker
  assert.equal(state.defenderSeat, 2);
  assert.equal(state.phase, 'playing');
  assert.equal(state.discard.length, 2);
});

test('bout: taken round → defender skipped, next seat attacks', () => {
  newGame('ai', 3);
  state.deck = [];
  state.attackerSeat = 0; state.defenderSeat = 1; state.prioritySeat = 0;
  state.phase = 'playing';
  state.field.attacks = []; state.field.defenses = [];
  state.contributionOrder = [];
  state.players[0].hand = [new Card(7, 1), new Card(12, 3)];
  state.players[1].hand = [new Card(6, 2), new Card(12, 2)]; // can't beat
  state.players[2].hand = [new Card(13, 4)]; // no rank match, can't throw on

  playAttack(0, state.players[0].hand[0].id);
  assert.equal(state.prioritySeat, 1);
  assert.equal(declareTake(1), true);

  // Defender (seat 1) is skipped → next attacker is nextActiveSeat(1) = 2
  assert.equal(state.attackerSeat, 2);
  assert.equal(state.defenderSeat, 0);
  // Defender absorbed the card (kept their 2 + took 1 = 3)
  assert.equal(state.players[1].hand.length, 3);
});

// ─── Pile-on on the taker ──────────────────────────────────────────────────

test('pileOn: non-adjacent seat cannot throw; cards end up with defender', () => {
  newGame('ai', 4);
  state.deck = [];
  state.attackerSeat = 0; state.defenderSeat = 1; state.prioritySeat = 0;
  state.phase = 'playing';
  state.field.attacks = []; state.field.defenses = [];
  state.contributionOrder = [];
  state.players[0].hand = [new Card(7, 1), new Card(7, 2)];
  state.players[1].hand = [new Card(6, 3)]; // can't beat
  state.players[2].hand = [new Card(7, 3)]; // right-of-defender: legal
  state.players[3].hand = [new Card(7, 4)]; // far seat: NOT legal

  playAttack(0, state.players[0].hand[0].id); // 7♠
  declareTake(1);
  assert.equal(state.phase, 'pileOn');
  assert.equal(state.prioritySeat, 0);

  // Seat 3 is not a contributor.
  assert.equal(legalAttack(3, state.players[3].hand[0]), false);

  // Seat 0 throws on 7♣
  assert.equal(playAttack(0, state.players[0].hand.find(c => c.value === 7 && c.suit === 2).id), true);
  // Then seat 2 (right-of-defender) throws on 7♦
  assert.equal(state.prioritySeat, 2);
  assert.equal(playAttack(2, state.players[2].hand[0].id), true);
  // Seat 0 passes, seat 2 already played; next is seat 0.
  // cyclePilePriority after seat 2's throw puts priority back on seat 0.
  assert.equal(state.prioritySeat, 0);
  pileOnPass(0);
  assert.equal(state.prioritySeat, 2);
  pileOnPass(2);

  // Bout ended with all cards to defender (seat 1).
  // Original 7♠ + 7♣ from seat 0 + 7♦ from seat 2 = 3 cards.
  assert.equal(state.players[1].hand.length, 1 /*kept 6♦*/ + 3);
});

// ─── Draw order ────────────────────────────────────────────────────────────

test('draw order: attacker → contributors (in contribution order) → defender last', () => {
  newGame('ai', 3);
  state.trumpSuit = 4;
  // Small deterministic deck of 9 cards we know the top of.
  state.deck = [
    new Card(6,1), new Card(6,2), new Card(6,3),
    new Card(10,1), new Card(10,2), new Card(10,3),
    new Card(11,1), new Card(11,2), new Card(11,3)
  ];
  state.attackerSeat = 0; state.defenderSeat = 1; state.prioritySeat = 0;
  state.phase = 'playing';
  state.field.attacks = []; state.field.defenses = [];
  state.contributionOrder = [];
  // Everyone empty to start — draw fills each to 6 in order.
  for (const p of state.players) p.hand = [];

  // Play a trivial bout: 0 attacks 7♠, 2 throws on 7♣ (contributor), 1 defends both, attacker+contributor pass.
  state.players[0].hand = [new Card(7, 1)];
  state.players[1].hand = [new Card(9, 1), new Card(9, 2)];
  state.players[2].hand = [new Card(7, 2)];

  playAttack(0, state.players[0].hand[0].id);       // 0 → attacks
  playDefense(1, state.players[1].hand[0].id);      // 1 beats
  // Now priority back to 0. Seat 0 is empty, so passes.
  passAttack(0);
  // Now priority on seat 2 (right-of-defender).
  playAttack(2, state.players[2].hand[0].id);       // 2 throws 7♣
  playDefense(1, state.players[1].hand[0].id);      // 1 beats with 9♣
  // Both attackers pass → defended.
  passAttack(0);
  passAttack(2);

  // Draw order is attacker(0) → contributor(2) → defender(1).
  // Deck popped LIFO: 11♠,11♣,11♦,10♠,10♣,10♦,6♠,6♣,6♦
  // Seat 0 draws to 6: pops 6 from top. Gets [11♠,11♣,11♦,10♠,10♣,10♦]
  // Seat 2 draws to 6: 3 remain in deck, plus currently 0 in hand → seat 2 ends with 3.
  // Seat 1 already had 0 cards, deck empty → 0.
  assert.equal(state.players[0].hand.length, 6);
  assert.equal(state.players[2].hand.length, 3);
  assert.equal(state.players[1].hand.length, 0);
});

// ─── Elimination & game over ───────────────────────────────────────────────

test('elimination: empty hand + empty deck → isOut; last standing is Durak', () => {
  newGame('ai', 2);
  state.deck = [];
  state.attackerSeat = 0; state.defenderSeat = 1; state.prioritySeat = 0;
  state.phase = 'playing';
  state.field.attacks = []; state.field.defenses = [];
  state.contributionOrder = [];
  state.players[0].hand = [new Card(14, 1)]; // ace
  state.players[1].hand = [new Card(7, 1)];  // 7 of spades (different suit too)
  state.trumpSuit = 4;

  playAttack(0, state.players[0].hand[0].id);  // 14♠
  // Defender can't beat with 7♠
  declareTake(1);
  // Seat 0 has no cards to pile on → endBout('taken')
  // Seat 1 now has [7♠, 14♠], seat 0 has 0 cards and deck empty → isOut
  assert.equal(state.players[0].isOut, true);
  assert.equal(state.phase, 'gameover');
  assert.match(state.winnerText, /Durak/i);
});

// ─── isTrump ────────────────────────────────────────────────────────────────

test('isTrump: matches state.trumpSuit', () => {
  newGame('ai', 2);
  state.trumpSuit = 3;
  assert.equal(isTrump(3), true);
  assert.equal(isTrump('3'), true);
  assert.equal(isTrump(1), false);
});

// ─── AI Difficulty Logic (`_test_aiTurn`) ───────────────────────────────────

function setupAiBoard() {
  newGame('ai', 2);
  state.deck = []; // Endgame
  state.trumpSuit = 4;
  state.attackerSeat = 0; state.defenderSeat = 1; state.prioritySeat = 1;
  state.phase = 'playing';
  state.field.attacks = [new Card(6, 1)]; // 6 of Spades
  state.field.defenses = [null];
  state.contributionOrder = [];
}

test('AI Normal: Greedily uses a high trump if it is the only legal defense (endgame)', () => {
  setupAiBoard();
  global.localStorage.setItem('durak_difficulty', 'normal');
  // AI is defender. Hand has no spades. Has a low trump (10♥) and high trump (14♥).
  state.players[1].hand = [new Card(10, 4), new Card(14, 4)];
  _test_aiTurn(1);
  
  // Normal AI picks the CHEAPEST trump (10♥).
  // Verify field defense.
  assert.equal(state.field.defenses[0].value, 10);
});

test('AI Hard: Takes instead of spending a high trump on a low attack when hand is comfortable', () => {
  setupAiBoard();
  global.localStorage.setItem('durak_difficulty', 'hard');
  // AI is defender. Hand has no spades. Hand has high trump (11♥).
  // The attack is a weak 6♠. The AI has 5 cards total, very comfortable.
  state.players[1].hand = [new Card(11, 4), new Card(7, 2), new Card(8, 2), new Card(9, 2), new Card(10, 2)];
  _test_aiTurn(1);
  
  // Hard AI should declare 'Take' rather than wasting an 11-Trump on a 6-Attack.
  // When 'declareTake' happens, the phase changes to 'pileOn'.
  assert.equal(state.phase, 'pileOn');
  assert.equal(state.field.defenses[0], null);
});

test('AI Hard: Protects self in endgame by defending with highest trump if forced', () => {
  setupAiBoard();
  global.localStorage.setItem('durak_difficulty', 'hard');
  // Provide NO cards to draw. AI has NO other cards except a trump.
  // Attack is 6♠. AI has 11♥.
  // Because deck is empty, AI must defend to drop cards and avoid being Durak.
  state.players[1].hand = [new Card(11, 4)];
  _test_aiTurn(1);
  
  // Hard AI should defend because survival depends on it.
  assert.equal(state.phase, 'playing'); // Did not take
  assert.equal(state.field.defenses[0].value, 11);
});
