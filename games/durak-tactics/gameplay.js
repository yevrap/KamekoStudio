// ─── Gameplay — all game logic, rendering, phase management ───────────────────

import { state } from './state.js';
import { SUITS, TYPE_ICONS, getDisplayVal } from './constants.js';

// ─── DOM refs ─────────────────────────────────────────────────────────────────

const $gameUi        = document.getElementById('game-ui');
const $gridContainer = document.getElementById('grid-container');
const $handContainer = document.getElementById('hand-container');
const $endTurnBtn    = document.getElementById('btn-end-turn');
const $statsInfo     = document.getElementById('stats-info');
const $deckCountEl   = document.getElementById('deck-count');
const $banner        = document.getElementById('announcement-banner');
const $gameOverScreen = document.getElementById('game-over-screen');
const $gameOverTitle  = document.getElementById('game-over-title');
const $gameOverMsg    = document.getElementById('game-over-msg');

// ─── Shuffle (local utility) ──────────────────────────────────────────────────

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// ─── Phase management ─────────────────────────────────────────────────────────

export function changePhase(newPhase) {
    state.phase = newPhase;
    document.querySelectorAll('.screen-ui').forEach(el => el.style.display = 'none');
    $gameUi.style.display = 'none';

    if (newPhase === 'map') {
        document.getElementById('map-ui').style.display = 'flex';
        renderMap();
    } else if (newPhase === 'battle') {
        $gameUi.style.display = 'flex';
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

// ─── Map ──────────────────────────────────────────────────────────────────────

export function generateMap() {
    return [
        { id: 1,  type: 'start',  row: 0, col:  0, next: [2] },
        { id: 2,  type: 'battle', row: 1, col:  0, next: [3] },
        { id: 3,  type: 'battle', row: 2, col:  0, next: [4, 5] },
        { id: 4,  type: 'shop',   row: 3, col: -1, next: [6] },
        { id: 5,  type: 'battle', row: 3, col:  1, next: [7] },
        { id: 6,  type: 'battle', row: 4, col: -1, next: [8] },
        { id: 7,  type: 'event',  row: 4, col:  1, next: [8] },
        { id: 8,  type: 'boss',   row: 5, col:  0, next: [9, 10] },
        { id: 9,  type: 'battle', row: 6, col: -1, next: [11] },
        { id: 10, type: 'battle', row: 6, col:  1, next: [12] },
        { id: 11, type: 'event',  row: 7, col: -1, next: [13] },
        { id: 12, type: 'shop',   row: 7, col:  1, next: [14] },
        { id: 13, type: 'battle', row: 8, col: -1, next: [15] },
        { id: 14, type: 'battle', row: 8, col:  1, next: [15] },
        { id: 15, type: 'boss',   row: 9, col:  0, next: [] }
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
            const isSelectable = currentNode.next.includes(node.id) ||
                (node.id === currentNode.id && node.type === 'start');

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

// ─── Battle setup ─────────────────────────────────────────────────────────────

function startBattleParams() {
    state.grid = Array(4).fill(null).map(() => Array(5).fill(null));
    state.trumpSuit = Math.floor(Math.random() * 4);
    state.roundCount = 1;
    state.turn = 'player';
    state.selectedHandIndex = -1;

    state.deck = JSON.parse(JSON.stringify(state.campaign.deck));
    state.deck.forEach(c => c.value = c.originalValue);

    let minE = 6, maxE = 10;
    const act = Math.floor(state.campaign.maxNodeReached / 4);
    if (act === 1) maxE = 12;
    else if (act >= 2) maxE = 14;

    state.enemyDeck = [];
    const enemyDeckSize = 8 + (act * 2);
    for (let i = 0; i < enemyDeckSize; i++) {
        const suit = Math.floor(Math.random() * 4);
        const val  = Math.floor(Math.random() * (maxE - minE + 1)) + minE;
        state.enemyDeck.push({ value: val, originalValue: val, suit, owner: 'enemy' });
    }

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
    while (state.hand.length < 5 && state.deck.length > 0) state.hand.push(state.deck.pop());
    while (state.enemyHand.length < 5 && state.enemyDeck.length > 0) state.enemyHand.push(state.enemyDeck.pop());
}

// ─── Rendering ────────────────────────────────────────────────────────────────

export function renderBoard() {
    $gridContainer.innerHTML = '';

    for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 5; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';

            const isPlayerZone = r >= 2;
            cell.classList.add(isPlayerZone ? 'player-zone' : 'enemy-zone');

            if (isPlayerZone && state.grid[r][c] === null &&
                state.selectedHandIndex !== -1 && state.turn === 'player') {
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
                suitDiv.className = 'unit-suit ' + SUITS[unit.suit].colorClass;
                suitDiv.textContent = SUITS[unit.suit].emoji;

                uDiv.appendChild(valDiv);
                uDiv.appendChild(suitDiv);
                cell.appendChild(uDiv);
            }

            $gridContainer.appendChild(cell);
        }
    }

    // Render hand
    $handContainer.innerHTML = '';
    state.hand.forEach((card, idx) => {
        const cDiv = document.createElement('div');
        cDiv.className = 'hand-card';
        if (card.suit === state.trumpSuit) cDiv.classList.add('trump');
        if (state.selectedHandIndex === idx) cDiv.classList.add('selected');

        const valDiv = document.createElement('div');
        valDiv.className = 'unit-val';
        valDiv.textContent = getDisplayVal(card.value);

        const suitDiv = document.createElement('div');
        suitDiv.className = 'unit-suit ' + SUITS[card.suit].colorClass;
        suitDiv.textContent = SUITS[card.suit].emoji;

        cDiv.appendChild(valDiv);
        cDiv.appendChild(suitDiv);

        if (state.turn === 'player') {
            cDiv.addEventListener('pointerdown', () => {
                state.selectedHandIndex = state.selectedHandIndex === idx ? -1 : idx;
                renderBoard();
            });
        }

        $handContainer.appendChild(cDiv);
    });
}

export function updateUI() {
    $deckCountEl.textContent = 'Deck: ' + state.deck.length;
    $statsInfo.textContent = 'Round ' + state.roundCount +
        ' \u2014 Trump: ' + SUITS[state.trumpSuit].name + ' ' + SUITS[state.trumpSuit].emoji;
    $endTurnBtn.disabled = state.turn !== 'player';
}

function showBanner(text) {
    $banner.textContent = text;
    $banner.classList.add('show');
    setTimeout(() => $banner.classList.remove('show'), 1500);
}

// ─── Card placement ───────────────────────────────────────────────────────────

function placeCard(row, col) {
    if (state.selectedHandIndex === -1 || state.grid[row][col] !== null) return;

    const card = state.hand.splice(state.selectedHandIndex, 1)[0];
    state.grid[row][col] = { ...card, row, col };
    state.selectedHandIndex = -1;

    renderBoard();
    updateUI();

    resolveCombat(() => {
        if (checkGameOver()) return;
        state.turn = 'enemy';
        updateUI();
        setTimeout(() => playAI(), 600);
    });
}

// ─── Combat resolution ────────────────────────────────────────────────────────

function beats(a, b) {
    if (a.suit === b.suit) return a.value > b.value;
    if (a.suit === state.trumpSuit && b.suit !== state.trumpSuit) return true;
    return false;
}

export function resolveCombat(onComplete) {
    let combatsOccurred = false;

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

    for (let i = 0; i < units.length; i++) {
        for (let j = i + 1; j < units.length; j++) {
            const u1 = units[i], u2 = units[j];
            const isAdj = Math.abs(u1.row - u2.row) + Math.abs(u1.col - u2.col) === 1;
            if (!isAdj || u1.owner === u2.owner) continue;

            let clash = false;
            if (beats(u1, u2)) {
                clash = true; u2.nextDestroyed = true; u1.nextDamage += u2.value;
            } else if (beats(u2, u1)) {
                clash = true; u1.nextDestroyed = true; u2.nextDamage += u1.value;
            } else if (u1.suit === u2.suit && u1.value === u2.value) {
                clash = true; u1.nextDestroyed = true; u2.nextDestroyed = true;
            }
            if (clash) combatsOccurred = true;
        }
    }

    if (combatsOccurred) {
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 5; c++) {
                const u = state.grid[r][c];
                if (u && (u.nextDamage > 0 || u.nextDestroyed)) {
                    const cellEl = $gridContainer.children[r * 5 + c];
                    cellEl.style.transition = 'background-color 0.2s';
                    cellEl.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
                    setTimeout(() => { cellEl.style.backgroundColor = ''; }, 300);

                    u.value -= u.nextDamage;
                    if (u.value <= 0 || u.nextDestroyed) state.grid[r][c] = null;
                }
            }
        }
        setTimeout(() => { renderBoard(); onComplete(); }, 500);
    } else {
        onComplete();
    }
}

