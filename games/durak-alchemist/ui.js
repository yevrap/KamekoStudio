import { state } from './state.js';
import { getRankLabel, SUIT_EMOJIS, STATES } from './constants.js';
import { getExposedRanks, canBeat, canTransfer } from './combatLogic.js';

export const DOM = {
    gameContainer: document.getElementById('game-container'),
    grid: document.getElementById('grid'),
    scoreDisplay: document.getElementById('score-display'),
    energyDisplay: document.getElementById('energy-display'),
    trumpDisplay: document.getElementById('trump-display'),
    startScreen: document.getElementById('start-screen'),
    gameOverScreen: document.getElementById('game-over-screen'),
    cardTemplate: document.getElementById('card-template'),
    combatArea: document.getElementById('combat-area'),
    boutArea: document.getElementById('bout-area'),
    enemyHP: document.getElementById('enemy-hp'),
    endTurnBtn: document.getElementById('end-turn-btn'),
    highScoreDisplay: document.getElementById('high-score-display'),
};

const cellW = 65;
const cellGap = 8;
const cellTotal = cellW + cellGap;

export function initGrid() {
    DOM.grid.innerHTML = '';
    // Create 16 static grid cells (backgrounds)
    for (let i = 0; i < 16; i++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        const r = Math.floor(i / 4);
        const c = i % 4;
        cell.style.top = `${8 + r * cellTotal}px`;
        cell.style.left = `${8 + c * cellTotal}px`;
        DOM.grid.appendChild(cell);
    }
}

export function render() {
    DOM.scoreDisplay.textContent = `Score: ${state.score}`;
    DOM.energyDisplay.textContent = `Energy: ${state.energy}`;
    DOM.trumpDisplay.innerHTML = `Trump: <span class="suit-${state.trumpSuit}">${SUIT_EMOJIS[state.trumpSuit]}</span>`;
    DOM.enemyHP.textContent = `Enemy HP: ${state.enemyHP}`;
    
    if (state.gameState === STATES.START) {
        DOM.startScreen.style.display = 'flex';
        DOM.gameOverScreen.style.display = 'none';
        DOM.combatArea.style.display = 'none';
        DOM.endTurnBtn.style.display = 'none';
        const highScore = localStorage.getItem('alchemistHighScore') || '0';
        DOM.highScoreDisplay.textContent = `High Score: ${highScore}`;
    } else if (state.gameState === STATES.GAMEOVER) {
        DOM.gameOverScreen.style.display = 'flex';
        DOM.combatArea.style.display = 'none';
        DOM.endTurnBtn.style.display = 'none';
    } else if (state.gameState === STATES.COMBAT) {
        DOM.startScreen.style.display = 'none';
        DOM.gameOverScreen.style.display = 'none';
        DOM.combatArea.style.display = 'flex';
        DOM.endTurnBtn.style.display = 'inline-block';
        DOM.endTurnBtn.textContent = state.isPlayerAttacking ? 'End Attack' : 'Take';
        if (!state.isPlayerAttacking) {
            DOM.endTurnBtn.classList.add('btn-danger');
        } else {
            DOM.endTurnBtn.classList.remove('btn-danger');
        }
    } else { // FORGE
        DOM.startScreen.style.display = 'none';
        DOM.gameOverScreen.style.display = 'none';
        DOM.combatArea.style.display = 'none';
        DOM.endTurnBtn.style.display = 'none';
    }

    renderGridCards();
    if (state.gameState === STATES.COMBAT) {
        renderBoutArea();
    }
}

