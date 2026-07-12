import { state, dom } from './state.js';
import { handlePointerDown, handleResize, goToStartScreen, startGame, gameLoop, showTopScores, hideTopScores } from './gameplay.js';

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded. Initializing game...");
    // Assign DOM Elements
    dom.gridElement = document.getElementById('game-grid');
    dom.playerElement = document.getElementById('player');
    dom.bodyElement = document.body;
    dom.scoreDisplay = document.getElementById('score-display');
    dom.timerDisplay = document.getElementById('timer-display');
    dom.startScreenOverlay = document.getElementById('start-screen-overlay');
    dom.startScoreButton = document.getElementById('start-score-button');
    dom.startSurvivalButton = document.getElementById('start-survival-button');
    dom.gameOverOverlay = document.getElementById('game-over-overlay');
    dom.finalScoreElement = document.getElementById('final-score');
    dom.topScoreScoreElement = document.getElementById('top-score-score');
    dom.topScoreSurvivalElement = document.getElementById('top-score-survival');
    dom.playAgainButtonLose = document.getElementById('play-again-button-lose');
    dom.winOverlay = document.getElementById('win-overlay');
    dom.winFinalScoreElement = document.getElementById('win-final-score');
    dom.winTopScoreScoreElement = document.getElementById('win-top-score-score');
    dom.winTopScoreSurvivalElement = document.getElementById('win-top-score-survival');
    dom.playAgainButtonWin = document.getElementById('play-again-button-win');
    dom.startSpectateButton = document.getElementById('start-spectate-button');
    dom.menuButton = document.getElementById('menu-button');
    dom.topScoresButton = document.getElementById('top-scores-button');
    dom.topScoresOverlay = document.getElementById('top-scores-overlay');
    dom.infoTopScoreScoreElement = document.getElementById('info-top-score-score');
    dom.infoTopScoreSurvivalElement = document.getElementById('info-top-score-survival');
    dom.closeTopScoresButton = document.getElementById('close-top-scores-button');
    dom.topScoreScoreBadge = document.getElementById('top-score-score-badge');
    dom.topScoreSurvivalBadge = document.getElementById('top-score-survival-badge');
    dom.winTopScoreScoreBadge = document.getElementById('win-top-score-score-badge');
    dom.winTopScoreSurvivalBadge = document.getElementById('win-top-score-survival-badge');

    // Check if all elements were found
    if (!dom.gridElement || !dom.playerElement || !dom.bodyElement || !dom.scoreDisplay || !dom.gameOverOverlay || !dom.startScreenOverlay || !dom.startScoreButton || !dom.startSurvivalButton || !dom.playAgainButtonLose || !dom.winOverlay || !dom.playAgainButtonWin || !dom.timerDisplay || !dom.menuButton || !dom.topScoresButton || !dom.topScoresOverlay || !dom.closeTopScoresButton) {
        console.error("One or more essential DOM elements could not be found. Aborting initialization.");
        document.body.innerHTML = '<p style="color: red; font-family: sans-serif; padding: 20px;">Error: Could not initialize game components.</p>';
        return;
    }

    // Add Event Listeners
    dom.gridElement.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('resize', handleResize);
    dom.playAgainButtonLose.addEventListener('click', goToStartScreen);
    dom.playAgainButtonWin.addEventListener('click', goToStartScreen);
    dom.startScoreButton.addEventListener('click', () => {
        localStorage.setItem('lastPlayed_materialsRun', Date.now());
        localStorage.setItem('materialsRun_autoPlay', 'false');
        startGame('score');
    });
    dom.startSurvivalButton.addEventListener('click', () => {

        localStorage.setItem('lastPlayed_materialsRun', Date.now());
        localStorage.setItem('materialsRun_autoPlay', 'false');
        startGame('survival');
    });
    if (dom.startSpectateButton) {
        dom.startSpectateButton.addEventListener('click', () => {
    
            localStorage.setItem('lastPlayed_materialsRun', Date.now());
            localStorage.setItem('materialsRun_autoPlay', 'true');
            startGame('score'); // Spectate defaults to Score Attack
        });
    }
    dom.menuButton.addEventListener('click', goToStartScreen);
    dom.topScoresButton.addEventListener('click', showTopScores);
    dom.closeTopScoresButton.addEventListener('click', hideTopScores);

    goToStartScreen(); // Show the initial menu
    console.log("Initialization complete. Showing start screen.");
});

// --- Settings pause/resume ---
window.addEventListener('settingsOpened', () => {
    if (state.animationFrameId) cancelAnimationFrame(state.animationFrameId);
});
window.addEventListener('settingsClosed', () => {
    if (state.gameState === 'playing') state.animationFrameId = requestAnimationFrame(gameLoop);
});

// --- Register Settings Drawer Section ---
if (window.KamekoSettings) {
    window.KamekoSettings.registerWatchSection('materialsRun', {
        hasRevealHands: false
    });
}
