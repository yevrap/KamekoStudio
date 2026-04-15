// ═══════════════════════════════════════════════════════════════════════════
// MAIN — event wiring, start/restart, settings integration, tick orchestration
// ═══════════════════════════════════════════════════════════════════════════

import { state, newGame, getPlayer } from './state.js';
import {
  renderAll, hideOverlays, showGameOver, cacheDom,
  showPassDevice, hidePassDevice
} from './ui.js';
import {
  playAttack, playDefense, passAttack, declareTake,
  pileOnPass, checkGameOver, dealInitial, legalDefense, legalAttack
} from './gameplay.js';
import { scheduleAiAction, clearAiTimeout } from './ai.js';

// ── Persisted setup ────────────────────────────────────────────────────────

var savedMode  = localStorage.getItem('durak_mode') || 'ai';
if (savedMode !== 'ai' && savedMode !== 'hotseat') savedMode = 'ai';
var savedCount = parseInt(localStorage.getItem('durak_playerCount'), 10);
if (!(savedCount >= 2 && savedCount <= 6)) savedCount = 2;

var setupMode  = savedMode;
var setupCount = savedCount;

cacheDom();

var $modeToggle   = document.getElementById('mode-toggle');
var $countToggle  = document.getElementById('count-toggle');
var $btnPlay      = document.getElementById('btn-play');
var $btnReplay    = document.getElementById('btn-replay');
var $passOverlay  = document.getElementById('pass-device-overlay');
var $humanHand    = document.getElementById('human-hand');
var $humanOptions = document.getElementById('human-options');

function applyActive(container, attr, value) {
  var btns = container.querySelectorAll('[' + attr + ']');
  for (var i = 0; i < btns.length; i++) {
    btns[i].classList.toggle('active', btns[i].getAttribute(attr) === String(value));
  }
}

applyActive($modeToggle,  'data-mode',  setupMode);
applyActive($countToggle, 'data-count', setupCount);

$modeToggle.addEventListener('pointerdown', function (e) {
  var btn = e.target.closest('.mode-btn');
  if (!btn) return;
  e.preventDefault();
  setupMode = btn.dataset.mode;
  localStorage.setItem('durak_mode', setupMode);
  applyActive($modeToggle, 'data-mode', setupMode);
});

$countToggle.addEventListener('pointerdown', function (e) {
  var btn = e.target.closest('.count-btn');
  if (!btn) return;
  e.preventDefault();
  setupCount = parseInt(btn.dataset.count, 10);
  localStorage.setItem('durak_playerCount', String(setupCount));
  applyActive($countToggle, 'data-count', setupCount);
});

// ── Tick ───────────────────────────────────────────────────────────────────

function tick() {
  renderAll();
  if (checkGameOver()) {
    clearAiTimeout();
    showGameOver(state.winnerText);
    renderAll();
    return;
  }
  if (state.phase === 'passDevice') return;      // waiting on user tap
  if (state.phase === 'paused') return;
  if (state.phase !== 'playing' && state.phase !== 'pileOn') return;

  var p = getPlayer(state.prioritySeat);
  if (!p) return;
  if (p.isHuman) return;                          // human's turn — wait for input
  scheduleAiAction(state.prioritySeat, tick);
}

// Remember pre-pause phase so settings-close resumes into the same state.
var prevStatePhase = 'playing';

// Called after a human action mutates state. Transfers control to the next
// actor, inserting a pass-device cover if hot-seat play just moved between
// two different humans (3+ player tables only).
function handleAfterAction(actorSeat) {
  if (checkGameOver()) { tick(); return; }
  var canCover = state.mode === 'hotseat'
                && state.playerCount >= 3
                && (state.phase === 'playing' || state.phase === 'pileOn');
  if (!canCover) { tick(); return; }
  var next = getPlayer(state.prioritySeat);
  if (!next || !next.isHuman || state.prioritySeat === actorSeat) { tick(); return; }
  var resumePhase = state.phase;
  state.phase = 'passDevice';
  state.pendingReveal = { seat: state.prioritySeat, resumePhase: resumePhase };
  showPassDevice(next.name);
  renderAll();
}

// ── Overlay taps: pass-device cover ────────────────────────────────────────

$passOverlay.addEventListener('pointerdown', function (e) {
  e.preventDefault();
  if (state.phase !== 'passDevice') return;
  var resumePhase = (state.pendingReveal && state.pendingReveal.resumePhase) || 'playing';
  state.phase = resumePhase;
  state.pendingReveal = null;
  hidePassDevice();
  tick();
});

// ── Action buttons ─────────────────────────────────────────────────────────

