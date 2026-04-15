import { state } from './state.js';
import { STATES, SUITS } from './constants.js';
import { initGrid, render, DOM } from './ui.js';
import { spawnRandomBaseCard, slideGrid, isGameOver } from './gridLogic.js';
import { canBeat, canTransfer, getExposedRanks } from './combatLogic.js';

let isPaused = false;
let startX = 0;
let startY = 0;

let draggedCard = null;
let dragStartX = 0;
let dragStartY = 0;
let dragOffsetX = 0;
let dragOffsetY = 0;

function triggerShake() {
    DOM.gameContainer.classList.remove('shake');
    void DOM.gameContainer.offsetWidth; // trigger reflow
    DOM.gameContainer.classList.add('shake');
    setTimeout(() => DOM.gameContainer.classList.remove('shake'), 300);
}

function startGame() {
    if (!window.KamekoTokens || !window.KamekoTokens.spend()) {
        if (window.KamekoTokens) window.KamekoTokens.toast();
        return;
    }
    
    localStorage.setItem('lastPlayed_durakAlchemist', Date.now());
    
    state.gameState = STATES.FORGE;
    state.score = 0;
    state.energy = 15;
    state.trumpSuit = SUITS[Math.floor(Math.random() * SUITS.length)];
    state.enemyHP = 100;
    state.playerHP = 100;
    state.bout = [];
    state.isPlayerAttacking = true;
    
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            state.grid[r][c] = null;
        }
    }
    
    spawnRandomBaseCard();
    spawnRandomBaseCard();
    
    render();
}

function handleSwipe(dx, dy) {
    if (state.gameState !== STATES.FORGE || isPaused) return;
    
    let direction = null;
    if (Math.abs(dx) > Math.abs(dy)) {
        if (Math.abs(dx) > 30) direction = dx > 0 ? 'right' : 'left';
    } else {
        if (Math.abs(dy) > 30) direction = dy > 0 ? 'down' : 'up';
    }
    
    if (direction) {
        const moved = slideGrid(direction);
        if (moved) {
            state.energy--;
            spawnRandomBaseCard();
            
            if (isGameOver()) {
                handleGameOver();
            } else if (state.energy <= 0) {
                enterCombatPhase();
            }
            render();
        }
    }
}

function enterCombatPhase() {
    state.gameState = STATES.COMBAT;
    state.bout = [];
    state.isPlayerAttacking = true;
}

function handleGameOver() {
    state.gameState = STATES.GAMEOVER;
    const currentHighScore = parseInt(localStorage.getItem('alchemistHighScore') || '0', 10);
    if (state.score > currentHighScore) {
        localStorage.setItem('alchemistHighScore', state.score.toString());
    }
}

function endCombatTurn() {
    if (state.isPlayerAttacking) {
        const damage = state.bout.reduce((sum, pair) => sum + (pair.attack ? pair.attack.rank : 0), 0);
        state.enemyHP -= damage;
        
        if (damage > 0) triggerShake();
        
        if (state.enemyHP <= 0) {
            state.score += 1000;
            state.enemyHP = 100 + Math.floor(state.score / 500) * 20; // Enemy gets stronger
            state.energy = 15; // Refill energy completely on win
            
            // Go back to forge since we defeated them
            state.bout = [];
            state.gameState = STATES.FORGE;
            state.isPlayerAttacking = true;
            render();
            return;
        }
        
        state.bout = [];
        
        state.isPlayerAttacking = false;
        aiAttack();
    } else {
        const junkCards = state.bout.map(p => p.attack).filter(Boolean);
        state.bout = [];
        
        if (junkCards.length > 0) triggerShake();
        
        let emptyCells = [];
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (!state.grid[r][c]) emptyCells.push({r, c});
            }
        }
        
        emptyCells.sort(() => Math.random() - 0.5);
        
        junkCards.forEach((card, idx) => {
            if (idx < emptyCells.length) {
                const {r, c} = emptyCells[idx];
                state.grid[r][c] = card;
                card.merged = true;
            }
        });
        
        if (isGameOver()) {
            handleGameOver();
        } else {
            state.gameState = STATES.FORGE;
            state.energy = 15;
            state.isPlayerAttacking = true;
        }
    }
    render();
}

function aiAttack() {
    const rank = Math.floor(Math.random() * 4) + 6;
    const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
    
    state.bout.push({
        attack: { id: Date.now(), rank, suit },
        defense: null
    });
    
    triggerShake();
    render();
}

function getCardFromGridElement(el) {
    const id = parseInt(el.dataset.id, 10);
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            if (state.grid[r][c] && state.grid[r][c].id === id) {
                return { card: state.grid[r][c], r, c };
            }
        }
    }
    return null;
}

