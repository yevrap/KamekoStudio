// --- State ---
const state = {
    phase: 'title', // title, map, battle, rewards, shop, event
    campaign: {
        deck: [],
        gold: 0,
        nodes: [],
        currentNodeId: 1,
        maxNodeReached: 1,
        extraDrawNextBattle: false
    },
    // Battle specific state
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

const SUITS = [
    { id: 0, emoji: '♠', colorClass: 'suit-black', name: 'Spades' },
    { id: 1, emoji: '♣', colorClass: 'suit-black', name: 'Clubs' },
    { id: 2, emoji: '♦', colorClass: 'suit-red', name: 'Diamonds' },
    { id: 3, emoji: '♥', colorClass: 'suit-red', name: 'Hearts' }
];

const CARD_VALUES = [6, 7, 8, 9, 10, 11, 12, 13, 14];
const DISPLAY_VALS = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };

// --- DOM Elements ---
const startBtn = document.getElementById('btn-start');
const startScreen = document.getElementById('start-screen');
const gameUi = document.getElementById('game-ui');
const gridContainer = document.getElementById('grid-container');
const handContainer = document.getElementById('hand-container');
const endTurnBtn = document.getElementById('btn-end-turn');
const statsInfo = document.getElementById('stats-info');
const deckCountEl = document.getElementById('deck-count');
const banner = document.getElementById('announcement-banner');
const gameOverScreen = document.getElementById('game-over-screen');
const gameOverTitle = document.getElementById('game-over-title');
const gameOverMsg = document.getElementById('game-over-msg');

// --- Initialization ---
startBtn.addEventListener('click', () => {
    if (!window.KamekoTokens || !window.KamekoTokens.spend()) {
        if (window.KamekoTokens) window.KamekoTokens.toast();
        return;
    }
    localStorage.setItem('lastPlayed_durakTactics', Date.now());
    startGame();
});

function startGame() {
    startScreen.style.display = 'none';
    
    // Init Campaign
    state.campaign.nodes = generateMap();
    state.campaign.gold = 0;
    state.campaign.currentNodeId = 1;
    state.campaign.maxNodeReached = 1;
    state.campaign.extraDrawNextBattle = false;
    
    // Starting persistent deck
    state.campaign.deck = [];
    [6, 8, 10].forEach(val => {
        for (let s = 0; s < 4; s++) {
            state.campaign.deck.push({ value: val, originalValue: val, suit: s, owner: 'player' });
        }
    });

    changePhase('map');
}

function changePhase(newPhase) {
    state.phase = newPhase;
    document.querySelectorAll('.screen-ui').forEach(el => el.style.display = 'none');
    gameUi.style.display = 'none';
    
    if (newPhase === 'map') {
        document.getElementById('map-ui').style.display = 'flex';
        renderMap();
    } else if (newPhase === 'battle') {
        gameUi.style.display = 'flex';
        startBattleParams();
    } else if (newPhase === 'rewards') {
        document.getElementById('rewards-ui').style.display = 'flex';
        setupRewards();
    } else if (newPhase === 'shop') {
        document.getElementById('shop-ui').style.display = 'flex';
        setupShop();
    } else if (newPhase === 'event') {
        document.getElementById('event-ui').style.display = 'flex';
        setupEvent();
    }
}

const TYPE_ICONS = {
    'start': '⛺',
    'battle': '⚔️',
    'boss': '💀',
    'shop': '🪙',
    'event': '❓'
};

function generateMap() {
    return [
        { id: 1, type: 'start', row: 0, col: 0, next: [2] },
        { id: 2, type: 'battle', row: 1, col: 0, next: [3] },
        { id: 3, type: 'battle', row: 2, col: 0, next: [4, 5] },
        { id: 4, type: 'shop', row: 3, col: -1, next: [6] },
        { id: 5, type: 'battle', row: 3, col: 1, next: [7] },
        { id: 6, type: 'battle', row: 4, col: -1, next: [8] },
        { id: 7, type: 'event', row: 4, col: 1, next: [8] },
        { id: 8, type: 'boss', row: 5, col: 0, next: [9, 10] },
        { id: 9, type: 'battle', row: 6, col: -1, next: [11] },
        { id: 10, type: 'battle', row: 6, col: 1, next: [12] },
        { id: 11, type: 'event', row: 7, col: -1, next: [13] },
        { id: 12, type: 'shop', row: 7, col: 1, next: [14] },
        { id: 13, type: 'battle', row: 8, col: -1, next: [15] },
        { id: 14, type: 'battle', row: 8, col: 1, next: [15] },
        { id: 15, type: 'boss', row: 9, col: 0, next: [] }
    ];
}

