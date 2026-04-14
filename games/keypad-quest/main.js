// ─── Main — startGame, event wiring, settings integration, init ───────────────

import { state } from './state.js';
import { TR } from './constants.js';
import { loadDecks, buildActiveDeck, updateMenuPlayBtn, showDeckSelector, hideDeckSelector, showDeckManager, hideDeckManager, showNewDeckForm, showImportTextarea, doImport, showImportPrompt, hideImportPrompt, renderDeckSelector } from './deck-manager.js';
import { resizeCanvas, startLoop } from './rendering.js';
import { startWave, showMenu, clearCP, loadCP, makeTower, getBT } from './gameplay.js';
import { buildT9Pad, buildTowerStrip, setInputMode, updateInputDisplay, updateStreakDisplay, showNextPrompt, handleT9, submitAnswer, buildKeyboardAnswer, showHint } from './input.js';

// ─── Start / continue game ────────────────────────────────────────────────────

function startGame(mode, fromCP) {
  if (!window.KamekoTokens || !window.KamekoTokens.spend()) {
    if (window.KamekoTokens) window.KamekoTokens.toast();
    return;
  }
  localStorage.setItem('lastPlayed_keypadQuest', Date.now());
  state.chillMode = (mode === 'chill');

  const activePairs = buildActiveDeck();
  if (activePairs.length === 0) {
    window.KamekoTokens && window.KamekoTokens.add(1);
    alert('No pairs selected! Choose at least one deck from "Choose Decks".');
    return;
  }
  state.deck = shuffle(activePairs.slice()); // shuffle: global from shared/utils.js

  state.deckIdx = 0; state.answerCount = 0; state.streak = 0; state.score = 0; state.currentPair = null;
  document.getElementById('menu-overlay').classList.add('hidden');
  for (const s of state.slots) { s.occupied = false; s.tower = null; }
  state.towers = [];

  if (fromCP) {
    const cp = loadCP();
    if (cp) {
      state.score = cp.score || 0;
      if (cp.towers) {
        for (const td of cp.towers) {
          if (td.si >= 0 && td.si < state.slots.length) {
            const s = state.slots[td.si]; s.occupied = true;
            const t = makeTower(s, td.ti); t.lv = td.lv;
            s.tower = t; state.towers.push(t);
          }
        }
      }
      startWave(cp.wave + 1);
      if (!state.currentPair) showNextPrompt();
      state.gameState = 'playing';
      updateStreakDisplay(); updateInputDisplay(); return;
    }
  }
  clearCP();
  startWave(1);
  if (!state.currentPair) showNextPrompt();
  state.gameState = 'playing';
  updateStreakDisplay(); updateInputDisplay();
}

// ─── Event handlers ───────────────────────────────────────────────────────────

// Canvas — tower selection & move
state.canvas.addEventListener('pointerdown', e => {
  if (state.gameState !== 'playing' && state.gameState !== 'paused') return;
  const rect = state.canvas.getBoundingClientRect();
  const cx = (e.clientX - rect.left) * (state.W / rect.width);
  const cy = (e.clientY - rect.top) * (state.H / rect.height);
  for (const t of state.towers) {
    if (Math.hypot(cx - t.slot.x, cy - t.slot.y) < TR + 8) {
      state.selectedTower = (state.selectedTower === t) ? null : t; return;
    }
  }
  if (state.selectedTower) {
    for (const s of state.slots) {
      if (s.occupied) continue;
      if (Math.hypot(cx - s.x, cy - s.y) < TR + 10) {
        state.selectedTower.slot.occupied = false; state.selectedTower.slot.tower = null;
        s.occupied = true; s.tower = state.selectedTower; state.selectedTower.slot = s; state.selectedTower = null; return;
      }
    }
    state.selectedTower = null;
  }
});

// Keyboard shortcuts (physical keyboard → T9)
window.addEventListener('keydown', e => {
  if (state.gameState !== 'playing' || state.inputMode === 'keyboard') return;
  if (e.key === 'Backspace') { handleT9('back'); e.preventDefault(); return; }
  if (e.key === 'Enter' || e.key === ' ') { handleT9('ok'); e.preventDefault(); return; }
  if (/^[0-9]$/.test(e.key)) { handleT9(e.key); e.preventDefault(); }
});