function handleCardPlay(cardInfo) {
    const { card, r, c } = cardInfo;
    
    if (state.isPlayerAttacking) {
        if (state.bout.length === 0) {
            state.grid[r][c] = null;
            state.bout.push({ attack: card, defense: null });
            simulateAIDefense(card);
        } else {
            const exposed = getExposedRanks(state.bout);
            if (exposed.includes(card.rank)) {
                state.grid[r][c] = null;
                state.bout.push({ attack: card, defense: null });
                simulateAIDefense(card);
            }
        }
        triggerShake();
    } else {
        const undefendedPair = state.bout.find(p => !p.defense);
        if (undefendedPair) {
            if (canBeat(undefendedPair.attack, card, state.trumpSuit)) {
                state.grid[r][c] = null;
                undefendedPair.defense = card;
                simulateAIChaining();
            } else {
                const allAttacks = state.bout.map(p => p.attack);
                if (canTransfer(allAttacks, card)) {
                    state.grid[r][c] = null;
                    state.bout.push({ attack: card, defense: null });
                    state.isPlayerAttacking = true;
                    simulateAIDefense(card);
                }
            }
            triggerShake();
        }
    }
    render();
}

function simulateAIDefense(attackCard) {
    setTimeout(() => {
        if (state.gameState !== STATES.COMBAT) return;
        
        const chance = 0.7 - (attackCard.rank - 6) * 0.05; 
        if (Math.random() < chance) {
            const defRank = Math.min(14, attackCard.rank + Math.floor(Math.random() * 3) + 1);
            const defSuit = attackCard.suit;
            
            const pair = state.bout.find(p => p.attack.id === attackCard.id);
            if (pair) {
                pair.defense = { id: Date.now() + 1, rank: defRank, suit: defSuit };
                triggerShake();
                render();
            }
        }
    }, 600);
}

function simulateAIChaining() {
    setTimeout(() => {
        if (state.gameState !== STATES.COMBAT || state.isPlayerAttacking) return;
        
        const exposed = getExposedRanks(state.bout);
        if (exposed.length > 0 && Math.random() < 0.4) {
            const chainRank = exposed[Math.floor(Math.random() * exposed.length)];
            const chainSuit = SUITS[Math.floor(Math.random() * SUITS.length)];
            
            state.bout.push({
                attack: { id: Date.now() + 2, rank: chainRank, suit: chainSuit },
                defense: null
            });
            triggerShake();
            render();
        } else {
            state.bout = [];
            state.gameState = STATES.FORGE;
            state.energy = 15;
            state.isPlayerAttacking = true;
            render();
        }
    }, 600);
}

// ── Events ──

window.addEventListener('settingsOpened', () => { isPaused = true; });
window.addEventListener('settingsClosed', () => { isPaused = false; });

document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', startGame);
DOM.endTurnBtn.addEventListener('click', endCombatTurn);

window.addEventListener('keydown', (e) => {
    if (state.gameState !== STATES.FORGE || isPaused) return;
    
    let direction = null;
    if (e.key === 'ArrowUp' || e.key === 'w') direction = 'up';
    if (e.key === 'ArrowDown' || e.key === 's') direction = 'down';
    if (e.key === 'ArrowLeft' || e.key === 'a') direction = 'left';
    if (e.key === 'ArrowRight' || e.key === 'd') direction = 'right';
    
    if (direction) {
        const moved = slideGrid(direction);
        if (moved) {
            state.energy--;
            spawnRandomBaseCard();
            
            if (isGameOver()) {
                handleGameOver();
            } else if (state.energy <= 0) {
                enterCombatPhase();
            }
            render();
        }
    }
});

document.addEventListener('pointerdown', (e) => {
    if (isPaused) return;
    
    if (state.gameState === STATES.FORGE) {
        if (e.target.closest('#grid')) {
            startX = e.clientX;
            startY = e.clientY;
        }
    } else if (state.gameState === STATES.COMBAT) {
        const cardEl = e.target.closest('.card.combative');
        if (cardEl && e.target.closest('#grid')) {
            draggedCard = cardEl;
            const rect = cardEl.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;
            
            cardEl.classList.add('dragging');
            cardEl.style.position = 'fixed';
            cardEl.style.transform = 'none';
            cardEl.style.left = `${e.clientX - dragOffsetX}px`;
            cardEl.style.top = `${e.clientY - dragOffsetY}px`;
            
            e.preventDefault();
        }
    }
});

document.addEventListener('pointermove', (e) => {
    if (draggedCard) {
        draggedCard.style.left = `${e.clientX - dragOffsetX}px`;
        draggedCard.style.top = `${e.clientY - dragOffsetY}px`;
        e.preventDefault();
    }
});

document.addEventListener('pointerup', (e) => {
    if (isPaused) return;

    if (draggedCard) {
        const boutRect = DOM.boutArea.getBoundingClientRect();
        if (
            e.clientX >= boutRect.left && e.clientX <= boutRect.right &&
            e.clientY >= boutRect.top && e.clientY <= boutRect.bottom
        ) {
            const cardInfo = getCardFromGridElement(draggedCard);
            if (cardInfo) {
                handleCardPlay(cardInfo);
            }
        }
        
        draggedCard.classList.remove('dragging');
        draggedCard.style.position = 'absolute';
        draggedCard = null;
        
        render();
        
    } else if (state.gameState === STATES.FORGE && startX > 0 && startY > 0) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        handleSwipe(dx, dy);
        startX = 0; startY = 0;
    }
});

document.addEventListener('pointercancel', (e) => {
    if (draggedCard) {
        draggedCard.classList.remove('dragging');
        draggedCard.style.position = 'absolute';
        draggedCard = null;
        render();
    } else if (startX > 0 && startY > 0) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        handleSwipe(dx, dy);
        startX = 0; startY = 0;
    }
});

initGrid();
render();