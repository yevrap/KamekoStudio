// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS — card data, suit values, bid constants. DOM-free.
// ═══════════════════════════════════════════════════════════════════════════

export const SUITS = ['H', 'C', 'D', 'S'];
export const SUIT_CHAR = { H: '♥', D: '♦', C: '♣', S: '♠' };
export const SUIT_IS_RED = { H: true, D: true, C: false, S: false };
export const RANKS = ['9', 'J', 'Q', 'K', '10', 'A'];            // low → high
export const PTS = { '9': 0, J: 2, Q: 3, K: 4, '10': 10, A: 11 }; // 120 per deal
export const MARRIAGE = { H: 100, D: 80, C: 60, S: 40 };
export const TARGET = 1000;
export const OPEN_BID = 100;
export const RAISE = 10;

// ── Pure helpers (DOM-free) ──────────────────────────────────────────────

export const key = c => c.r + c.s;
export const rankIdx = c => RANKS.indexOf(c.r);

export function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

export function buildDeck() {
    const d = [];
    for (const s of SUITS) for (const r of RANKS) d.push({ s, r });
    return shuffle(d);
}

export function sortHand(hand) {
    hand.sort((a, b) => {
        if (a.s !== b.s) return SUITS.indexOf(a.s) - SUITS.indexOf(b.s);
        return rankIdx(b) - rankIdx(a);
    });
}

export function handCardPts(hand) { return hand.reduce((t, c) => t + PTS[c.r], 0); }

export function marriagesInHand(hand) {
    return SUITS.filter(s =>
        hand.some(c => c.s === s && c.r === 'K') &&
        hand.some(c => c.s === s && c.r === 'Q'));
}