function renderMap() {
    document.getElementById('map-gold').textContent = state.campaign.gold;
    document.getElementById('map-deck-count').textContent = state.campaign.deck.length;
    
    const container = document.getElementById('map-container');
    container.innerHTML = '';
    
    const currentNode = state.campaign.nodes.find(n => n.id === state.campaign.currentNodeId);
    
    for (let r = 0; r <= 9; r++) {
        const rowNodes = state.campaign.nodes.filter(n => n.row === r);
        if (rowNodes.length === 0) continue;
        
        const rowDiv = document.createElement('div');
        rowDiv.className = 'map-row';
        
        rowNodes.forEach(node => {
            const nDiv = document.createElement('div');
            nDiv.className = 'map-node';
            nDiv.innerHTML = TYPE_ICONS[node.type];
            
            const isCompleted = node.id < state.campaign.currentNodeId && node.row < currentNode.row;
            const isSelectable = currentNode.next.includes(node.id) || (node.id === currentNode.id && node.type === 'start');
            
            if (isCompleted) nDiv.classList.add('completed');
            if (isSelectable) {
                nDiv.classList.add('selectable');
                nDiv.addEventListener('pointerdown', () => handleNodeClick(node));
            }
            
            rowDiv.appendChild(nDiv);
        });
        
        container.appendChild(rowDiv);
    }
}

function handleNodeClick(node) {
    if (state.campaign.currentNodeId !== node.id) {
        state.campaign.currentNodeId = node.id;
    }
    if (node.row > state.campaign.maxNodeReached) state.campaign.maxNodeReached = node.row;
    
    setTimeout(() => {
        if (node.type === 'battle' || node.type === 'start' || node.type === 'boss') changePhase('battle');
        else if (node.type === 'shop') changePhase('shop');
        else if (node.type === 'event') changePhase('event');
    }, 200);
}

function startBattleParams() {
    state.grid = Array(4).fill(null).map(() => Array(5).fill(null));
    state.trumpSuit = Math.floor(Math.random() * 4);
    state.roundCount = 1;
    state.turn = 'player';
    state.selectedHandIndex = -1;
    
    state.deck = JSON.parse(JSON.stringify(state.campaign.deck));
    state.deck.forEach(c => c.value = c.originalValue); // Full heal!
    
    let minE = 6, maxE = 10;
    const act = Math.floor(state.campaign.maxNodeReached / 4);
    if (act === 1) maxE = 12;
    else if (act >= 2) maxE = 14;
    
    state.enemyDeck = [];
    const enemyDeckSize = 8 + (act * 2);
    for(let i = 0; i < enemyDeckSize; i++) {
        const suits = Math.floor(Math.random() * 4);
        const val = Math.floor(Math.random() * (maxE - minE + 1)) + minE;
        state.enemyDeck.push({ value: val, originalValue: val, suit: suits, owner: 'enemy' });
    }
    
    const shuffle = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    };
    shuffle(state.deck);
    shuffle(state.enemyDeck);
    
    state.hand = [];
    state.enemyHand = [];
    
    if (state.campaign.extraDrawNextBattle) {
        state.campaign.extraDrawNextBattle = false;
        if (state.deck.length > 0) state.hand.push(state.deck.pop());
    }
    
    drawHand();
    renderBoard();
    updateUI();
}

function drawHand() {
    while (state.hand.length < 5 && state.deck.length > 0) {
        state.hand.push(state.deck.pop());
    }
    while (state.enemyHand.length < 5 && state.enemyDeck.length > 0) {
        state.enemyHand.push(state.enemyDeck.pop());
    }
}

function showBanner(text) {
    banner.textContent = text;
    banner.classList.add('show');
    setTimeout(() => {
        banner.classList.remove('show');
    }, 1500);
}

function hasUnits(owner) {
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 5; c++) {
            if (state.grid[r][c] && state.grid[r][c].owner === owner) return true;
        }
    }
    return false;
}

