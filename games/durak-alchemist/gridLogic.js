import { state } from './state.js';
import { SUITS } from './constants.js';

let nextCardId = 1;

export function spawnCard(rank, suit, r, c) {
    const card = { id: nextCardId++, rank, suit };
    state.grid[r][c] = card;
    return card;
}

export function getEmptyCells() {
    const empty = [];
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            if (!state.grid[r][c]) empty.push({r, c});
        }
    }
    return empty;
}

export function spawnRandomBaseCard() {
    const empty = getEmptyCells();
    if (empty.length === 0) return null;
    const {r, c} = empty[Math.floor(Math.random() * empty.length)];
    const rank = Math.random() < 0.8 ? 6 : 7;
    const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
    return spawnCard(rank, suit, r, c);
}

// Swipe logic (2048 style)
export function slideGrid(direction) {
    let moved = false;
    let mergedThisTurn = Array(4).fill(null).map(() => Array(4).fill(false));
    const newGrid = Array(4).fill(null).map(() => Array(4).fill(null));

    // Vector for direction
    let dr = 0, dc = 0;
    if (direction === 'up') dr = -1;
    else if (direction === 'down') dr = 1;
    else if (direction === 'left') dc = -1;
    else if (direction === 'right') dc = 1;

    // Traversal order
    const rStart = dr === 1 ? 3 : 0;
    const rEnd = dr === 1 ? -1 : 4;
    const rStep = dr === 1 ? -1 : 1;
    
    const cStart = dc === 1 ? 3 : 0;
    const cEnd = dc === 1 ? -1 : 4;
    const cStep = dc === 1 ? -1 : 1;

    for (let r = rStart; r !== rEnd; r += rStep) {
        for (let c = cStart; c !== cEnd; c += cStep) {
            if (!state.grid[r][c]) continue;
            
            const card = state.grid[r][c];
            let currR = r;
            let currC = c;
            let nextR = currR + dr;
            let nextC = currC + dc;

            while (nextR >= 0 && nextR < 4 && nextC >= 0 && nextC < 4 && !newGrid[nextR][nextC]) {
                currR = nextR;
                currC = nextC;
                nextR += dr;
                nextC += dc;
            }

            // Can we merge?
            if (nextR >= 0 && nextR < 4 && nextC >= 0 && nextC < 4 && newGrid[nextR][nextC]) {
                const targetCard = newGrid[nextR][nextC];
                if (targetCard.rank === card.rank && targetCard.suit === card.suit && !mergedThisTurn[nextR][nextC] && targetCard.rank < 14) {
                    // Merge!
                    targetCard.rank += 1;
                    targetCard.merged = true; // flag for animation
                    mergedThisTurn[nextR][nextC] = true;
                    moved = true;
                    state.score += (targetCard.rank * 10);
                    continue;
                }
            }

            // Move
            newGrid[currR][currC] = card;
            if (currR !== r || currC !== c) {
                moved = true;
            }
        }
    }

    state.grid = newGrid;
    return moved;
}

export function isGameOver() {
    if (getEmptyCells().length > 0) return false;
    
    // Check for possible merges
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            const card = state.grid[r][c];
            if (r < 3 && state.grid[r+1][c] && state.grid[r+1][c].rank === card.rank && state.grid[r+1][c].suit === card.suit && card.rank < 14) return false;
            if (c < 3 && state.grid[r][c+1] && state.grid[r][c+1].rank === card.rank && state.grid[r][c+1].suit === card.suit && card.rank < 14) return false;
        }
    }
    return true;
}