import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Card, canBeat, buildDeck, cardStrength } from '../games/durak/constants.js';
import { state, newGame, getPlayer, otherPlayerId, isTrump, setAiMode } from '../games/durak/state.js';
import { canPlayCard, playCard, takeCards, passRound, autoDrawBoth, checkGameOver } from '../games/durak/gameplay.js';

// ─── canBeat (pure rule) ─────────────────────────────────────────────────────

test('canBeat: higher same suit beats lower same suit', () => {
  // trump = 4 (hearts); attack = 7 of spades, defend = 9 of spades
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
  const ids = new Set(deck.map(c => c.id));
  assert.equal(ids.size, 36);
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
  // Lowest trump (6 of trump) must outrank highest non-trump (Ace of non-trump)
  assert.ok(cardStrength(new Card(6, 4), 4) > cardStrength(new Card(14, 1), 4));
});

test('cardStrength: within same group, higher value wins', () => {
  assert.ok(cardStrength(new Card(10, 1), 4) > cardStrength(new Card(7, 1), 4));
  assert.ok(cardStrength(new Card(13, 4), 4) > cardStrength(new Card(7, 4), 4));
});

// ─── State + draw order ─────────────────────────────────────────────────────

function freshGame(aiMode = true) {
  state.aiMode = aiMode;
  setAiMode(aiMode);
  newGame();
}

test('newGame: trump suit set from bottom of deck', () => {
  freshGame();
  assert.equal(state.trumpSuit, parseInt(state.trumpCard.suit));
});

test('newGame: deck has 36 minus initial draws', () => {
  freshGame();
  // newGame builds the deck but does not auto-draw — that's gameplay's job
  assert.equal(state.deck.length, 36);
  assert.equal(getPlayer('top').hand.length, 0);
  assert.equal(getPlayer('bottom').hand.length, 0);
});

test('newGame + autoDrawBoth = both players holding 6 cards (start-game regression)', () => {
  freshGame();
  autoDrawBoth();
  assert.equal(getPlayer('top').hand.length, 6);
  assert.equal(getPlayer('bottom').hand.length, 6);
  assert.equal(state.deck.length, 24);
  assert.equal(state.phase, 'playing');
});

test('autoDrawBoth: attacker draws first, both reach six when deck allows', () => {
  freshGame();
  state.attacker = 'bottom';
  autoDrawBoth();
  assert.equal(getPlayer('bottom').hand.length, 6);
  assert.equal(getPlayer('top').hand.length, 6);
  assert.equal(state.deck.length, 24);
});

test('autoDrawBoth: when deck runs short attacker still gets cards first', () => {
  freshGame();
  // Drain deck to 8 cards
  state.deck.length = 8;
  state.attacker = 'top';
  autoDrawBoth();
  assert.equal(getPlayer('top').hand.length, 6);
  assert.equal(getPlayer('bottom').hand.length, 2);
  assert.equal(state.deck.length, 0);
});

// ─── canPlayCard / priority enforcement ─────────────────────────────────────

test('canPlayCard: opening attacker can play any card', () => {
  freshGame();
  autoDrawBoth();
  state.priority = 'bottom';
  state.attacker = 'bottom';
  // Empty board, bottom is attacker — first card in hand should be playable
  const card = getPlayer('bottom').hand[0];
  assert.equal(canPlayCard(card, 'bottom'), true);
});

test('canPlayCard: throw-on requires matching rank already on field', () => {
  freshGame();
  // Set up explicit hands and field
  state.attacker = 'bottom';
  state.priority = 'bottom';
  getPlayer('bottom').board = [new Card(7, 1)];
  getPlayer('top').board    = [new Card(9, 1)];
  getPlayer('bottom').hand  = [new Card(7, 2), new Card(10, 3)];
  // 7 of clubs matches the 7 already on field — playable
  assert.equal(canPlayCard(new Card(7, 2), 'bottom'), true);
  // 10 of diamonds has no matching rank — not playable
  assert.equal(canPlayCard(new Card(10, 3), 'bottom'), false);
});

test('canPlayCard: defender must beat the last unbeaten attack', () => {
  freshGame();
  state.trumpSuit = 4;
  state.attacker = 'top';
  state.priority = 'bottom';
  getPlayer('top').board = [new Card(7, 1)]; // 7 of spades
  getPlayer('bottom').board = [];
  // 9 of spades (same suit, higher) can defend
  assert.equal(canPlayCard(new Card(9, 1), 'bottom'), true);
  // 6 of trump (lower trump beats non-trump) can defend
  assert.equal(canPlayCard(new Card(6, 4), 'bottom'), true);
  // 6 of clubs (different non-trump) cannot
  assert.equal(canPlayCard(new Card(6, 2), 'bottom'), false);
});

