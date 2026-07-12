import { state, dom } from './state.js';
import { init, animate, pushBlobsTowardsCenter, handlePointerDown, handlePointerMove, handlePointerUp } from './gameplay.js';

console.log("Script start");

dom.canvas = document.getElementById('gameCanvas');
dom.ctx = dom.canvas.getContext('2d');
dom.pushButton = document.getElementById('pushBtn');

if (!dom.ctx) {
    console.error("Fatal Error: Failed to get 2D context for canvas.");
    const errorDiv = document.createElement('div');
    errorDiv.textContent = "Error: Could not initialize graphics.";
    errorDiv.style.cssText = "color:red; position:absolute; top:50%; left:50%; transform:translate(-50%, -50%);";
    document.body.appendChild(errorDiv);
} else if (!dom.pushButton) {
    console.error("Fatal Error: Could not find push button element.");
} else {
    console.log("Canvas context and button obtained successfully.");

    // --- Event Listeners ---
    window.addEventListener('resize', init); // Use init on resize
    dom.pushButton.addEventListener('click', pushBlobsTowardsCenter);
    dom.pushButton.addEventListener('touchstart', (e) => { e.preventDefault(); pushBlobsTowardsCenter(); }, { passive: false });

    // --- Attach Listeners ---
    dom.canvas.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        dom.canvas.setPointerCapture(e.pointerId);
        handlePointerDown(e.pointerId, e.clientX, e.clientY);
    });
    dom.canvas.addEventListener('pointermove', (e) => {
        e.preventDefault();
        handlePointerMove(e.pointerId, e.clientX, e.clientY);
    });
    dom.canvas.addEventListener('pointerup', (e) => {
        e.preventDefault();
        if (!state.isGameOver) { handlePointerUp(e.pointerId); }
        else { state.touchPoints = []; }
    });
    dom.canvas.addEventListener('pointercancel', (e) => {
        e.preventDefault();
        if (!state.isGameOver) { handlePointerUp(e.pointerId); }
        else { state.touchPoints = []; }
    });

    // --- Settings pause/resume ---
    window.addEventListener('settingsOpened', () => {
        if (state.animationFrameId) cancelAnimationFrame(state.animationFrameId);
    });
    window.addEventListener('settingsClosed', () => {
        if (!state.isGameOver) { state.lastTime = performance.now(); state.animationFrameId = requestAnimationFrame(animate); }
    });

    // --- Start ---
    init(); // Initial call
}

function injectBlobZapperSettings() {
    if (!window.KamekoSettings) return;
    window.KamekoSettings.registerWatchSection('blobZapper', {
        hasRevealHands: false
    });
}

injectBlobZapperSettings();

const btnWatch = document.getElementById('btn-watch');
if (btnWatch) {
    btnWatch.addEventListener('click', () => {
        localStorage.setItem('blobZapper_autoPlay', 'true');
        init(); // Restart game in auto-play
    });
}