// Keyboard mode submit
document.getElementById('keyboard-submit').addEventListener('click', () => {
  const ki = document.getElementById('keyboard-input');
  const typed = ki.value; ki.value = '';
  submitAnswer(buildKeyboardAnswer(typed)); updateInputDisplay(); ki.focus();
});

document.getElementById('keyboard-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const typed = e.target.value; e.target.value = '';
    submitAnswer(buildKeyboardAnswer(typed)); updateInputDisplay(); e.target.focus();
  }
});

document.getElementById('keyboard-input').addEventListener('input', () => {
  const ki = document.getElementById('keyboard-input');
  const filtered = ki.value.replace(/[^a-z0-9]/gi, '');
  if (ki.value !== filtered) ki.value = filtered;
  updateInputDisplay();
});

document.getElementById('keyboard-focus-btn').addEventListener('pointerdown', e => {
  e.preventDefault();
  document.getElementById('keyboard-input').focus();
});

document.getElementById('input-area').addEventListener('pointerdown', () => {
  if (state.inputMode === 'keyboard') document.getElementById('keyboard-input').focus();
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && state.inputMode === 'keyboard' && state.gameState === 'playing') {
    setTimeout(() => document.getElementById('keyboard-input').focus(), 100);
  }
});

// Mode button clicks (delegated)
document.addEventListener('click', e => { const btn = e.target.closest('.mode-btn'); if (btn) setInputMode(btn.dataset.mode); });

// Menu buttons
document.getElementById('btn-play').addEventListener('click',          () => startGame('play', false));
document.getElementById('btn-chill').addEventListener('click',         () => startGame('chill', false));
document.getElementById('continue-btn').addEventListener('click',      () => startGame('play', true));
document.getElementById('btn-choose-decks').addEventListener('click',  showDeckSelector);
document.getElementById('btn-deck-mgr').addEventListener('click',      () => showDeckManager(null));

// Deck selector
document.getElementById('deck-selector-back').addEventListener('click', hideDeckSelector);
document.getElementById('btn-play-selected').addEventListener('click',  () => { hideDeckSelector(); startGame('play', false); });

// Deck manager
document.getElementById('deck-back').addEventListener('click', hideDeckManager);
document.getElementById('btn-new-deck').addEventListener('click',    showNewDeckForm);
document.getElementById('btn-import-deck').addEventListener('click', showImportTextarea);

// Import confirm/cancel
document.getElementById('btn-import-confirm').addEventListener('click', () => {
  doImport(state.pendingImport);
  hideImportPrompt();
  if (!document.getElementById('deck-overlay').classList.contains('hidden')) {
    // re-render deck manager list if it's open
    import('./deck-manager.js').then(m => m.renderDeckManagerList(null));
  }
});
document.getElementById('btn-import-cancel').addEventListener('click', hideImportPrompt);

// In-game buttons
document.getElementById('btn-hint').addEventListener('click', showHint);
document.getElementById('btn-skip').addEventListener('click', () => {
  if (state.gameState !== 'playing' || !state.currentPair) return;
  if (!state.chillMode) { state.streak = 0; updateStreakDisplay(); }
  state.floats.push({ x: state.pathCX, y: state.pathCY - 8, text: 'skipped', color: 'rgba(255,255,255,0.45)', a: 1, vy: -0.75 });
  showNextPrompt();
});

// ─── Settings integration ─────────────────────────────────────────────────────

function injectInputModeSection() {
  if (document.getElementById('kq-input-mode')) return;
  const panel = document.getElementById('settings-panel');
  if (!panel) return;
  const sec = document.createElement('div');
  sec.id = 'kq-input-mode';
  sec.style.cssText = 'padding:14px 4px 0; font-family:sans-serif;';
  const lbl = document.createElement('div');
  lbl.textContent = 'Input Mode';
  lbl.style.cssText = 'font-size:0.7em;color:rgba(255,255,255,0.35);letter-spacing:0.1em;margin-bottom:8px;';
  const row = document.createElement('div');
  row.style.cssText = 'display:flex; gap:6px; flex-wrap:wrap;';
  [['scroll','Tap to Spell'],['predict','T9 Smart'],['keyboard','Keyboard']].forEach(([mode, name]) => {
    const btn = document.createElement('button');
    btn.className = 'mode-btn';
    btn.dataset.mode = mode;
    btn.textContent = name;
    btn.classList.toggle('active', mode === state.inputMode);
    row.appendChild(btn);
  });
  sec.appendChild(lbl); sec.appendChild(row);
  const devSection = document.getElementById('dev-mode-section');
  if (devSection) panel.insertBefore(sec, devSection);
  else panel.appendChild(sec);
}

