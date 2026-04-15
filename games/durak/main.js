// ═══════════════════════════════════════════════════════════════════════════
// MAIN — event wiring, start/restart, settings integration, AI orchestration
// ═══════════════════════════════════════════════════════════════════════════

import { state, newGame, setAiMode } from './state.js';
import { renderAll, hideOverlays, showGameOver, cacheDom } from './ui.js';
import { playCard, takeCards, passRound, checkGameOver, autoDrawBoth } from './gameplay.js';
import { scheduleAiAction, clearAiTimeout } from './ai.js';

// Initial AI mode from persisted setting (default = vs Computer)
state.aiMode = (localStorage.getItem('durak_mode') !== 'pvp');
setAiMode(state.aiMode);

cacheDom();

var $app           = document.getElementById('app');
var $modeToggle    = document.getElementById('mode-toggle');
var $btnPlay       = document.getElementById('btn-play');
var $btnReplay     = document.getElementById('btn-replay');

// ── Tick: re-render + check end + schedule AI if it's their turn ──────────

function tick() {
  renderAll();
  if (checkGameOver()) {
    clearAiTimeout();
    showGameOver(state.winnerText);
    renderAll();
    return;
  }
  if (state.aiMode && state.priority === 'top' && state.phase === 'playing') {
    scheduleAiAction(tick);
  }
}

// ── Mode toggle (start screen) ─────────────────────────────────────────────

function applyModeToggleActive(mode, container) {
  var btns = container.querySelectorAll('.mode-btn');
  for (var i = 0; i < btns.length; i++) {
    btns[i].classList.toggle('active', btns[i].dataset.mode === mode);
  }
}

function setMode(mode) {
  setAiMode(mode === 'ai');
  localStorage.setItem('durak_mode', state.aiMode ? 'ai' : 'pvp');
  applyModeToggleActive(mode, $modeToggle);
  var settingsToggle = document.querySelector('#durak-settings .mode-toggle');
  if (settingsToggle) applyModeToggleActive(mode, settingsToggle);
}

// Sync start-screen toggle with persisted state on load
applyModeToggleActive(state.aiMode ? 'ai' : 'pvp', $modeToggle);

$modeToggle.addEventListener('pointerdown', function (e) {
  var btn = e.target.closest('.mode-btn');
  if (!btn) return;
  e.preventDefault();
  setMode(btn.dataset.mode);
});

// ── Game-area pointer handling ─────────────────────────────────────────────

var tapStart = null;
var TAP_MAX_DIST_SQ = 64; // 8px threshold; anything larger = drag, not tap

$app.addEventListener('pointerdown', function (e) {
  if (state.phase !== 'playing') return;

  var actionBtn = e.target.closest('.action-btn');
  if (actionBtn) {
    var who = actionBtn.dataset.player;
    if (state.aiMode && who === 'top') return;
    var action = actionBtn.dataset.action;
    var ok = false;
    if (action === 'take') ok = takeCards(who);
    else if (action === 'pass') ok = passRound(who);
    if (ok) tick();
    return;
  }

  var cardBtn = e.target.closest('.card-btn');
  if (cardBtn && cardBtn.dataset.owner !== 'field') {
    tapStart = {
      x: e.clientX,
      y: e.clientY,
      id: e.pointerId,
      cardId: cardBtn.dataset.cardId,
      owner: cardBtn.dataset.owner
    };
  }
});

$app.addEventListener('pointerup', function (e) {
  if (!tapStart || e.pointerId !== tapStart.id) return;
  var start = tapStart;
  tapStart = null;
  if (state.phase !== 'playing') return;
  var dx = e.clientX - start.x;
  var dy = e.clientY - start.y;
  if (dx * dx + dy * dy > TAP_MAX_DIST_SQ) return;
  if (state.aiMode && start.owner === 'top') return;
  if (playCard(start.cardId, start.owner)) tick();
});

$app.addEventListener('pointercancel', function () {
  tapStart = null;
});

// ── Start / restart ────────────────────────────────────────────────────────

function startGame() {
  clearAiTimeout();
  newGame();
  autoDrawBoth();
  hideOverlays();
  tick();
}

$btnPlay.addEventListener('pointerdown', function (e) {
  e.preventDefault();
  if (!window.KamekoTokens || !window.KamekoTokens.spend()) {
    if (window.KamekoTokens) window.KamekoTokens.toast();
    return;
  }
  localStorage.setItem('lastPlayed_durak', Date.now());
  startGame();
});

$btnReplay.addEventListener('pointerdown', function (e) {
  e.preventDefault();
  if (!window.KamekoTokens || !window.KamekoTokens.spend()) {
    if (window.KamekoTokens) window.KamekoTokens.toast();
    return;
  }
  localStorage.setItem('lastPlayed_durak', Date.now());
  startGame();
});

// ── Settings panel integration ─────────────────────────────────────────────

function injectDurakSettings() {
  if (document.getElementById('durak-settings')) return;
  var panel = document.getElementById('settings-panel');
  if (!panel) return;
  var devSection = document.getElementById('dev-mode-section');

  var sec = document.createElement('div');
  sec.id = 'durak-settings';

  var label = document.createElement('div');
  label.className = 'settings-label';
  label.textContent = 'Game Mode';
  sec.appendChild(label);

  var toggle = document.createElement('div');
  toggle.className = 'mode-toggle';

  var btnAi = document.createElement('button');
  btnAi.type = 'button';
  btnAi.className = 'mode-btn' + (state.aiMode ? ' active' : '');
  btnAi.dataset.mode = 'ai';
  btnAi.textContent = 'vs Computer';

  var btnPvp = document.createElement('button');
  btnPvp.type = 'button';
  btnPvp.className = 'mode-btn' + (!state.aiMode ? ' active' : '');
  btnPvp.dataset.mode = 'pvp';
  btnPvp.textContent = 'vs Player';

  toggle.appendChild(btnAi);
  toggle.appendChild(btnPvp);
  sec.appendChild(toggle);

  toggle.addEventListener('pointerdown', function (e) {
    var btn = e.target.closest('.mode-btn');
    if (!btn) return;
    e.preventDefault();
    setMode(btn.dataset.mode);
  });

  if (devSection) panel.insertBefore(sec, devSection);
  else panel.appendChild(sec);
}

window.addEventListener('settingsOpened', function () {
  clearAiTimeout();
  if (state.phase === 'playing') state.phase = 'paused';
  renderAll();
  injectDurakSettings();
});

window.addEventListener('settingsClosed', function () {
  var sec = document.getElementById('durak-settings');
  if (sec) sec.remove();
  if (state.phase === 'paused') {
    state.phase = 'playing';
    tick();
  }
});

// ── iOS bfcache: keep status fresh on back-navigation ──────────────────────

window.addEventListener('pageshow', function (e) {
  if (e.persisted) renderAll();
});
