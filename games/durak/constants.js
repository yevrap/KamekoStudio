// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS — static data, pure helpers, Card constructor, deck builder
// ═══════════════════════════════════════════════════════════════════════════

export var SUIT_EMOJI = { 1: '\u2660', 2: '\u2663', 3: '\u2666', 4: '\u2764' };
export var SUIT_NAME  = { 1: 'spades', 2: 'clubs', 3: 'diamonds', 4: 'hearts' };
export var FACE_MAP   = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };

export var SUIT_IDS = [1, 2, 3, 4];
export var RANK_MIN = 6;
export var RANK_MAX = 14;

export function suitEmoji(id) { return SUIT_EMOJI[id] || ''; }
export function suitName(id)  { return SUIT_NAME[id] || ''; }
export function displayValue(v) { return FACE_MAP[v] || String(v); }

export function Card(value, suit) {
  this.value = value;
  this.suit  = suit;
  this.id    = '' + value + suit;
}

export function shuffle(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
}

export function buildDeck() {
  var deck = [];
  for (var s = 0; s < SUIT_IDS.length; s++) {
    for (var v = RANK_MIN; v <= RANK_MAX; v++) {
      deck.push(new Card(v, SUIT_IDS[s]));
    }
  }
  shuffle(deck);
  return deck;
}

// Strength used by AI for ordering plays. Trumps always rank above non-trumps.
export function cardStrength(card, trumpSuit) {
  var val = parseInt(card.value);
  var suit = parseInt(card.suit);
  return suit === trumpSuit ? val + 100 : val;
}

// ── Pure rule helpers (no state dependency) ────────────────────────────────

// Can `def` beat `atk` given a trump suit?
export function canBeat(atk, def, trumpSuit) {
  var atkVal  = parseInt(atk.value);
  var atkSuit = parseInt(atk.suit);
  var defVal  = parseInt(def.value);
  var defSuit = parseInt(def.suit);
  if (defSuit === atkSuit && defVal > atkVal) return true;
  if (defSuit === trumpSuit && atkSuit !== trumpSuit) return true;
  if (defSuit === trumpSuit && atkSuit === trumpSuit && defVal > atkVal) return true;
  return false;
}
