// ─── Constants — static data only, no imports ─────────────────────────────────

export const SUITS = [
    { id: 0, emoji: '♠', colorClass: 'suit-black', name: 'Spades' },
    { id: 1, emoji: '♣', colorClass: 'suit-black', name: 'Clubs' },
    { id: 2, emoji: '♦', colorClass: 'suit-red',   name: 'Diamonds' },
    { id: 3, emoji: '♥', colorClass: 'suit-red',   name: 'Hearts' }
];

export const CARD_VALUES = [6, 7, 8, 9, 10, 11, 12, 13, 14];
export const DISPLAY_VALS = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };

export const TYPE_ICONS = {
    'start':  '⛺',
    'battle': '⚔️',
    'boss':   '💀',
    'shop':   '🪙',
    'event':  '❓'
};

export function getDisplayVal(val) {
    return DISPLAY_VALS[val] || val.toString();
}
