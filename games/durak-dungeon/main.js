// ═══════════════════════════════════════════════════════════════════════════
// MAIN — event wiring, start/restart, settings integration, init
// ═══════════════════════════════════════════════════════════════════════════

import { state, newRun } from './state.js';
import { renderAll, showRelicTooltip } from './ui.js';
import { generateSeed } from './constants.js';
import {
  hideAllOverlays, startFloor, beginDefendPhase,
  handleDefend, handleAttack, handleTakeHit, handleEndAttack,
  handleShopClick, advanceFloor, endRun
} from './gameplay.js';

// ── DOM refs used only for event wiring ────────────────────────────────────

var $app            = document.getElementById('app');
var $btnTakeHit     = document.getElementById('btn-take-hit');
var $btnEndAttack   = document.getElementById('btn-end-attack');
var $shopOverlay    = document.getElementById('shop-overlay');
var $seedDisplay    = document.getElementById('seed-display');
var $gameoverSeed   = document.getElementById('gameover-seed');
var $seedInput      = document.getElementById('seed-input');
var $floorTransition     = document.getElementById('floor-transition');
var $floorTransitionText = document.getElementById('floor-transition-text');
var $enemyName           = document.getElementById('enemy-name');

// ── Start / restart ────────────────────────────────────────────────────────

function startGame() {
  var seedVal = $seedInput.value.trim().toUpperCase();
  if (!seedVal) seedVal = generateSeed();
  $seedInput.value = '';

  newRun(seedVal);
  hideAllOverlays();

  localStorage.setItem('lastPlayed_durakDungeon', String(Date.now()));
  state.run.phase = 'transition';

  $floorTransitionText.textContent = 'FLOOR 1';
  $floorTransition.classList.remove('hidden');
  $floorTransition.classList.remove('fading');
  $enemyName.textContent = '';
  renderAll();

  setTimeout(function () {
    $floorTransition.classList.add('fading');
    setTimeout(function () {
      $floorTransition.classList.add('hidden');
      startFloor();
    }, 300);
  }, 500);
}

// ── Event handlers ─────────────────────────────────────────────────────────

// Main game area — card and relic clicks
$app.addEventListener('pointerdown', function (e) {
  e.preventDefault();

  var relicSlot = e.target.closest('.relic-slot');
  if (relicSlot && relicSlot.dataset.relicIndex !== undefined) {
    showRelicTooltip(relicSlot);
    return;
  }

  var cardBtn = e.target.closest('#player-hand .card-btn');
  if (cardBtn) {
    var uid = cardBtn.dataset.uid;
    if (state.run.phase === 'defend') {
      handleDefend(uid);
    } else if (state.run.phase === 'attack') {
      handleAttack(uid);
    }
    return;
  }
});

// Take Hit button
$btnTakeHit.addEventListener('pointerdown', function (e) {
  e.preventDefault();
  handleTakeHit();
});

// End Attack button
$btnEndAttack.addEventListener('pointerdown', function (e) {
  e.preventDefault();
  handleEndAttack();
});

// Shop overlay
$shopOverlay.addEventListener('pointerdown', function (e) {
  e.preventDefault();
  handleShopClick(e);
});

// Shop continue
document.getElementById('btn-shop-continue').addEventListener('pointerdown', function (e) {
  e.preventDefault();
  $shopOverlay.classList.add('hidden');
  advanceFloor();
});

// Boss start
document.getElementById('btn-boss-start').addEventListener('pointerdown', function (e) {
  e.preventDefault();
  document.getElementById('boss-overlay').classList.add('hidden');
  beginDefendPhase();
});

// Seed display — copy on tap
$seedDisplay.addEventListener('pointerdown', function () {
  if (state.run && navigator.clipboard) {
    navigator.clipboard.writeText(state.run.seed);
  }
});

// Game over seed — copy on tap
$gameoverSeed.addEventListener('pointerdown', function () {
  if (state.run && navigator.clipboard) {
    navigator.clipboard.writeText(state.run.seed);
  }
});

// Play / Replay buttons (token gate)
document.getElementById('btn-play').addEventListener('pointerdown', function (e) {
  e.preventDefault();
  if (!window.KamekoTokens || !window.KamekoTokens.spend()) {
    if (window.KamekoTokens) window.KamekoTokens.toast();
    return;
  }
  startGame();
});

document.getElementById('btn-replay').addEventListener('pointerdown', function (e) {
  e.preventDefault();
  if (!window.KamekoTokens || !window.KamekoTokens.spend()) {
    if (window.KamekoTokens) window.KamekoTokens.toast();
    return;
  }
  startGame();
});

// ── URL seed parsing ───────────────────────────────────────────────────────

(function parseSeedFromUrl() {
  var params = new URLSearchParams(window.location.search);
  var seed = params.get('seed');
  if (seed) {
    $seedInput.value = seed.toUpperCase().slice(0, 8);
    history.replaceState(null, '', window.location.pathname);
  }
})();

// ── Settings integration ───────────────────────────────────────────────────

var pausedPhase = null;

function injectDungeonSettings() {
  if (document.getElementById('dungeon-settings')) return;
  var panel = document.getElementById('settings-panel');
  if (!panel) return;
  var devSection = document.getElementById('dev-mode-section');

  var sec = document.createElement('div');
  sec.id = 'dungeon-settings';
  sec.style.padding = '12px 16px';
  sec.style.borderBottom = '1px solid rgba(255,255,255,0.08)';

  if (state.run && state.run.phase !== 'title') {
    var label = document.createElement('div');
    label.style.cssText = 'font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);margin-bottom:8px';
    label.textContent = 'Current Run';
    sec.appendChild(label);

    var info = document.createElement('div');
    info.style.cssText = 'font-size:0.78rem;line-height:1.6;color:var(--text)';
    info.innerHTML =
      'Seed: <strong>' + state.run.seed + '</strong><br>' +
      'Floor: <strong>' + state.run.floor + '</strong><br>' +
      'HP: <strong>' + state.run.hp + '/' + state.run.maxHp + '</strong><br>' +
      'Gold: <strong>' + state.run.gold + '</strong><br>' +
      'Relics: <strong>' + state.run.relics.length + '/5</strong><br>' +
      'Deck: <strong>' + state.run.deck.length + ' cards</strong>';
    sec.appendChild(info);
  }

  if (devSection) panel.insertBefore(sec, devSection);
  else panel.appendChild(sec);
}

window.addEventListener('settingsOpened', function () {
  if (state.run && (state.run.phase === 'defend' || state.run.phase === 'attack')) {
    pausedPhase = state.run.phase;
    state.run.phase = 'paused';
  }
  injectDungeonSettings();
});

window.addEventListener('settingsClosed', function () {
  var el = document.getElementById('dungeon-settings');
  if (el) el.remove();
  if (pausedPhase) {
    state.run.phase = pausedPhase;
    pausedPhase = null;
    renderAll();
  }
});

// iOS bfcache
window.addEventListener('pageshow', function (e) {
  if (e.persisted && state.run) renderAll();
});
