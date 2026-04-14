// ─── Input — T9, keyboard, answer handling, input display, tower strip ────────

import { state } from './state.js';
import { T9_MAP, T9_KEYS, TTYPES } from './constants.js';
import { floatText } from './fx.js';
import { placeTower, upgradeRandom } from './gameplay.js';

// ─── T9 scroll helpers ────────────────────────────────────────────────────────

export function autoFillScrollSpecials() {
  if (!state.currentPair) return;
  const v = state.currentPair.v;
  while (state.t9buf.length < v.length && !/[a-z0-9]/i.test(v[state.t9buf.length])) {
    state.t9buf += v[state.t9buf.length];
  }
  updateInputDisplay();
}

function confirmScrollChar() {
  if (!state.t9pend) return;
  state.t9buf += state.t9pend; state.t9pend = ''; state.t9pendKey = ''; state.t9pendIdx = 0;
  autoFillScrollSpecials();
}

function flashInputError() {
  const el = document.getElementById('input-display');
  const meta = document.getElementById('predict-meta');
  el.style.color = '#ff4466';
  el.style.textShadow = '0 0 14px #ff4466';
  if (meta) { meta.textContent = 'wrong key'; meta.style.color = '#ff4466'; }
  setTimeout(() => {
    el.style.color = '';
    el.style.textShadow = '';
    if (meta) { meta.textContent = ''; meta.style.color = ''; }
  }, 350);
}

// ─── T9 key handler ───────────────────────────────────────────────────────────

export function handleT9(key) {
  if (state.gameState !== 'playing') return;

  if (key === 'back') {
    clearTimeout(state.t9timer);
    if (state.inputMode === 'scroll') {
      if (state.t9pend) { state.t9pend = ''; state.t9pendKey = ''; state.t9pendIdx = 0; }
      else if (state.t9buf.length > 0) {
        while (state.t9buf.length > 0 && !/[a-z0-9]/i.test(state.t9buf[state.t9buf.length - 1])) {
          state.t9buf = state.t9buf.slice(0, -1);
        }
        if (state.t9buf.length > 0) state.t9buf = state.t9buf.slice(0, -1);
      }
      autoFillScrollSpecials();
    } else if (state.inputMode === 'predict' && state.currentPair && state.t9pos > 0) {
      const v = state.currentPair.v;
      let pos = state.t9pos;
      while (pos > 0 && !/[a-z0-9]/i.test(v[pos - 1])) pos--;
      if (pos > 0) pos--;
      state.t9pos = pos;
    }
    updateInputDisplay(); return;
  }

  if (key === 'ok') {
    if (state.inputMode === 'scroll') {
      clearTimeout(state.t9timer); confirmScrollChar();
      if (state.t9buf.length > 0) { submitAnswer(state.t9buf); }
      else flashInputError();
    } else if (state.inputMode === 'predict') {
      if (state.currentPair && state.t9pos >= state.currentPair.v.length) submitAnswer(state.currentPair.v);
      else flashInputError();
    }
    updateInputDisplay(); return;
  }

  if (state.inputMode === 'scroll') {
    if (/^[0-9]$/.test(key)) {
      const currentPos = state.t9buf.length + (state.t9pend ? 1 : 0);
      const expectedAtPos = state.currentPair?.v[currentPos];
      if (state.numericMode || !T9_MAP[key] || /^[0-9]$/.test(expectedAtPos)) {
        clearTimeout(state.t9timer); confirmScrollChar();
        state.t9buf += key; autoFillScrollSpecials(); return;
      }
    }
    const letters = T9_MAP[key];
    if (!letters || letters.length === 0) return;
    clearTimeout(state.t9timer);
    if (state.t9pendKey === key) {
      state.t9pendIdx = (state.t9pendIdx + 1) % (letters.length + 1);
      state.t9pend = state.t9pendIdx === letters.length ? key : letters[state.t9pendIdx].toUpperCase();
    } else {
      confirmScrollChar(); state.t9pendKey = key; state.t9pendIdx = 0; state.t9pend = letters[0].toUpperCase();
    }
    state.t9timer = setTimeout(confirmScrollChar, 820);
    updateInputDisplay();
  } else if (state.inputMode === 'predict') {
    if (!state.currentPair) return;
    const v = state.currentPair.v;
    if (state.t9pos >= v.length) return;
    const expected = v[state.t9pos].toLowerCase();
    const isDigit = /^[0-9]$/.test(expected);
    const correct = isDigit
      ? (key === expected)
      : (T9_MAP[key] || []).includes(expected);
    if (correct) {
      state.t9pos++;
      while (state.t9pos < v.length && !/[a-z0-9]/i.test(v[state.t9pos])) state.t9pos++;
      updateInputDisplay();
    } else {
      flashInputError();
    }
  }
}