function injectGameStatsSection() {
  if (document.getElementById('kq-game-stats')) { updateGameStatsSection(); return; }
  const panel = document.getElementById('settings-panel');
  if (!panel) return;
  const sec = document.createElement('div');
  sec.id = 'kq-game-stats';
  sec.style.cssText = 'width:100%;max-width:300px;margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.1);';
  const title = document.createElement('div');
  title.style.cssText = 'font-size:0.7em;color:rgba(255,255,255,0.35);letter-spacing:0.1em;margin-bottom:6px;';
  title.textContent = 'CURRENT RUN';
  sec.appendChild(title);
  const statsWrap = document.createElement('div');
  statsWrap.id = 'kq-stats-rows';
  sec.appendChild(statsWrap);
  const quitBtn = document.createElement('button');
  quitBtn.className = 'mbtn dim center';
  quitBtn.style.cssText = 'margin-top:8px;max-width:300px;font-size:0.82em;';
  quitBtn.textContent = '← Back to Game Menu';
  quitBtn.addEventListener('click', () => {
    document.getElementById('kq-game-stats')?.remove();
    const closeBtn = document.querySelector('#settings-panel .settings-close, #settings-overlay .close-btn, button[aria-label="Close settings"]');
    if (closeBtn) closeBtn.click();
    showMenu();
  });
  sec.appendChild(quitBtn);
  const devSection = document.getElementById('dev-mode-section');
  if (devSection) panel.insertBefore(sec, devSection);
  else panel.appendChild(sec);
  updateGameStatsSection();
}

function updateGameStatsSection() {
  const rows = document.getElementById('kq-stats-rows');
  if (!rows) return;
  const acc = state.correctW + state.wrongW > 0 ? Math.round(state.correctW / (state.correctW + state.wrongW) * 100) : 100;
  const bms = getBT(state.wave);
  const data = [
    ['Wave', state.wave],
    ['Score', state.score],
    ['Accuracy', acc + '%'],
    ['Towers', state.towers.length + '/' + state.slots.length],
    ['Best time W' + state.wave, bms > 0 ? (bms / 1000).toFixed(1) + 's' : '—']
  ];
  rows.innerHTML = '';
  for (const [label, val] of data) {
    const r = document.createElement('div');
    r.className = 'srow';
    r.innerHTML = '<span class="slabel">' + label + '</span><span class="sval">' + val + '</span>';
    rows.appendChild(r);
  }
}

window.addEventListener('settingsOpened', () => {
  if (state.rafId) { cancelAnimationFrame(state.rafId); state.rafId = null; }
  if (state.gameState === 'playing') state.gameState = 'paused';
  injectInputModeSection();
  if (state.gameState === 'paused') injectGameStatsSection();
});

window.addEventListener('settingsClosed', () => {
  document.getElementById('kq-input-mode')?.remove();
  document.getElementById('kq-game-stats')?.remove();
  if (state.gameState === 'paused') state.gameState = 'playing';
  startLoop();
});

// ─── Init ─────────────────────────────────────────────────────────────────────

function init() {
  loadDecks();

  const raw = new URLSearchParams(location.search).get('import');
  if (raw) {
    try {
      const data = JSON.parse(atob(raw));
      if (data.name && Array.isArray(data.pairs) && data.pairs.length > 0) {
        state.pendingImport = data;
      }
    } catch(e) {}
    history.replaceState(null, '', location.pathname);
  }

  resizeCanvas();
  // Guard: if layout hasn't completed yet (canvas 0×0 on fast local servers),
  // retry once after the first paint so getBoundingClientRect returns real values.
  if (state.W === 0) requestAnimationFrame(() => resizeCanvas());
  buildT9Pad(); buildTowerStrip(); setInputMode(state.inputMode);
  showMenu(); startLoop();
  if (state.pendingImport) showImportPrompt(state.pendingImport);
}

window.addEventListener('resize', resizeCanvas);
window.addEventListener('pageshow', e => { if (e.persisted && state.gameState === 'menu') showMenu(); });

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
