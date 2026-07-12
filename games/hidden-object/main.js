import { state, dom } from './state.js';
import {
    showScreen, startNewGameSession, startNextRound, handleRoundTick,
    quitGameAndGoToMenu, animateScene, drawScene, handleCanvasInteraction,
} from './gameplay.js';

// --- DOM Elements ---
dom.mainScreenElement = document.getElementById('mainScreen');
dom.gameScreenContainerElement = document.getElementById('gameScreenContainer');
dom.startGameButton = document.getElementById('startGameButton');

dom.canvas = document.getElementById('gameCanvas');
dom.ctx = dom.canvas.getContext('2d');
dom.targetMessageElement = document.getElementById('targetMessage');
dom.roundTimerDisplayElement = document.getElementById('roundTimerDisplay');
dom.currentRoundDisplayElement = document.getElementById('currentRoundDisplay');
dom.quitToMenuButton = document.getElementById('quitToMenuButton');
dom.successModalElement = document.getElementById('successModal');
dom.successMessageTextElement = document.getElementById('successMessageText');
dom.timeTakenTextElement = document.getElementById('timeTakenText');
dom.foundObjectNameElement = document.getElementById('foundObjectName');
dom.nextRoundButton = document.getElementById('nextRoundButton');
dom.gameOverModalElement = document.getElementById('gameOverModal');
dom.sessionEndedScoreTextElement = document.getElementById('sessionEndedScoreText');
dom.backToMainScreenButtonFromGameOver = document.getElementById('backToMainScreenButtonFromGameOver');

// --- Event Listeners ---
dom.startGameButton.addEventListener('click', () => {

    localStorage.setItem('lastPlayed_hiddenObject', Date.now());
    startNewGameSession();
});
dom.quitToMenuButton.addEventListener('click', quitGameAndGoToMenu);
dom.canvas.addEventListener('click', handleCanvasInteraction);
dom.canvas.addEventListener('touchstart', handleCanvasInteraction, { passive: false });
dom.nextRoundButton.addEventListener('click', startNextRound);
dom.backToMainScreenButtonFromGameOver.addEventListener('click', () => showScreen('main'));

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (state.currentScreen === 'game' && (!state.isRoundOver || (state.isRoundOver && state.targetItem && state.targetItem.found))) { drawScene(); }
    }, 100);
});

// --- Initial Game Load ---
showScreen('main');
if (document.fonts && typeof document.fonts.ready === 'object') {
    document.fonts.ready.catch(err => console.warn("Font loading issue.", err));
}

// --- Settings pause/resume ---
window.addEventListener('settingsOpened', () => {
    if (state.animationFrameId) { cancelAnimationFrame(state.animationFrameId); state.animationFrameId = null; }
    if (state.roundIntervalId) { clearInterval(state.roundIntervalId); state.roundIntervalId = null; }
});
window.addEventListener('settingsClosed', () => {
    state.animationFrameId = requestAnimationFrame(animateScene);
    if (!state.isRoundOver) { state.roundIntervalId = setInterval(handleRoundTick, 1000); }
});