// ─── Input display ────────────────────────────────────────────────────────────

export function updateInputDisplay() {
  const el = document.getElementById('input-display');
  const meta = document.getElementById('predict-meta');
  if (state.inputMode === 'scroll') {
    if (state.numericMode) {
      const expected = state.currentPair ? state.currentPair.v.length : 1;
      let display = state.t9buf;
      for (let i = state.t9buf.length; i < expected; i++) display += '_';
      el.textContent = display || '_';
      if (meta) meta.textContent = '[123]';
    } else {
      if (state.currentPair) {
        const v = state.currentPair.v.toUpperCase();
        let display = '';
        for (let i = 0; i < v.length; i++) {
          if (i < state.t9buf.length) {
            display += state.t9buf[i];
          } else if (state.t9pend && i === state.t9buf.length) {
            display += '[' + state.t9pend + ']';
          } else {
            display += /[A-Z0-9]/.test(v[i]) ? '_' : v[i];
          }
        }
        el.textContent = display;
      } else {
        el.textContent = (state.t9buf + (state.t9pend ? '['+state.t9pend+']' : '')) || '▶';
      }
      if (meta) meta.textContent = '';
    }
  } else if (state.inputMode === 'predict') {
    if (!state.currentPair) {
      el.textContent = '▶'; if (meta) meta.textContent = ''; return;
    }
    const v = state.currentPair.v.toUpperCase();
    let display = '';
    for (let i = 0; i < v.length; i++) {
      display += i < state.t9pos ? v[i] : (/[A-Z0-9]/.test(v[i]) ? '_' : v[i]);
    }
    el.textContent = display;
    if (meta) meta.textContent = '';
  } else {
    const ki = document.getElementById('keyboard-input');
    const val = ki.value;
    if (!state.currentPair) {
      el.textContent = val || '▶'; if (meta) meta.textContent = ''; return;
    }
    const v = state.currentPair.v.toUpperCase();
    let display = '';
    let ci = 0;
    for (let i = 0; i < v.length; i++) {
      if (/[A-Z0-9]/.test(v[i])) {
        display += ci < val.length ? val[ci++].toUpperCase() : '_';
      } else {
        display += v[i];
      }
    }
    el.textContent = display || '▶';
    const fb = document.getElementById('keyboard-focus-btn');
    if (fb) fb.textContent = val ? 'typing... ▸' : 'Tap to type ▸';
    if (meta) meta.textContent = '';
  }
}

// ─── Hint ─────────────────────────────────────────────────────────────────────

export function showHint() {
  if (!state.currentPair || state.hintUsed) return;
  state.hintUsed = true;
  if (!state.chillMode) { state.streak = 0; updateStreakDisplay(); }
  const el = document.getElementById('hint-text');
  el.textContent = '→ ' + state.currentPair.v;
  el.classList.add('visible');
  document.getElementById('btn-hint').classList.add('used');
  setTimeout(() => { el.classList.remove('visible'); }, 2500);
}

// ─── Answer handling ──────────────────────────────────────────────────────────

