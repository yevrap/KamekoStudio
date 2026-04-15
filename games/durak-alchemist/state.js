import { STATES } from './constants.js';

export const state = {
    gameState: STATES.START,
    score: 0,
    energy: 10,
    trumpSuit: 'S',
    
    // 4x4 grid. Each cell is either null or { id, rank, suit }
    // id is unique per card instance for DOM tracking
    grid: Array(4).fill(null).map(() => Array(4).fill(null)),
    
    enemyHP: 100,
    playerHP: 100, // Optional but good to have
    bout: [], // Array of { attack: card, defense: card | null }
    playerTurn: true, // true if player is attacking or defending this turn, wait, is it player's turn to attack or AI's turn?
    isPlayerAttacking: true, // If player is the attacker
};