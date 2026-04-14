// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS — static data only, no imports
// ═══════════════════════════════════════════════════════════════════════════

export var SUIT_EMOJI = { 1: '♠', 2: '♣', 3: '♦', 4: '❤' };
export var SUIT_NAME  = { 1: 'spades', 2: 'clubs', 3: 'diamonds', 4: 'hearts' };
export var FACE_MAP   = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
export var ENHANCE_COLORS = {
  burning: '#ff8c32', armored: '#6496ff', vampiric: '#b850b8', lucky: '#32c864'
};

export function suitEmoji(id) { return SUIT_EMOJI[id] || ''; }
export function suitName(id)  { return SUIT_NAME[id] || ''; }
export function displayValue(v) { return FACE_MAP[v] || String(v); }

// ── Seeded PRNG ────────────────────────────────────────────────────────────
export function mulberry32(seed) {
  var h = seed | 0;
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

export function seedFromString(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

export function generateSeed() {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var s = '';
  for (var i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export function shuffle(arr, rng) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(rng() * (i + 1));
    var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  return arr;
}

// ── Card ───────────────────────────────────────────────────────────────────
var cardIdCounter = 0;

export function resetCardId() { cardIdCounter = 0; }

export function Card(value, suit, enhancement) {
  this.value = value;
  this.suit = suit;
  this.enhancement = enhancement || null;
  this.uid = 'c' + (cardIdCounter++);
}

// ── Relics ─────────────────────────────────────────────────────────────────
export var RELIC_DEFS = [
  { id: 'iron-shield',    icon: '🛡️', name: 'Iron Shield',    desc: 'Reduce all damage taken by 1 (min 1)' },
  { id: 'sharp-edge',     icon: '⚔️',  name: 'Sharp Edge',      desc: 'All attack cards deal +2 damage' },
  { id: 'crown-of-trumps',icon: '👑',  name: 'Crown of Trumps', desc: 'Trump attacks deal +5 instead of +3' },
  { id: 'wild-card',      icon: '🃏',  name: 'Wild Card',       desc: 'Once per floor: any card defends any attack' },
  { id: 'diamond-skin',   icon: '💎',  name: 'Diamond Skin',    desc: 'Defending with ♦ heals 1 HP' },
  { id: 'fire-blade',     icon: '🔥',  name: 'Fire Blade',      desc: '6s and 7s deal double attack damage' },
  { id: 'magnet',         icon: '🧲',  name: 'Magnet',          desc: 'Draw 7 cards instead of 6' },
  { id: 'skull-ring',     icon: '💀',  name: 'Skull Ring',      desc: '+1 attack damage per hit taken this floor' },
  { id: 'gold-tooth',     icon: '🪙',  name: 'Gold Tooth',      desc: '+5 bonus gold after each floor' },
  { id: 'frost-armor',    icon: '❄️',  name: 'Frost Armor',     desc: 'First hit each floor deals 0 damage' },
  { id: 'precision',      icon: '🎯',  name: 'Precision',       desc: 'Face cards (J/Q/K/A) deal +3 attack damage' },
  { id: 'chaos-orb',      icon: '🌀',  name: 'Chaos Orb',       desc: 'Enemy attack order is randomized' },
  { id: 'blood-pact',     icon: '🩸',  name: 'Blood Pact',      desc: '-2 HP per floor, but +4 attack damage' },
  { id: 'oracle',         icon: '🔮',  name: 'Oracle',          desc: 'See enemy cards before defend phase' },
  { id: 'recycle',        icon: '♻️',  name: 'Recycle',         desc: 'Cards used to defend return to your deck' }
];

// ── Boss Mutations ─────────────────────────────────────────────────────────
export var MUTATION_DEFS = [
  { id: 'no-trumps',   name: 'No Trumps',   desc: 'Trump suit disabled. Same-suit-higher only.' },
  { id: 'armored',     name: 'Armored',      desc: 'Boss takes half damage from attacks.' },
  { id: 'relentless',  name: 'Relentless',   desc: 'Boss attacks with 2 cards at once.' },
  { id: 'mirror',      name: 'Mirror',       desc: 'Next attack matches suit you last defended with.' },
  { id: 'regenerate',  name: 'Regenerate',   desc: 'Boss heals 5 HP after your attack phase.' },
  { id: 'trump-shift', name: 'Trump Shift',  desc: 'Trump suit changes each defend/attack cycle.' }
];

// ── Enemy Names ────────────────────────────────────────────────────────────
export var ENEMY_NAMES = {
  1: ['Rat', 'Bandit', 'Thief', 'Stray Dog'],
  2: ['Knight', 'Archer', 'Spearman', 'Guard'],
  3: ['Sorcerer', 'Dark Knight', 'Assassin', 'Golem'],
  4: ['Dragon', 'Demon', 'Wraith', 'Lich']
};
export var BOSS_NAMES = ['The Gatekeeper', 'The Warden', 'The Hollow King', 'The Durak'];