export function showNextPrompt() {
  if (!state.deck.length) return;
  state.currentPair = state.deck[state.deckIdx % state.deck.length]; state.deckIdx++;
  state.numericMode = /^\d+$/.test(state.currentPair.v);
  document.getElementById('question-text').textContent = state.currentPair.k;
  state.t9buf = ''; state.t9pend = ''; state.t9pendKey = ''; state.t9pendIdx = 0; state.t9pos = 0;
  if (state.inputMode === 'predict' && state.currentPair) {
    const v = state.currentPair.v;
    while (state.t9pos < v.length && !/[a-z0-9]/i.test(v[state.t9pos])) state.t9pos++;
  }
  if (state.inputMode === 'scroll') autoFillScrollSpecials();
  if (state.inputMode === 'keyboard') { const ki = document.getElementById('keyboard-input'); if (ki) ki.value = ''; }
  state.hintUsed = false;
  document.getElementById('btn-hint').classList.remove('used');
  const ht = document.getElementById('hint-text');
  ht.classList.remove('visible'); ht.textContent = '';
  updateInputDisplay();
  if (state.inputMode === 'keyboard') setTimeout(() => document.getElementById('keyboard-input').focus(), 50);
}

export function buildKeyboardAnswer(typed) {
  if (!state.currentPair) return typed;
  const v = state.currentPair.v;
  let result = '';
  let ti = 0;
  for (let i = 0; i < v.length; i++) {
    if (/[a-z0-9]/i.test(v[i])) {
      result += ti < typed.length ? typed[ti++] : '\x00';
    } else {
      result += v[i];
    }
  }
  return result;
}

export function submitAnswer(raw) {
  if (!state.currentPair) return;
  const ans = raw.trim().toLowerCase();
  const correct = ans === state.currentPair.v.toLowerCase();
  if (correct) {
    state.streak++; state.correctW++; state.answerCount++;
    placeTower(typeForStreak(state.streak)); // typeForStreak: global from shared/utils.js
    floatText(state.W/2, state.pathCY - state.pathRY - 20, '✓ '+state.currentPair.v, '#44ffaa');
    if (state.answerCount % 10 === 0) upgradeRandom();
    updateStreakDisplay();
    state.t9buf = ''; state.t9pend = ''; state.t9pendKey = ''; state.t9pendIdx = 0; state.t9pos = 0;
    showNextPrompt();
  } else {
    state.streak = 0; state.wrongW++;
    updateStreakDisplay();
    flashEl('rgba(255,50,50,0.14)');
    state.t9pend = ''; state.t9pendKey = ''; state.t9pendIdx = 0;
    updateInputDisplay();
    if (navigator.vibrate) navigator.vibrate([50,30,50]);
  }
}

function flashEl(bg) {
  const el = document.getElementById('feedback-flash');
  el.style.background = bg; el.style.opacity = '1';
  setTimeout(() => { el.style.opacity = '0'; }, 280);
}

export function updateStreakDisplay() {
  document.getElementById('streak-display').textContent = state.streak >= 3 ? '⚡ ×'+state.streak : '';
  updateTowerStrip();
}

export function buildTowerStrip() {
  const strip = document.getElementById('tower-strip');
  strip.innerHTML = '';
  TTYPES.forEach((tt, i) => {
    const chip = document.createElement('div');
    chip.className = 'tc'; chip.id = 'tc-' + i;
    const dot = document.createElement('div');
    dot.className = 'tc-dot'; dot.style.background = tt.color;
    const name = document.createElement('div');
    name.className = 'tc-name'; name.textContent = tt.name;
    const req = document.createElement('div');
    req.className = 'tc-req'; req.id = 'tc-req-' + i;
    req.textContent = tt.streak > 0 ? '×'+tt.streak+' streak' : 'default';
    chip.appendChild(dot); chip.appendChild(name); chip.appendChild(req);
    strip.appendChild(chip);
  });
  updateTowerStrip();
}