$humanOptions.addEventListener('pointerdown', function (e) {
  var btn = e.target.closest('.action-btn');
  if (!btn || btn.classList.contains('hidden')) return;
  e.preventDefault();
  if (state.phase !== 'playing' && state.phase !== 'pileOn') return;
  var seat = parseInt(btn.dataset.seat, 10);
  if (!isFinite(seat)) return;
  if (state.prioritySeat !== seat) return;

  var action = btn.dataset.action;
  var ok = false;
  if (action === 'take') ok = declareTake(seat);
  else if (action === 'pass') ok = passAttack(seat);
  else if (action === 'done') ok = pileOnPass(seat);
  if (!ok) return;
  handleAfterAction(seat);
});

// ── Hand tap / drag-to-play ────────────────────────────────────────────────

var tapStart = null;
var TAP_MAX_DIST_SQ = 64;

$humanHand.addEventListener('pointerdown', function (e) {
  if (state.phase !== 'playing' && state.phase !== 'pileOn') return;
  var cardBtn = e.target.closest('.card-btn');
  if (!cardBtn) return;
  tapStart = {
    x: e.clientX, y: e.clientY, id: e.pointerId,
    cardId: cardBtn.dataset.cardId,
    seat: parseInt(cardBtn.dataset.seat, 10)
  };
});

$humanHand.addEventListener('pointerup', function (e) {
  if (!tapStart || e.pointerId !== tapStart.id) return;
  var start = tapStart;
  tapStart = null;
  if (state.phase !== 'playing' && state.phase !== 'pileOn') return;
  var dx = e.clientX - start.x;
  var dy = e.clientY - start.y;
  if (dx * dx + dy * dy > TAP_MAX_DIST_SQ) return;

  var seat = start.seat;
  if (!isFinite(seat)) return;
  if (state.prioritySeat !== seat) return;
  if (!getPlayer(seat) || !getPlayer(seat).isHuman) return;

  var card = null;
  var hand = getPlayer(seat).hand;
  for (var i = 0; i < hand.length; i++) if (hand[i].id === start.cardId) { card = hand[i]; break; }
  if (!card) return;

  var ok = false;
  if (seat === state.defenderSeat && state.phase === 'playing' && legalDefense(seat, card)) {
    ok = playDefense(seat, start.cardId);
  } else if (legalAttack(seat, card)) {
    ok = playAttack(seat, start.cardId);
  }
  if (!ok) return;
  handleAfterAction(seat);
});

$humanHand.addEventListener('pointercancel', function () { tapStart = null; });

// ── Start / restart ────────────────────────────────────────────────────────

function startGame() {
  clearAiTimeout();
  newGame(setupMode, setupCount);
  dealInitial();
  hideOverlays();
  // Hot-seat with 3+ players: show pass-device for the first human actor so no
  // one sees the others' hands during the opening tap. At 2-player hot-seat
  // this is skipped (matches the pre-Phase-2 UX).
  if (state.mode === 'hotseat' && state.playerCount >= 3) {
    state.phase = 'passDevice';
    state.pendingReveal = { seat: state.prioritySeat, resumePhase: 'playing' };
    showPassDevice(getPlayer(state.prioritySeat).name);
    renderAll();
  } else {
    tick();
  }
}

function spendTokenAndStart() {
  if (!window.KamekoTokens || !window.KamekoTokens.spend()) {
    if (window.KamekoTokens) window.KamekoTokens.toast();
    return;
  }
  localStorage.setItem('lastPlayed_durak', Date.now());
  startGame();
}

$btnPlay.addEventListener('pointerdown', function (e) {
  e.preventDefault();
  spendTokenAndStart();
});

$btnReplay.addEventListener('pointerdown', function (e) {
  e.preventDefault();
  spendTokenAndStart();
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
  label.textContent = 'Current Game';
  sec.appendChild(label);

  var info = document.createElement('div');
  info.className = 'settings-info';
  var modeName = state.mode === 'hotseat' ? 'Hot-seat' : 'vs Computer';
  info.textContent = modeName + ' \u2014 ' + state.playerCount + ' players';
  sec.appendChild(info);

  var hint = document.createElement('div');
  hint.className = 'settings-hint';
  hint.textContent = 'Change mode / player count on the start screen.';
  sec.appendChild(hint);

  if (devSection) panel.insertBefore(sec, devSection);
  else panel.appendChild(sec);
}

window.addEventListener('settingsOpened', function () {
  clearAiTimeout();
  if (state.phase === 'playing' || state.phase === 'pileOn' || state.phase === 'passDevice') {
    prevStatePhase = state.phase;
    state.phase = 'paused';
  }
  renderAll();
  injectDurakSettings();
});

window.addEventListener('settingsClosed', function () {
  var sec = document.getElementById('durak-settings');
  if (sec) sec.remove();
  if (state.phase === 'paused') {
    state.phase = prevStatePhase || 'playing';
    tick();
  }
});

// ── iOS bfcache ────────────────────────────────────────────────────────────

window.addEventListener('pageshow', function (e) { if (e.persisted) renderAll(); });

// Initial render (start overlay is already visible in HTML).
renderAll();