function renderGridCards() {
    const currentCardIds = new Set();
    
    // Pre-calculate valid moves if in combat
    let validChains = [];
    let undefendedPair = null;
    let allAttacks = [];
    if (state.gameState === STATES.COMBAT) {
        if (state.isPlayerAttacking) {
            if (state.bout.length > 0) {
                validChains = getExposedRanks(state.bout);
            } else {
                // all ranks are valid for first attack
                validChains = [6,7,8,9,10,11,12,13,14];
            }
        } else {
            undefendedPair = state.bout.find(p => !p.defense);
            allAttacks = state.bout.map(p => p.attack).filter(Boolean);
        }
    }

    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
            const card = state.grid[r][c];
            if (card) {
                currentCardIds.add(card.id);
                updateOrCreateCard(card, r, c);
            }
        }
    }

    const existingCards = DOM.grid.querySelectorAll('.card');
    existingCards.forEach(el => {
        const id = parseInt(el.dataset.id, 10);
        if (!currentCardIds.has(id)) {
            el.remove();
        } else {
            if (state.gameState === STATES.COMBAT) {
                el.classList.add('combative');
                
                // Add chain highlighting
                const cardActualRank = parseInt(el.dataset.actualRank, 10);
                const cardSuit = el.dataset.suit;
                const cardObj = { rank: cardActualRank, suit: cardSuit };
                
                let isValid = false;
                if (state.isPlayerAttacking) {
                    if (validChains.includes(cardActualRank)) isValid = true;
                } else if (undefendedPair) {
                    if (canBeat(undefendedPair.attack, cardObj, state.trumpSuit) || canTransfer(allAttacks, cardObj)) {
                        isValid = true;
                    }
                }
                
                if (isValid) {
                    el.classList.add('valid-chain');
                } else {
                    el.classList.remove('valid-chain');
                }

            } else {
                el.classList.remove('combative');
                el.classList.remove('valid-chain');
            }
        }
    });
}

function createCardDOM(card) {
    const clone = DOM.cardTemplate.content.cloneNode(true);
    const el = clone.querySelector('.card');
    el.dataset.id = card.id;
    
    const label = getRankLabel(card.rank);
    const suitCls = `suit-${card.suit}`;
    const suitEmoji = SUIT_EMOJIS[card.suit];

    el.dataset.rank = label;
    el.dataset.actualRank = card.rank;
    el.dataset.suit = card.suit;
    
    el.className = `card ${suitCls}`;
    if (card.suit === state.trumpSuit) el.classList.add('trump-card');
    
    el.querySelector('.card-tl').textContent = label;
    el.querySelector('.card-center').textContent = suitEmoji;
    el.querySelector('.card-br').textContent = label;
    
    return el;
}

function updateOrCreateCard(card, r, c) {
    let el = DOM.grid.querySelector(`.card[data-id="${card.id}"]`);
    if (!el) {
        el = createCardDOM(card);
        DOM.grid.appendChild(el);
    } else {
        const label = getRankLabel(card.rank);
        if (el.dataset.actualRank != card.rank || el.dataset.suit !== card.suit) {
            const suitCls = `suit-${card.suit}`;
            const suitEmoji = SUIT_EMOJIS[card.suit];

            el.dataset.rank = label;
            el.dataset.actualRank = card.rank;
            el.dataset.suit = card.suit;
            
            el.className = `card ${suitCls}`;
            if (card.suit === state.trumpSuit) el.classList.add('trump-card');
            
            el.querySelector('.card-tl').textContent = label;
            el.querySelector('.card-center').textContent = suitEmoji;
            el.querySelector('.card-br').textContent = label;
        }
    }

    const top = 8 + r * cellTotal;
    const left = 8 + c * cellTotal;
    el.style.transform = `translate(${left}px, ${top}px)`;

    if (card.merged) {
        el.classList.add('merged');
        card.merged = false;
        setTimeout(() => { el.classList.remove('merged'); }, 200);
    }
}

function renderBoutArea() {
    DOM.boutArea.innerHTML = '';
    
    // state.bout is an array of { attack: card, defense: card }
    state.bout.forEach((pair, index) => {
        const pairDiv = document.createElement('div');
        pairDiv.className = 'bout-pair';
        
        if (pair.attack) {
            const atkEl = createCardDOM(pair.attack);
            atkEl.style.position = 'relative';
            atkEl.style.transform = 'none'; // Clear grid transform
            pairDiv.appendChild(atkEl);
        }
        
        if (pair.defense) {
            const defEl = createCardDOM(pair.defense);
            defEl.style.position = 'absolute';
            defEl.style.top = '15px';
            defEl.style.left = '15px';
            defEl.style.transform = 'none';
            defEl.classList.add('defense-card');
            pairDiv.appendChild(defEl);
        }
        
        DOM.boutArea.appendChild(pairDiv);
    });
}