// ─── Win/lose checks ──────────────────────────────────────────────────────────

function hasUnits(owner) {
    for (let r = 0; r < 4; r++)
        for (let c = 0; c < 5; c++)
            if (state.grid[r][c] && state.grid[r][c].owner === owner) return true;
    return false;
}

export function checkGameOver() {
    const pCards = state.hand.length + state.deck.length;
    const eCards = state.enemyHand.length + state.enemyDeck.length;
    const pUnits = hasUnits('player');
    const eUnits = hasUnits('enemy');

    if (!pUnits && pCards === 0 && !eUnits && eCards === 0) {
        processBattleEnd(false, 'Draw — Mutually assured destruction.'); return true;
    }
    if (!pUnits && pCards === 0) {
        processBattleEnd(false, 'Defeat — Your forces were wiped out.'); return true;
    }
    if (!eUnits && eCards === 0) {
        processBattleEnd(true, 'Victory!'); return true;
    }
    if (pCards === 0 && eCards === 0) {
        let pScore = 0, eScore = 0;
        for (let r = 0; r < 4; r++)
            for (let c = 0; c < 5; c++)
                if (state.grid[r][c])
                    (state.grid[r][c].owner === 'player' ? (pScore += state.grid[r][c].value) : (eScore += state.grid[r][c].value));
        if (pScore > eScore)      processBattleEnd(true,  'Victory by Decision (' + pScore + ' vs ' + eScore + ')!');
        else if (pScore < eScore) processBattleEnd(false, 'Defeat by Decision (' + pScore + ' vs ' + eScore + ').');
        else                      processBattleEnd(false, 'Draw (' + pScore + ' vs ' + eScore + ') — Failed to overpower enemy.');
        return true;
    }
    return false;
}

