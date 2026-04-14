// ─── State — shared mutable game state ────────────────────────────────────────
// All modules import { state } and read/write state.x directly.

export const state = {
    phase: 'title', // title | map | battle | rewards | shop | event

    campaign: {
        deck: [],
        gold: 0,
        nodes: [],
        currentNodeId: 1,
        maxNodeReached: 1,
        extraDrawNextBattle: false
    },

    // Battle-specific (reset each battle)
    deck: [],
    hand: [],
    enemyDeck: [],
    enemyHand: [],
    grid: Array(4).fill(null).map(() => Array(5).fill(null)),
    trumpSuit: 2,
    selectedHandIndex: -1,
    turn: 'player',
    roundCount: 1
};