function checkGameOver() {
    const pCards = state.hand.length + state.deck.length;
    const eCards = state.enemyHand.length + state.enemyDeck.length;

    const pUnits = hasUnits('player');
    const eUnits = hasUnits('enemy');

    // Mutual wipeout
    if (!pUnits && pCards === 0 && !eUnits && eCards === 0) {
        processBattleEnd(false, "Draw - Mutually assured destruction.");
        return true;
    }
    
    // Player wiped out
    if (!pUnits && pCards === 0) {
        processBattleEnd(false, "Defeat - Your forces were wiped out.");
        return true;
    }

    // Enemy wiped out
    if (!eUnits && eCards === 0) {
        processBattleEnd(true, "Victory!");
        return true;
    }
    
    // STALEMATE: Both players have 0 cards left but units exist. Value decides.
    if (pCards === 0 && eCards === 0) {
        let pScore = 0;
        let eScore = 0;
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 5; c++) {
                if (state.grid[r][c]) {
                    if (state.grid[r][c].owner === 'player') pScore += state.grid[r][c].value;
                    else eScore += state.grid[r][c].value;
                }
            }
        }
        
        if (pScore > eScore) {
            processBattleEnd(true, `Victory by Decision (${pScore} vs ${eScore})!`);
        } else if (pScore < eScore) {
            processBattleEnd(false, `Defeat by Decision (${pScore} vs ${eScore}).`);
        } else {
            // Ties go to the enemy to prevent easy farming
            processBattleEnd(false, `Draw (${pScore} vs ${eScore}) - Failed to overpower enemy.`);
        }
        return true;
    }
    
    return false;
}

function processBattleEnd(isVictory, msg) {
    if (!isVictory) {
        gameOverTitle.textContent = "Defeat";
        gameOverMsg.textContent = msg;
        gameOverScreen.style.display = 'flex';
        return;
    }
    
    // Check if Final Boss
    if (state.campaign.currentNodeId === 15) {
        const wins = parseInt(localStorage.getItem('durakTactics_victories') || '0') + 1;
        localStorage.setItem('durakTactics_victories', wins);
        gameOverTitle.textContent = "Campaign Victory!";
        gameOverMsg.textContent = "You defeated the Final Boss!";
        gameOverScreen.style.display = 'flex';
        return;
    }
    
    // Normal victory -> Rewards
    setTimeout(() => {
        changePhase('rewards');
    }, 1000);
}

function getDisplayVal(val) {
    return DISPLAY_VALS[val] || val.toString();
}

function renderBoard() {
    gridContainer.innerHTML = '';
    
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 5; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            
            // Top 2 rows = enemy, Bottom 2 = player
            const isPlayerZone = r >= 2;
            cell.classList.add(isPlayerZone ? 'player-zone' : 'enemy-zone');
            
            // Check valid target for placement
            if (isPlayerZone && state.grid[r][c] === null && state.selectedHandIndex !== -1 && state.turn === 'player') {
                cell.classList.add('valid-target');
                cell.addEventListener('pointerdown', () => placeCard(r, c));
            }

            const unit = state.grid[r][c];
            if (unit) {
                const uDiv = document.createElement('div');
                uDiv.className = 'unit';
                if (unit.suit === state.trumpSuit) uDiv.classList.add('trump');
                
                const valDiv = document.createElement('div');
                valDiv.className = 'unit-val';
                valDiv.textContent = getDisplayVal(unit.value);
                
                const suitDiv = document.createElement('div');
                suitDiv.className = `unit-suit ${SUITS[unit.suit].colorClass}`;
                suitDiv.textContent = SUITS[unit.suit].emoji;
                
                uDiv.appendChild(valDiv);
                uDiv.appendChild(suitDiv);
                cell.appendChild(uDiv);
            }
            
            gridContainer.appendChild(cell);
        }
    }
    
    // Render Hand
    handContainer.innerHTML = '';
    state.hand.forEach((card, idx) => {
        const cDiv = document.createElement('div');
        cDiv.className = 'hand-card';
        if (card.suit === state.trumpSuit) cDiv.classList.add('trump');
        if (state.selectedHandIndex === idx) cDiv.classList.add('selected');
        
        const valDiv = document.createElement('div');
        valDiv.className = 'unit-val';
        valDiv.textContent = getDisplayVal(card.value);
        
        const suitDiv = document.createElement('div');
        suitDiv.className = `unit-suit ${SUITS[card.suit].colorClass}`;
        suitDiv.textContent = SUITS[card.suit].emoji;
        
        cDiv.appendChild(valDiv);
        cDiv.appendChild(suitDiv);
        
        if (state.turn === 'player') {
            cDiv.addEventListener('pointerdown', () => {
                // Toggle selection
                state.selectedHandIndex = state.selectedHandIndex === idx ? -1 : idx;
                renderBoard(); // Re-render to update highlights
            });
        }
        
        handContainer.appendChild(cDiv);
    });
}

