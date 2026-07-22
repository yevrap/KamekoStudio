// Maze Warden — boot, DOM wiring, input listeners, shared-infrastructure integration.

import { state, dom, initMeta, initSpeedIndex } from './state.js';
import {
  resetGame, resizeCanvas, updateSpeedBtn, renderTowerLegend, loop,
  handleBoardTap, handleSheetBackdropClick, closeSheet, handleSpeedBtnClick,
  pauseGame, resumeGame, openHelp, closeHelp,
  openMirror, closeMirror, startWave, setGameOverHook
} from './gameplay.js';

var LS_LAST_PLAYED = 'lastPlayed_mazeWarden';
var LS_BEST_WAVE = 'mazeWarden_bestWave';

function bestWave() {
  var v = localStorage.getItem(LS_BEST_WAVE);
  return v === null ? 0 : parseInt(v, 10);
}
setGameOverHook(function (waveReached) {
  if (waveReached > bestWave()) localStorage.setItem(LS_BEST_WAVE, String(waveReached));
});

// ------------------------------------------------------------------
// DOM element grabbing
// ------------------------------------------------------------------
dom.canvas = document.getElementById('board');
dom.ctx = dom.canvas.getContext('2d');
dom.boardWrap = document.getElementById('boardWrap');
dom.goldVal = document.getElementById('goldVal');
dom.hpVal = document.getElementById('hpVal');
dom.hpBarInner = document.getElementById('hpBarInner');
dom.waveVal = document.getElementById('waveVal');
dom.startWaveBtn = document.getElementById('startWaveBtn');
dom.waveProgress = document.getElementById('waveProgress');
dom.waveProgressInner = document.getElementById('waveProgressInner');
dom.waveStatusText = document.getElementById('waveStatusText');
dom.speedBtn = document.getElementById('speedBtn');
dom.toastEl = document.getElementById('toast');
dom.sheetBackdrop = document.getElementById('sheetBackdrop');
dom.sheet = document.getElementById('sheet');
dom.sheetTitle = document.getElementById('sheetTitle');
dom.sheetRow = document.getElementById('sheetRow');
dom.sheetCancel = document.getElementById('sheetCancel');
dom.pauseOverlay = document.getElementById('pauseOverlay');
dom.howtoOverlay = document.getElementById('howtoOverlay');
dom.gameoverOverlay = document.getElementById('gameoverOverlay');
dom.mirrorOverlay = document.getElementById('mirrorOverlay');
dom.mirrorNodesEl = document.getElementById('mirrorNodes');
dom.mirrorEssenceEl = document.getElementById('mirrorEssence');
dom.towerLegendEl = document.getElementById('towerLegend');
dom.goWave = document.getElementById('goWave');
dom.goStats = document.getElementById('goStats');
dom.goEssence = document.getElementById('goEssence');

// ------------------------------------------------------------------
// Input
// ------------------------------------------------------------------
dom.canvas.addEventListener('pointerdown', function (ev) { handleBoardTap(ev.clientX, ev.clientY); });
dom.sheetBackdrop.addEventListener('click', handleSheetBackdropClick);
dom.sheetCancel.addEventListener('click', closeSheet);
dom.startWaveBtn.addEventListener('click', startWave);

document.getElementById('pauseBtn').addEventListener('click', pauseGame);
document.getElementById('resumeBtn').addEventListener('click', resumeGame);
document.getElementById('helpBtn').addEventListener('click', openHelp);
document.getElementById('howtoCloseBtn').addEventListener('click', closeHelp);
dom.howtoOverlay.addEventListener('click', function (ev) {
  if (ev.target === dom.howtoOverlay) closeHelp();
});
dom.speedBtn.addEventListener('click', handleSpeedBtnClick);
document.getElementById('mirrorBtn').addEventListener('click', function () { openMirror(false); });
document.getElementById('mirrorCloseBtn').addEventListener('click', closeMirror);
document.getElementById('goMirrorBtn').addEventListener('click', function () { openMirror(true); });
document.getElementById('restartBtn').addEventListener('click', function () {
  dom.gameoverOverlay.classList.remove('show');
  resetGame();
});

window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', function () { setTimeout(resizeCanvas, 60); });

// ------------------------------------------------------------------
// Settings integration — mirrors black-hole-in-one's approach (state.paused is
// already the loop's single pause gate; the RAF loop keeps running and drawing
// regardless, per this game's own pause/resume design). Only auto-resumes if
// settings is what caused the pause, so a manual ⏸ before opening settings
// stays paused after closing it.
// ------------------------------------------------------------------
var pausedBySettings = false;
window.addEventListener('settingsOpened', function () {
  if (state.phase !== 'gameover' && !state.paused) {
    pausedBySettings = true;
    state.paused = true;
  }
});
window.addEventListener('settingsClosed', function () {
  if (pausedBySettings) {
    state.paused = false;
    pausedBySettings = false;
  }
});

// ------------------------------------------------------------------
// Boot
// ------------------------------------------------------------------
localStorage.setItem(LS_LAST_PLAYED, String(Date.now()));
initMeta();
initSpeedIndex();
resetGame();
resizeCanvas();
updateSpeedBtn();
renderTowerLegend();
requestAnimationFrame(loop);
openHelp();
