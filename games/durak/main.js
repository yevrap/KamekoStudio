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

// Keep iOS PWA status-bar / Android theme-color in sync with the in-game
// light/dark toggle (settings.js mutates body.dark-mode without firing an event).
(function syncThemeColor() {
  var meta = document.querySelector('meta[name="theme-color"]:not([media])');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  function apply() {
    meta.setAttribute('content', document.body.classList.contains('dark-mode') ? '#070b08' : '#8ba994');
  }
  apply();
  new MutationObserver(apply).observe(document.body, { attributes: true, attributeFilter: ['class'] });
})();

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
  label.style.cssText = 'font-size:0.7em;color:rgba(255,255,255,0.5);letter-spacing:0.1em;text-transform:uppercase;font-family:sans-serif;margin-bottom:2px;';
  label.textContent = 'Current Match';
  sec.appendChild(label);

  var info = document.createElement('div');
  info.style.cssText = 'font-family:sans-serif;font-size:0.9em;';
  var modeName = state.mode === 'hotseat' ? 'Hot-seat' : 'vs Computer';
  info.textContent = modeName + ' \u2014 ' + state.playerCount + ' players';
  sec.appendChild(info);

  if (state.mode === 'ai') {
    var diffLabel = document.createElement('div');
    diffLabel.style.cssText = 'font-size:0.7em;color:rgba(255,255,255,0.5);letter-spacing:0.1em;text-transform:uppercase;font-family:sans-serif;margin-bottom:6px;margin-top:14px;';
    diffLabel.textContent = 'AI Difficulty (takes effect immediately)';
    sec.appendChild(diffLabel);

    var diffToggle = document.createElement('div');
    diffToggle.className = 'mode-toggle';
    
    var diffs = ['easy', 'normal', 'hard'];
    var diffNames = ['Easy', 'Normal', 'Hard'];
    var currentDiff = localStorage.getItem('durak_difficulty') || 'normal';
    
    for (var i = 0; i < diffs.length; i++) {
      (function(d, name) {
        var btn = document.createElement('button');
        btn.className = 'mode-btn' + (currentDiff === d ? ' active' : '');
        btn.type = 'button';
        btn.dataset.diff = d;
        btn.textContent = name;
        btn.addEventListener('click', function(e) {
          e.preventDefault();
          localStorage.setItem('durak_difficulty', d);
          var btns = diffToggle.querySelectorAll('.mode-btn');
          for (var j = 0; j < btns.length; j++) {
            btns[j].classList.toggle('active', btns[j].dataset.diff === d);
          }
        });
        diffToggle.appendChild(btn);
      })(diffs[i], diffNames[i]);
    }
    sec.appendChild(diffToggle);
  }

  var endRow = document.createElement('div');
  endRow.style.cssText = 'margin-top:24px;margin-bottom:8px;';
  var btnEnd = document.createElement('button');
  btnEnd.style.cssText = 'width:100%;height:44px;background:#e53935;color:#fff;border:none;border-radius:8px;font-size:0.95rem;font-weight:bold;cursor:pointer;font-family:sans-serif;transition:transform 0.1s;';
  btnEnd.textContent = 'End round & back to menu';
  btnEnd.addEventListener('pointerdown', function(e) {
    e.preventDefault();
    btnEnd.style.transform = 'scale(0.96)';
  });
  btnEnd.addEventListener('click', function(e) {
    e.preventDefault();
    btnEnd.style.transform = 'none';
    var closeBtn = document.getElementById('settings-close-btn');
    if (closeBtn) closeBtn.click();

    clearAiTimeout();
    state.phase = 'gameover'; // prevent background actions

    var startOverlay = document.getElementById('start-overlay');
    if (startOverlay) startOverlay.classList.remove('hidden');

    var gameoverOverlay = document.getElementById('gameover-overlay');
    if (gameoverOverlay) gameoverOverlay.classList.add('hidden');
  });
  endRow.appendChild(btnEnd);
  sec.appendChild(endRow);

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