function updateUI() {
    deckCountEl.textContent = `Deck: ${state.deck.length}`;
    statsInfo.textContent = `Round ${state.roundCount} — Trump: ${SUITS[state.trumpSuit].name} ${SUITS[state.trumpSuit].emoji}`;
    endTurnBtn.disabled = state.turn !== 'player';
}

endTurnBtn.addEventListener('click', () => {
    if (state.turn !== 'player') return;
    
    // Player manually ends turn
    state.selectedHandIndex = -1;
    renderBoard();
    
    // Resolve any pending combat (should be none, but just in case), then enemy turn
    resolveCombat(() => {
        if (checkGameOver()) return;
        state.turn = 'enemy';
        updateUI();
        
        setTimeout(() => {
            playAI();
        }, 600);
    });
});

function placeCard(row, col) {
    if (state.selectedHandIndex === -1 || state.grid[row][col] !== null) return;
    
    const card = state.hand.splice(state.selectedHandIndex, 1)[0];
    state.grid[row][col] = {
        ...card,
        row: row,
        col: col
    };
    
    state.selectedHandIndex = -1;
    
    renderBoard();
    updateUI();
    
    resolveCombat(() => {
        if (checkGameOver()) return;
        state.turn = 'enemy';
        updateUI();
        
        setTimeout(() => {
            playAI();
        }, 600);
    });
}

function beats(a, b) {
    if (a.suit === b.suit) return a.value > b.value;
    if (a.suit === state.trumpSuit && b.suit !== state.trumpSuit) return true;
    return false;
}

function resolveCombat(onComplete) {
    let combatsOccurred = false;
    
    // Find adjacencies
    const units = [];
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 5; c++) {
            if (state.grid[r][c]) {
                units.push(state.grid[r][c]);
                state.grid[r][c].nextDamage = 0;
                state.grid[r][c].nextDestroyed = false;
            }
        }
    }
    
    // Check all pairs
    for (let i = 0; i < units.length; i++) {
        for (let j = i + 1; j < units.length; j++) {
            const u1 = units[i];
            const u2 = units[j];
            
            // Only orthogonal adjacency matters, and they must be enemies
            const isAdj = Math.abs(u1.row - u2.row) + Math.abs(u1.col - u2.col) === 1;
            if (isAdj && u1.owner !== u2.owner) {
                // Determine combat
                let clash = false;
                if (beats(u1, u2)) {
                    clash = true;
                    u2.nextDestroyed = true;
                    u1.nextDamage += u2.value;
                } else if (beats(u2, u1)) {
                    clash = true;
                    u1.nextDestroyed = true;
                    u2.nextDamage += u1.value;
                } else if (u1.suit === u2.suit && u1.value === u2.value) {
                    clash = true;
                    u1.nextDestroyed = true;
                    u2.nextDestroyed = true;
                }
                
                if (clash) combatsOccurred = true;
            }
        }
    }
    
    if (combatsOccurred) {
        // Apply damage visually
        let destroyedNodes = [];
        
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 5; c++) {
                const u = state.grid[r][c];
                if (u && (u.nextDamage > 0 || u.nextDestroyed)) {
                    // We need a visual indication. For now, inline flash.
                    const cellEl = gridContainer.children[r * 5 + c];
                    cellEl.style.transition = 'background-color 0.2s';
                    cellEl.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
                    setTimeout(() => cellEl.style.backgroundColor = '', 300);
                    
                    u.value -= u.nextDamage;
                    if (u.value <= 0 || u.nextDestroyed) {
                        state.grid[r][c] = null; // Destroyed
                    }
                }
            }
        }
        
        // Wait for flash animation then re-render and proceed
        setTimeout(() => {
            renderBoard();
            onComplete();
        }, 500);
    } else {
        onComplete();
    }
}