test('canPlayCard: returns false when not your turn', () => {
  freshGame();
  state.priority = 'bottom';
  getPlayer('top').hand = [new Card(7, 1)];
  assert.equal(canPlayCard(new Card(7, 1), 'top'), false);
});

// ─── playCard mutation ──────────────────────────────────────────────────────

test('playCard: moves card from hand to board and flips priority', () => {
  freshGame();
  state.attacker = 'bottom';
  state.priority = 'bottom';
  const card = new Card(8, 2);
  getPlayer('bottom').hand = [card];
  getPlayer('top').hand = [new Card(9, 2)];
  const ok = playCard(card.id, 'bottom');
  assert.equal(ok, true);
  assert.equal(getPlayer('bottom').hand.length, 0);
  assert.equal(getPlayer('bottom').board.length, 1);
  assert.equal(state.priority, 'top');
});

test('playCard: rejects illegal play and leaves state unchanged', () => {
  freshGame();
  state.attacker = 'top';
  state.priority = 'bottom';
  state.trumpSuit = 4;
  getPlayer('top').board = [new Card(10, 1)];
  const lowSameSuit = new Card(7, 1);
  getPlayer('bottom').hand = [lowSameSuit];
  const ok = playCard(lowSameSuit.id, 'bottom');
  assert.equal(ok, false);
  assert.equal(getPlayer('bottom').hand.length, 1);
  assert.equal(state.priority, 'bottom');
});

// ─── takeCards ───────────────────────────────────────────────────────────────

test('takeCards: defender absorbs all field cards; attacker re-draws to six', () => {
  freshGame();
  state.attacker = 'top';
  state.priority = 'bottom';
  getPlayer('top').board = [new Card(10, 1), new Card(11, 2)];
  getPlayer('bottom').board = [];
  getPlayer('bottom').hand = [];
  getPlayer('top').hand = [];
  const ok = takeCards('bottom');
  assert.equal(ok, true);
  assert.equal(getPlayer('bottom').hand.length, 2);
  assert.equal(getPlayer('top').board.length, 0);
  assert.equal(state.priority, 'top');
  assert.equal(state.attacker, 'top'); // attacker keeps role
  assert.equal(getPlayer('top').hand.length, 6); // drew back up
});

// ─── passRound ───────────────────────────────────────────────────────────────

test('passRound: clears field to discard and swaps attacker', () => {
  freshGame();
  state.attacker = 'bottom';
  state.priority = 'bottom';
  getPlayer('bottom').board = [new Card(7, 1)];
  getPlayer('top').board    = [new Card(9, 1)];
  const ok = passRound('bottom');
  assert.equal(ok, true);
  assert.equal(getPlayer('bottom').board.length, 0);
  assert.equal(getPlayer('top').board.length, 0);
  assert.equal(state.discard.length, 2);
  assert.equal(state.attacker, 'top');
  assert.equal(state.priority, 'top');
});

test('passRound: rejected when bout is not fully defended', () => {
  freshGame();
  state.attacker = 'bottom';
  state.priority = 'bottom';
  getPlayer('bottom').board = [new Card(7, 1), new Card(8, 1)];
  getPlayer('top').board    = [new Card(9, 1)]; // only 1 defended of 2
  const ok = passRound('bottom');
  assert.equal(ok, false);
  assert.equal(state.attacker, 'bottom');
});

// ─── checkGameOver ──────────────────────────────────────────────────────────

test('checkGameOver: false when deck still has cards', () => {
  freshGame();
  getPlayer('top').hand = [];
  assert.equal(checkGameOver(), false);
});

test('checkGameOver: bottom (human) wins by emptying hand once deck is gone', () => {
  freshGame();
  state.deck.length = 0;
  getPlayer('top').hand = [new Card(7, 1)];
  getPlayer('bottom').hand = [];
  assert.equal(checkGameOver(), true);
  assert.equal(state.phase, 'gameover');
  assert.match(state.winnerText, /win/i);
});

// ─── otherPlayerId / isTrump ────────────────────────────────────────────────

test('otherPlayerId: flips top/bottom', () => {
  assert.equal(otherPlayerId('top'), 'bottom');
  assert.equal(otherPlayerId('bottom'), 'top');
});

test('isTrump: matches state.trumpSuit', () => {
  freshGame();
  state.trumpSuit = 3;
  assert.equal(isTrump(3), true);
  assert.equal(isTrump('3'), true);
  assert.equal(isTrump(1), false);
});