function processBattleEnd(isVictory, msg) {
    if (!isVictory) {
        $gameOverTitle.textContent = 'Defeat';
        $gameOverMsg.textContent = msg;
        $gameOverScreen.style.display = 'flex';
        return;
    }
    if (state.campaign.currentNodeId === 15) {
        const wins = parseInt(localStorage.getItem('durakTactics_victories') || '0') + 1;
        localStorage.setItem('durakTactics_victories', wins);
        $gameOverTitle.textContent = 'Campaign Victory!';
        $gameOverMsg.textContent = 'You defeated the Final Boss!';
        $gameOverScreen.style.display = 'flex';
        return;
    }
    setTimeout(() => changePhase('rewards'), 1000);
}

// ─── AI ───────────────────────────────────────────────────────────────────────

export function playAI() {
    let bestScore = -9999, bestMoves = [];

    for (let i = 0; i < state.enemyHand.length; i++) {
        const card = state.enemyHand[i];
        for (let r = 0; r < 2; r++) {
            for (let c = 0; c < 5; c++) {
                if (state.grid[r][c] !== null) continue;
                let score = 5;
                let getsDestroyed = false;
                const adjs = [[r-1,c],[r+1,c],[r,c-1],[r,c+1]];
                for (const [ar, ac] of adjs) {
                    if (ar >= 0 && ar < 4 && ac >= 0 && ac < 5) {
                        const neighbor = state.grid[ar][ac];
                        if (neighbor && neighbor.owner === 'player') {
                            if (beats(neighbor, card)) getsDestroyed = true;
                            else if (beats(card, neighbor)) score += 20;
                            else if (card.suit === neighbor.suit && card.value === neighbor.value) getsDestroyed = true;
                        }
                    }
                }
                if (getsDestroyed) score -= 100;
                score += Math.random();
                if (score > bestScore) { bestScore = score; bestMoves = [{ handIdx: i, r, c }]; }
                else if (Math.abs(score - bestScore) < 0.01) bestMoves.push({ handIdx: i, r, c });
            }
        }
    }

    if (bestMoves.length > 0) {
        const move = bestMoves[Math.floor(Math.random() * bestMoves.length)];
        const playedCard = state.enemyHand.splice(move.handIdx, 1)[0];
        state.grid[move.r][move.c] = { ...playedCard, row: move.r, col: move.c };
        renderBoard();
        setTimeout(() => {
            resolveCombat(() => {
                if (checkGameOver()) return;
                advanceRound();
            });
        }, 600);
    } else {
        if (checkGameOver()) return;
        advanceRound();
    }
}

function advanceRound() {
    state.turn = 'player';
    state.roundCount++;
    if (state.roundCount % 3 === 1 && state.roundCount > 1) {
        state.trumpSuit = (state.trumpSuit + 1) % 4;
        showBanner('Trump shifts to ' + SUITS[state.trumpSuit].emoji + '!');
    }
    drawHand();
    renderBoard();
    updateUI();
}

// ─── Rewards / Shop / Events ──────────────────────────────────────────────────