function playAI() {
    // Basic AI: Pick best valid placement for highest score
    // Score logic: 
    // +10 per unit it destroys
    // -100 per placement where it gets destroyed
    // +5 for safe empty place
    
    let bestScore = -9999;
    let bestMoves = [];
    
    for (let i = 0; i < state.enemyHand.length; i++) {
        const card = state.enemyHand[i];
        
        for (let r = 0; r < 2; r++) { // Top 2 rows
            for (let c = 0; c < 5; c++) {
                if (state.grid[r][c] !== null) continue;
                
                let score = 5; // Base safe score
                
                // Check adjacencies
                const adjs = [
                    [r-1, c], [r+1, c], [r, c-1], [r, c+1]
                ];
                
                let getsDestroyed = false;
                for (let adj of adjs) {
                    const [ar, ac] = adj;
                    if (ar >= 0 && ar < 4 && ac >= 0 && ac < 5) {
                        const neighbor = state.grid[ar][ac];
                        if (neighbor && neighbor.owner === 'player') {
                            if (beats(neighbor, card)) {
                                getsDestroyed = true;
                            } else if (beats(card, neighbor)) {
                                score += 20; // Destroying player is good
                            } else if (card.suit === neighbor.suit && card.value === neighbor.value) {
                                getsDestroyed = true; // Suicide
                            }
                        }
                    }
                }
                
                if (getsDestroyed) score -= 100;
                
                // Add minor random noise for tie-breaking
                score += Math.random();
                
                if (score > bestScore) {
                    bestScore = score;
                    bestMoves = [{ handIdx: i, r, c }];
                } else if (Math.abs(score - bestScore) < 0.01) {
                    bestMoves.push({ handIdx: i, r, c });
                }
            }
        }
    }
    
    if (bestMoves.length > 0) {
        // Pick random among best
        const move = bestMoves[Math.floor(Math.random() * bestMoves.length)];
        const playedCard = state.enemyHand.splice(move.handIdx, 1)[0];
        
        state.grid[move.r][move.c] = {
            ...playedCard,
            row: move.r,
            col: move.c
        };
        
        renderBoard(); // Show AI placement quickly
        
        setTimeout(() => {
            resolveCombat(() => {
                if (checkGameOver()) return;
                advanceRound();
            });
        }, 600);
    } else {
        // No moves? Just give back
        if (checkGameOver()) return;
        advanceRound();
    }
}

function advanceRound() {
    state.turn = 'player';
    state.roundCount++;
    
    if (state.roundCount % 3 === 1 && state.roundCount > 1) {
        // Shift trump
        state.trumpSuit = (state.trumpSuit + 1) % 4;
        showBanner(`Trump shifts to ${SUITS[state.trumpSuit].emoji}!`);
    }
    
    drawHand();
    renderBoard();
    updateUI();
}

// Pause/Resume from settings
window.addEventListener('settingsOpened', () => { /* Pause any timers if we had them */ });
window.addEventListener('settingsClosed', () => { /* Resume */ });

// --- Screen Setups ---

function setupRewards() {
    let survivingUnits = 0;
    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 5; c++) {
            if (state.grid[r][c] && state.grid[r][c].owner === 'player') survivingUnits++;
        }
    }
    const earned = 5 + (survivingUnits * 5);
    state.campaign.gold += earned;
    document.getElementById('reward-gold-msg').textContent = `You earned ${earned} Gold!`;
    
    // Generate 2 random draft cards
    const options = [];
    const minVal = 8, maxVal = 14; 
    for(let i=0; i<2; i++) {
        const suits = Math.floor(Math.random() * 4);
        const val = Math.floor(Math.random() * (maxVal - minVal + 1)) + minVal;
        options.push({ value: val, originalValue: val, suit: suits, owner: 'player' });
    }
    
    const draftContainer = document.getElementById('draft-container');
    draftContainer.innerHTML = '';
    
    options.forEach(card => {
        const cDiv = document.createElement('div');
        cDiv.className = 'hand-card'; 
        cDiv.style.width = '80px';
        cDiv.style.height = '110px';
        
        const valDiv = document.createElement('div');
        valDiv.className = 'unit-val';
        valDiv.textContent = getDisplayVal(card.value);
        
        const suitDiv = document.createElement('div');
        suitDiv.className = `unit-suit ${SUITS[card.suit].colorClass}`;
        suitDiv.textContent = SUITS[card.suit].emoji;
        
        cDiv.appendChild(valDiv);
        cDiv.appendChild(suitDiv);
        
        cDiv.addEventListener('pointerdown', () => {
            state.campaign.deck.push(card);
            changePhase('map');
        });
        
        draftContainer.appendChild(cDiv);
    });
    
    document.getElementById('btn-skip-draft').onclick = () => {
        changePhase('map');
    };
}