export function updateTowerStrip() {
  const ti = typeForStreak(state.streak); // typeForStreak: global from shared/utils.js
  TTYPES.forEach((tt, i) => {
    const chip = document.getElementById('tc-' + i);
    if (!chip) return;
    chip.classList.toggle('active', i === ti);
    const isNext = i === ti + 1;
    chip.classList.toggle('next-up', isNext && i < TTYPES.length);
    const req = document.getElementById('tc-req-' + i);
    if (!req) return;
    if (i === ti) {
      req.textContent = ti === TTYPES.length - 1 ? 'max!' : 'active';
    } else if (i < ti) {
      req.textContent = '✓ done';
    } else if (isNext) {
      req.textContent = (tt.streak - state.streak) + ' more';
    } else {
      req.textContent = '×'+tt.streak+' streak';
    }
  });
}

// ─── Input mode switching ─────────────────────────────────────────────────────

export function setInputMode(mode) {
  clearTimeout(state.t9timer); state.t9timer = null;

  let progress = 0;
  const ki = document.getElementById('keyboard-input');
  if (state.currentPair) {
    if (state.inputMode === 'scroll') {
      const matchesPrefix = state.currentPair.v.toLowerCase().startsWith(state.t9buf.toLowerCase());
      progress = matchesPrefix ? state.t9buf.length : 0;
    } else if (state.inputMode === 'predict') {
      progress = state.t9pos;
    } else if (state.inputMode === 'keyboard') {
      const typed = ki.value.toLowerCase();
      const ans = state.currentPair.v.toLowerCase();
      progress = (ans.startsWith(typed) && typed.length > 0) ? typed.length : 0;
    }
  }

  state.t9pend = ''; state.t9pendKey = ''; state.t9pendIdx = 0;

  if (mode === 'scroll') {
    state.t9buf = state.currentPair ? state.currentPair.v.slice(0, progress) : '';
    state.t9pos = 0;
    ki.value = '';
    autoFillScrollSpecials();
  } else if (mode === 'predict') {
    state.t9buf = '';
    state.t9pos = progress;
    if (state.t9pos === 0 && state.currentPair) {
      const v = state.currentPair.v;
      while (state.t9pos < v.length && !/[a-z0-9]/i.test(v[state.t9pos])) state.t9pos++;
    }
    ki.value = '';
  } else if (mode === 'keyboard') {
    const prefix = state.currentPair ? state.currentPair.v.slice(0, progress) : '';
    ki.value = prefix.replace(/[^a-z0-9]/gi, '');
    state.t9buf = ''; state.t9pos = 0;
  }

  state.inputMode = mode;
  localStorage.setItem('keypadQuest_inputMode', mode);

  const pad = document.getElementById('t9-pad');
  const kw = document.getElementById('keyboard-wrap');
  if (mode === 'keyboard') {
    pad.style.display = 'none'; kw.style.display = '';
    if (state.gameState === 'playing') setTimeout(() => ki.focus(), 50);
  } else {
    pad.style.display = ''; kw.style.display = 'none';
  }
  document.querySelectorAll('.mode-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.mode === mode));

  updateInputDisplay();
}

export function buildT9Pad() {
  const pad = document.getElementById('t9-pad');
  pad.innerHTML = '';
  for (const key of T9_KEYS) {
    const btn = document.createElement('button');
    btn.className = 't9-key' + (key.a ? ' ak' : '');
    if (key.id) btn.id = key.id;
    btn.innerHTML = '<span class="kn">'+key.n+'</span>' + (key.l ? '<span class="kl">'+key.l+'</span>' : '');
    const k = key.a || key.n;
    btn.addEventListener('pointerdown', e => { e.preventDefault(); btn.classList.add('pressed'); handleT9(k); });
    btn.addEventListener('pointerup',    () => btn.classList.remove('pressed'));
    btn.addEventListener('pointerleave', () => btn.classList.remove('pressed'));
    pad.appendChild(btn);
  }
}