function setupRewards() {
    let survivingUnits = 0;
    for (let r = 0; r < 4; r++)
        for (let c = 0; c < 5; c++)
            if (state.grid[r][c] && state.grid[r][c].owner === 'player') survivingUnits++;

    const earned = 5 + survivingUnits * 5;
    state.campaign.gold += earned;
    document.getElementById('reward-gold-msg').textContent = 'You earned ' + earned + ' Gold!';

    const options = [];
    for (let i = 0; i < 2; i++) {
        const suit = Math.floor(Math.random() * 4);
        const val  = Math.floor(Math.random() * (14 - 8 + 1)) + 8;
        options.push({ value: val, originalValue: val, suit, owner: 'player' });
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
        suitDiv.className = 'unit-suit ' + SUITS[card.suit].colorClass;
        suitDiv.textContent = SUITS[card.suit].emoji;

        cDiv.appendChild(valDiv);
        cDiv.appendChild(suitDiv);
        cDiv.addEventListener('pointerdown', () => {
            state.campaign.deck.push(card);
            changePhase('map');
        });
        draftContainer.appendChild(cDiv);
    });

    document.getElementById('btn-skip-draft').onclick = () => changePhase('map');
}

function setupShop() {
    document.getElementById('shop-gold').textContent = state.campaign.gold;
    const shopList = document.getElementById('shop-items');
    shopList.innerHTML = '';

    function shopItem(title, desc, price, onBuy) {
        const div = document.createElement('div');
        div.className = 'shop-item';
        div.innerHTML =
            '<div class="shop-item-info"><strong>' + title + '</strong><span>' + desc + '</span></div>' +
            '<button class="btn-primary" style="padding:10px 20px;">Buy</button>';
        const btn = div.querySelector('button');
        btn.onclick = () => onBuy(btn);
        shopList.appendChild(div);
    }

    shopItem('Extra Draw (Free)', 'Start next battle with +1 card in hand (once per shop)', 0, btn => {
        state.campaign.extraDrawNextBattle = true;
        btn.textContent = 'Claimed'; btn.disabled = true;
    });

    shopItem('Remove Card (15g)', 'Remove a weak card from your deck', 15, btn => {
        if (state.campaign.gold >= 15 && state.campaign.deck.length > 8) {
            state.campaign.gold -= 15;
            document.getElementById('shop-gold').textContent = state.campaign.gold;
            state.campaign.deck.sort((a, b) => a.value - b.value);
            state.campaign.deck.shift();
            btn.textContent = 'Purchased';
        }
    });

    shopItem('Upgrade Random (20g)', 'Give +1 value to a random card', 20, btn => {
        if (state.campaign.gold >= 20) {
            state.campaign.gold -= 20;
            document.getElementById('shop-gold').textContent = state.campaign.gold;
            const target = state.campaign.deck[Math.floor(Math.random() * state.campaign.deck.length)];
            target.value++; target.originalValue++;
            btn.textContent = 'Purchased';
        }
    });

    document.getElementById('btn-leave-shop').onclick = () => changePhase('map');
}

function setupEvent() {
    const events = [
        {
            title: 'The Shrine',
            desc: 'You discover a mysterious shrine humming with power. It offers you a choice...',
            a: 'Gain 15 Gold',
            b: 'Upgrade a random card (+1 Value)',
            onA: () => { state.campaign.gold += 15; changePhase('map'); },
            onB: () => {
                const t = state.campaign.deck[Math.floor(Math.random() * state.campaign.deck.length)];
                t.value++; t.originalValue++; changePhase('map');
            }
        },
        {
            title: 'The Merchant',
            desc: 'A wandering merchant offers a strange trade.',
            a: 'Lose 10 Gold, gain +1 Max Draw next battle',
            b: 'Walk away safely',
            onA: () => {
                if (state.campaign.gold >= 10) { state.campaign.gold -= 10; state.campaign.extraDrawNextBattle = true; }
                changePhase('map');
            },
            onB: () => changePhase('map')
        }
    ];

    const ev = events[Math.floor(Math.random() * events.length)];
    document.getElementById('event-title').textContent = ev.title;
    document.getElementById('event-desc').textContent = ev.desc;

    // Replace buttons to clear old listeners
    const btnA = document.getElementById('btn-event-a');
    const btnB = document.getElementById('btn-event-b');
    const newA = btnA.cloneNode(true);
    const newB = btnB.cloneNode(true);
    btnA.replaceWith(newA); btnB.replaceWith(newB);

    newA.textContent = ev.a; newA.onclick = ev.onA;
    newB.textContent = ev.b; newB.onclick = ev.onB;
}
