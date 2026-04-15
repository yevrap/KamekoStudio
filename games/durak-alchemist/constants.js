export const STATES = {
    START: 'START',
    FORGE: 'FORGE',
    COMBAT: 'COMBAT',
    GAMEOVER: 'GAMEOVER'
};

export const SUITS = ['S', 'C', 'H', 'D'];
export const SUIT_EMOJIS = {
    'S': '♠',
    'C': '♣',
    'H': '♥',
    'D': '♦'
};

export const RANKS = [6, 7, 8, 9, 10, 11, 12, 13, 14]; // 11=J, 12=Q, 13=K, 14=A

export function getRankLabel(rank) {
    if (rank <= 10) return rank.toString();
    if (rank === 11) return 'J';
    if (rank === 12) return 'Q';
    if (rank === 13) return 'K';
    if (rank === 14) return 'A';
    return '?';
}