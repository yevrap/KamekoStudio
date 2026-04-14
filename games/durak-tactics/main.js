// ─── Main — event wiring, startGame, settings integration ─────────────────────

import { state } from './state.js';
import {
    changePhase, generateMap,
    renderBoard, updateUI, resolveCombat, checkGameOver, playAI
} from './gameplay.js';

// ─── Start game ───────────────────────────────────────────────────────────────

function startGame() {
    document.getElementById('start-screen').style.display = 'none';

    state.campaign.nodes               = generateMap();
    state.campaign.gold                = 0;
    state.campaign.currentNodeId       = 1;
    state.campaign.maxNodeReached      = 1;
    state.campaign.extraDrawNextBattle = false;
    state.campaign.deck                = [];

    [6, 8, 10].forEach(val => {
        for (let s = 0; s < 4; s++) {
            state.campaign.deck.push({ value: val, originalValue: val, suit: s, owner: 'player' });
        }
    });

    changePhase('map');
}

// ─── Event listeners ──────────────────────────────────────────────────────────

document.getElementById('btn-start').addEventListener('click', () => {
    if (!window.KamekoTokens || !window.KamekoTokens.spend()) {
        if (window.KamekoTokens) window.KamekoTokens.toast();
        return;
    }
    localStorage.setItem('lastPlayed_durakTactics', Date.now());
    startGame();
});

document.getElementById('btn-end-turn').addEventListener('click', () => {
    if (state.turn !== 'player') return;
    state.selectedHandIndex = -1;
    renderBoard();
    resolveCombat(() => {
        if (checkGameOver()) return;
        state.turn = 'enemy';
        updateUI();
        setTimeout(() => playAI(), 600);
    });
});

// ─── Settings integration ─────────────────────────────────────────────────────

window.addEventListener('settingsOpened', () => { /* pause timers if added later */ });
window.addEventListener('settingsClosed', () => { /* resume timers if added later */ });