function setupShop() {
    document.getElementById('shop-gold').textContent = state.campaign.gold;
    const shopList = document.getElementById('shop-items');
    shopList.innerHTML = '';
    
    // Extra Draw
    const drawDiv = document.createElement('div');
    drawDiv.className = 'shop-item';
    drawDiv.innerHTML = `
        <div class="shop-item-info">
            <strong>Extra Draw (Free)</strong>
            <span>Start next battle with +1 card in hand (Once per shop)</span>
        </div>
        <button class="btn-primary" style="padding: 10px 20px;">Claim</button>
    `;
    const btn = drawDiv.querySelector('button');
    btn.onclick = () => {
        state.campaign.extraDrawNextBattle = true;
        btn.textContent = "Claimed";
        btn.disabled = true;
    };
    shopList.appendChild(drawDiv);
    
    // Remove Card
    const rmDiv = document.createElement('div');
    rmDiv.className = 'shop-item';
    rmDiv.innerHTML = `
        <div class="shop-item-info">
            <strong>Remove Card (15g)</strong>
            <span>Remove a weak card from your deck</span>
        </div>
        <button class="btn-primary" style="padding: 10px 20px;">Buy</button>
    `;
    const rmBtn = rmDiv.querySelector('button');
    rmBtn.onclick = () => {
        if (state.campaign.gold >= 15 && state.campaign.deck.length > 8) {
            state.campaign.gold -= 15;
            document.getElementById('shop-gold').textContent = state.campaign.gold;
            // Remove lowest value
            state.campaign.deck.sort((a,b) => a.value - b.value);
            state.campaign.deck.shift();
            rmBtn.textContent = "Purchased";
        }
    };
    shopList.appendChild(rmDiv);
    
    // Upgrade Card
    const upDiv = document.createElement('div');
    upDiv.className = 'shop-item';
    upDiv.innerHTML = `
        <div class="shop-item-info">
            <strong>Upgrade Random (20g)</strong>
            <span>Give +1 value to a random card</span>
        </div>
        <button class="btn-primary" style="padding: 10px 20px;">Buy</button>
    `;
    const upBtn = upDiv.querySelector('button');
    upBtn.onclick = () => {
        if (state.campaign.gold >= 20) {
            state.campaign.gold -= 20;
            document.getElementById('shop-gold').textContent = state.campaign.gold;
            const target = state.campaign.deck[Math.floor(Math.random() * state.campaign.deck.length)];
            target.value++;
            target.originalValue++;
            upBtn.textContent = "Purchased";
        }
    };
    shopList.appendChild(upDiv);
    
    document.getElementById('btn-leave-shop').onclick = () => {
        changePhase('map');
    };
}

function setupEvent() {
    const events = [
        {
            title: "The Shrine",
            desc: "You discover a mysterious shrine humming with power. It offers you a choice...",
            a: "Gain 15 Gold",
            b: "Upgrade a random card (+1 Value)",
            onA: () => { state.campaign.gold += 15; changePhase('map'); },
            onB: () => {
                const target = state.campaign.deck[Math.floor(Math.random() * state.campaign.deck.length)];
                target.value++; target.originalValue++;
                changePhase('map');
            }
        },
        {
            title: "The Merchant",
            desc: "A wandering merchant offers a strange trade.",
            a: "Lose 10 Gold, Gain +1 Max Draw Next Battle",
            b: "Walk away safely",
            onA: () => { 
                if (state.campaign.gold >= 10) {
                    state.campaign.gold -= 10;
                    state.campaign.extraDrawNextBattle = true;
                }
                changePhase('map'); 
            },
            onB: () => { changePhase('map'); }
        }
    ];
    
    const ev = events[Math.floor(Math.random() * events.length)];
    document.getElementById('event-title').textContent = ev.title;
    document.getElementById('event-desc').textContent = ev.desc;
    
    const btnA = document.getElementById('btn-event-a');
    const btnB = document.getElementById('btn-event-b');
    
    btnA.textContent = ev.a;
    btnB.textContent = ev.b;
    
    // Clear old listeners
    const newBtnA = btnA.cloneNode(true);
    const newBtnB = btnB.cloneNode(true);
    btnA.replaceWith(newBtnA);
    btnB.replaceWith(newBtnB);
    
    newBtnA.onclick = ev.onA;
    newBtnB.onclick = ev.onB;
}
