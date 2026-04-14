// ─── Deck Manager — storage, CRUD, selector UI, manager UI ───────────────────

import { state } from './state.js';
import { BUILTIN_DECKS } from './constants.js';

// ─── Storage ──────────────────────────────────────────────────────────────────

export function loadDecks() {
  // Migrate old single custom deck if present
  const old = localStorage.getItem('keypadQuest_customDeck');
  if (old) {
    try {
      const pairs = JSON.parse(old);
      if (pairs.length > 0) {
        const id = 'u-' + Date.now();
        const migrated = JSON.parse(localStorage.getItem('keypadQuest_decks') || '[]');
        if (!migrated.find(d => d.name === 'My Deck')) {
          migrated.unshift({ id, name: 'My Deck', pairs });
          localStorage.setItem('keypadQuest_decks', JSON.stringify(migrated));
        }
      }
    } catch(e) {}
    localStorage.removeItem('keypadQuest_customDeck');
  }
  try { state.userDecks = JSON.parse(localStorage.getItem('keypadQuest_decks') || '[]'); } catch(e) { state.userDecks = []; }
  try { state.activeDeckIds = JSON.parse(localStorage.getItem('keypadQuest_activeDeckIds') || 'null'); } catch(e) { state.activeDeckIds = null; }
  if (!state.activeDeckIds) state.activeDeckIds = BUILTIN_DECKS.map(d => d.id);
  updateMenuPlayBtn();
}

export function saveDecks() {
  localStorage.setItem('keypadQuest_decks', JSON.stringify(state.userDecks));
}

export function deckToShareUrl(deck) {
  const payload = btoa(JSON.stringify({ name: deck.name, pairs: deck.pairs }));
  return location.origin + location.pathname + '?import=' + payload;
}

export function saveActiveDeckIds() {
  localStorage.setItem('keypadQuest_activeDeckIds', JSON.stringify(state.activeDeckIds));
  updateMenuPlayBtn();
}

export function getAllDecks() {
  return [...BUILTIN_DECKS, ...state.userDecks];
}

export function buildActiveDeck() {
  const all = getAllDecks();
  const pairs = [];
  for (const id of state.activeDeckIds) {
    const d = all.find(x => x.id === id);
    if (d) pairs.push(...d.pairs);
  }
  return pairs;
}

export function activePairCount() { return buildActiveDeck().length; }
export function activeDeckCount() { return state.activeDeckIds.length; }

export function updateMenuPlayBtn() {
  const count = activePairCount();
  const deckCount = activeDeckCount();
  const btn = document.getElementById('btn-play');
  if (!btn) return;
  if (count === 0) {
    btn.textContent = '▶ Play — select a deck first';
    btn.disabled = true; btn.style.opacity = '0.4';
  } else {
    btn.textContent = '▶ Play — ' + count + ' pairs from ' + deckCount + ' deck' + (deckCount > 1 ? 's' : '');
    btn.disabled = false; btn.style.opacity = '';
  }
}

// ─── Import ───────────────────────────────────────────────────────────────────

export function showImportPrompt(data) {
  state.pendingImport = data;
  const overlay = document.getElementById('import-prompt-overlay');
  document.getElementById('import-deck-name').textContent = '"' + data.name + '"';
  document.getElementById('import-deck-meta').textContent = data.pairs.length + ' pairs';
  const existing = state.userDecks.find(d => d.name === data.name);
  const btn = document.getElementById('btn-import-confirm');
  btn.textContent = existing ? 'Replace "' + data.name + '"?' : 'Import as New Deck';
  overlay.style.display = 'flex';
}

export function hideImportPrompt() {
  document.getElementById('import-prompt-overlay').style.display = 'none';
  state.pendingImport = null;
}

export function doImport(data) {
  if (!data) return;
  const existingIdx = state.userDecks.findIndex(d => d.name === data.name);
  if (existingIdx >= 0) {
    state.userDecks[existingIdx].pairs = data.pairs;
  } else {
    state.userDecks.push({ id: 'u-' + Date.now(), name: data.name, pairs: data.pairs });
  }
  saveDecks();
  updateMenuPlayBtn();
}

// ─── Deck selector ────────────────────────────────────────────────────────────

export function showDeckSelector() {
  document.getElementById('deck-selector-overlay').classList.remove('hidden');
  renderDeckSelector();
}

export function hideDeckSelector() {
  document.getElementById('deck-selector-overlay').classList.add('hidden');
  updateMenuPlayBtn();
}

export function renderDeckSelector() {
  const list = document.getElementById('deck-selector-list');
  list.innerHTML = '';
  const allDecks = getAllDecks();
  allDecks.forEach(d => {
    const isBuiltin = d.id.startsWith('b-');
    const isSel = state.activeDeckIds.includes(d.id);
    const row = document.createElement('div');
    row.className = 'ds-row' + (isSel ? ' sel' : '');
    const check = document.createElement('div');
    check.className = 'ds-check'; check.textContent = isSel ? '✓' : '';
    const info = document.createElement('div');
    info.className = 'ds-info';
    const name = document.createElement('div');
    name.className = 'ds-name'; name.textContent = d.name;
    const meta = document.createElement('div');
    meta.className = 'ds-meta'; meta.textContent = d.pairs.length + ' pairs';
    info.appendChild(name); info.appendChild(meta);
    row.appendChild(check); row.appendChild(info);
    if (isBuiltin) {
      const badge = document.createElement('div');
      badge.className = 'ds-badge'; badge.textContent = '★ Built-in';
      row.appendChild(badge);
    } else {
      const editBtn = document.createElement('button');
      editBtn.className = 'ds-edit'; editBtn.textContent = '✏';
      editBtn.addEventListener('click', e => { e.stopPropagation(); hideDeckSelector(); showDeckManager(d.id); });
      row.appendChild(editBtn);
    }
    row.addEventListener('click', () => {
      const idx = state.activeDeckIds.indexOf(d.id);
      if (idx >= 0) state.activeDeckIds.splice(idx, 1);
      else state.activeDeckIds.push(d.id);
      saveActiveDeckIds(); renderDeckSelector();
    });
    list.appendChild(row);
  });
  const btn = document.getElementById('btn-play-selected');
  if (btn) {
    const count = activePairCount();
    btn.textContent = count > 0 ? '▶ Play Selected (' + count + ' pairs)' : 'Select at least one deck';
    btn.disabled = count === 0; btn.style.opacity = count === 0 ? '0.4' : '';
  }
}

// ─── Deck manager ─────────────────────────────────────────────────────────────

export function showDeckManager(focusDeckId) {
  document.getElementById('deck-overlay').classList.remove('hidden');
  document.getElementById('deck-new-form-wrap').style.display = 'none';
  document.getElementById('deck-new-form-wrap').innerHTML = '';
  document.getElementById('deck-import-wrap').style.display = 'none';
  document.getElementById('deck-import-wrap').innerHTML = '';
  renderDeckManagerList(focusDeckId);
}

export function hideDeckManager() {
  document.getElementById('deck-overlay').classList.add('hidden');
}

export function showImportTextarea() {
  const wrap = document.getElementById('deck-import-wrap');
  if (wrap.style.display !== 'none') { wrap.style.display = 'none'; wrap.innerHTML = ''; return; }
  document.getElementById('deck-new-form-wrap').style.display = 'none';
  document.getElementById('deck-new-form-wrap').innerHTML = '';
  const form = document.createElement('div');
  form.className = 'deck-form';
  const ta = document.createElement('textarea');
  ta.rows = 7;
  ta.placeholder = '# Deck Name\nquestion: answer\nquestion: answer';
  ta.style.cssText = 'width:100%;padding:10px 12px;font-size:0.82em;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:#fff;font-family:"Courier New",monospace;outline:none;resize:vertical;touch-action:auto;-webkit-user-select:auto;user-select:auto;';
  ta.addEventListener('focus', () => { ta.style.borderColor = 'rgba(0,255,238,0.5)'; });
  ta.addEventListener('blur',  () => { ta.style.borderColor = 'rgba(255,255,255,0.2)'; });
  const btns = document.createElement('div');
  btns.className = 'deck-form-btns';
  const importBtn = document.createElement('button');
  importBtn.className = 'save'; importBtn.textContent = 'Import Deck';
  importBtn.addEventListener('click', () => {
    const parsed = parsePlainText(ta.value); // global from shared/utils.js
    if (!parsed) { ta.style.borderColor = 'rgba(255,80,80,0.6)'; return; }
    doImport(parsed);
    wrap.style.display = 'none'; wrap.innerHTML = '';
    renderDeckManagerList(null);
  });
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'cancel'; cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', () => { wrap.style.display = 'none'; wrap.innerHTML = ''; });
  btns.appendChild(importBtn); btns.appendChild(cancelBtn);
  form.appendChild(ta); form.appendChild(btns);
  wrap.appendChild(form); wrap.style.display = '';
  setTimeout(() => ta.focus(), 80);
}

export function showNewDeckForm() {
  const iw = document.getElementById('deck-import-wrap');
  iw.style.display = 'none'; iw.innerHTML = '';
  const wrap = document.getElementById('deck-new-form-wrap');
  if (wrap.style.display !== 'none') { wrap.style.display = 'none'; wrap.innerHTML = ''; return; }
  const form = document.createElement('div');
  form.className = 'deck-form';
  const nameInput = document.createElement('input');
  nameInput.type = 'text'; nameInput.placeholder = 'Deck name (e.g. Spanish Words)';
  const btns = document.createElement('div');
  btns.className = 'deck-form-btns';
  const saveBtn = document.createElement('button');
  saveBtn.className = 'save'; saveBtn.textContent = 'Create Deck';
  saveBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    if (!name) { nameInput.style.borderColor = 'rgba(255,80,80,0.6)'; return; }
    const id = 'u-' + Date.now();
    state.userDecks.push({ id, name, pairs: [] });
    saveDecks(); wrap.style.display = 'none'; wrap.innerHTML = '';
    renderDeckManagerList(id);
  });
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'cancel'; cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', () => { wrap.style.display = 'none'; wrap.innerHTML = ''; });
  btns.appendChild(saveBtn); btns.appendChild(cancelBtn);
  form.appendChild(nameInput); form.appendChild(btns);
  wrap.appendChild(form); wrap.style.display = '';
  setTimeout(() => nameInput.focus(), 80);
}

export function renderDeckManagerList(openId) {
  const list = document.getElementById('deck-manager-list');
  list.innerHTML = '';
  if (state.userDecks.length === 0) {
    list.innerHTML = '<div style="color:rgba(255,255,255,0.35);font-size:0.85em;text-align:center;padding:20px 0;">No custom decks yet. Tap "+ New Deck" to create one.</div>';
    return;
  }
  state.userDecks.forEach((d, di) => {
    const card = document.createElement('div');
    card.className = 'dm-card';
    const header = document.createElement('div');
    header.className = 'dm-card-header';
    const nameWrap = document.createElement('div');
    nameWrap.className = 'dm-card-name';
    const nameInput = document.createElement('input');
    nameInput.type = 'text'; nameInput.value = d.name;
    nameInput.addEventListener('change', () => { d.name = nameInput.value.trim() || d.name; saveDecks(); });
    nameInput.addEventListener('click', e => e.stopPropagation());
    nameWrap.appendChild(nameInput);
    const toggle = document.createElement('div');
    toggle.className = 'dm-card-toggle'; toggle.textContent = '▾';
    let delDeckPending = false;
    const delDeck = document.createElement('button');
    delDeck.className = 'dm-del-deck'; delDeck.textContent = '🗑 Deck';
    delDeck.addEventListener('click', e => {
      e.stopPropagation();
      if (!delDeckPending) {
        delDeckPending = true; delDeck.textContent = '✓ sure?';
        delDeck.style.borderColor = 'rgba(255,80,80,0.5)'; delDeck.style.color = '#ff6666';
        setTimeout(() => { delDeckPending = false; delDeck.textContent = '🗑 Deck'; delDeck.style.borderColor = ''; delDeck.style.color = ''; }, 2500);
      } else {
        state.activeDeckIds = state.activeDeckIds.filter(id => id !== d.id);
        saveActiveDeckIds();
        state.userDecks.splice(di, 1); saveDecks(); renderDeckManagerList();
      }
    });
    const copyBtn = document.createElement('button');
    copyBtn.className = 'dm-del-deck'; copyBtn.textContent = '📋';
    copyBtn.title = 'Copy as text';
    copyBtn.addEventListener('click', e => {
      e.stopPropagation();
      navigator.clipboard.writeText(deckToPlainText(d)).then(() => { // global from shared/utils.js
        copyBtn.textContent = '✓ Copied!'; copyBtn.style.color = '#44ffaa';
        setTimeout(() => { copyBtn.textContent = '📋'; copyBtn.style.color = ''; }, 1500);
      }).catch(() => {
        copyBtn.textContent = '✗ Error';
        setTimeout(() => { copyBtn.textContent = '📋'; }, 1500);
      });
    });
    const shareBtn = document.createElement('button');
    shareBtn.className = 'dm-del-deck'; shareBtn.textContent = '🔗';
    shareBtn.title = 'Share link';
    shareBtn.addEventListener('click', e => {
      e.stopPropagation();
      const url = deckToShareUrl(d);
      if (navigator.share) {
        navigator.share({ title: 'Keypad Quest — ' + d.name, url }).catch(() => {});
      } else {
        navigator.clipboard.writeText(url).then(() => {
          shareBtn.textContent = '✓ Copied!'; shareBtn.style.color = '#00ffee';
          setTimeout(() => { shareBtn.textContent = '🔗'; shareBtn.style.color = ''; }, 1500);
        });
      }
    });
    header.appendChild(nameWrap); header.appendChild(copyBtn); header.appendChild(shareBtn); header.appendChild(delDeck); header.appendChild(toggle);
    const body = document.createElement('div');
    body.className = 'dm-card-body' + (d.id === openId ? ' open' : '');
    if (d.id === openId) toggle.textContent = '▴';
    header.addEventListener('click', () => {
      const isOpen = body.classList.toggle('open');
      toggle.textContent = isOpen ? '▴' : '▾';
    });
    const pairList = document.createElement('div');
    pairList.style.cssText = 'margin-top:6px;';
    const addBtn = document.createElement('button');
    addBtn.className = 'dact edit'; addBtn.textContent = '+ Add Pair'; addBtn.style.cssText = 'width:100%;margin-bottom:6px;min-height:34px;font-size:0.75em;';
    addBtn.addEventListener('click', () => showPairForm(d, -1, pairList, addBtn));
    body.appendChild(addBtn); body.appendChild(pairList);
    renderPairList(d, pairList, addBtn);
    card.appendChild(header); card.appendChild(body);
    list.appendChild(card);
  });
}

function renderPairList(d, container, addBtn) {
  Array.from(container.children).forEach(c => container.removeChild(c));
  if (d.pairs.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'color:rgba(255,255,255,0.3);font-size:0.78em;text-align:center;padding:10px 0;';
    empty.textContent = 'No pairs yet.';
    container.appendChild(empty);
    return;
  }
  d.pairs.forEach((pair, pi) => {
    const row = document.createElement('div');
    row.className = 'deck-row';
    const keyEl = document.createElement('span');
    keyEl.className = 'deck-row-key'; keyEl.textContent = pair.k;
    const valEl = document.createElement('span');
    valEl.className = 'deck-row-val'; valEl.textContent = pair.v;
    const acts = document.createElement('div');
    acts.className = 'deck-row-acts';
    const editBtn = document.createElement('button');
    editBtn.className = 'dact edit'; editBtn.textContent = '✏';
    editBtn.addEventListener('click', () => showPairForm(d, pi, container, addBtn));
    const delBtn = document.createElement('button');
    delBtn.className = 'dact del'; delBtn.textContent = '🗑';
    let delPending = false;
    delBtn.addEventListener('click', () => {
      if (!delPending) {
        delPending = true; delBtn.classList.add('confirm'); delBtn.textContent = '✓?';
        setTimeout(() => { delPending = false; delBtn.classList.remove('confirm'); delBtn.textContent = '🗑'; }, 2500);
      } else {
        d.pairs.splice(pi, 1); saveDecks(); renderPairList(d, container, addBtn);
      }
    });
    acts.appendChild(editBtn); acts.appendChild(delBtn);
    row.appendChild(keyEl); row.appendChild(valEl); row.appendChild(acts);
    container.appendChild(row);
  });
}

function showPairForm(d, pi, pairListEl, addBtn) {
  const existing = pairListEl.parentNode.querySelector('.deck-form');
  if (existing) existing.remove();
  const pair = pi >= 0 ? d.pairs[pi] : {k:'', v:''};
  const form = document.createElement('div');
  form.className = 'deck-form'; form.style.marginBottom = '6px';
  const kInput = document.createElement('input');
  kInput.type = 'text'; kInput.placeholder = 'Prompt (e.g. France)'; kInput.value = pair.k;
  const vInput = document.createElement('input');
  vInput.type = 'text'; vInput.placeholder = 'Answer (e.g. Paris)'; vInput.value = pair.v;
  const btns = document.createElement('div');
  btns.className = 'deck-form-btns';
  const saveBtn = document.createElement('button');
  saveBtn.className = 'save'; saveBtn.textContent = pi >= 0 ? 'Save' : 'Add Pair';
  saveBtn.addEventListener('click', () => {
    const k = kInput.value.trim(), v = vInput.value.trim();
    if (!k || !v) { kInput.style.borderColor = k ? '' : 'rgba(255,80,80,0.6)'; vInput.style.borderColor = v ? '' : 'rgba(255,80,80,0.6)'; return; }
    if (pi >= 0) d.pairs[pi] = {k, v};
    else d.pairs.push({k, v});
    saveDecks(); form.remove(); renderPairList(d, pairListEl, addBtn);
  });
  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'cancel'; cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', () => form.remove());
  btns.appendChild(saveBtn); btns.appendChild(cancelBtn);
  form.appendChild(kInput); form.appendChild(vInput); form.appendChild(btns);
  addBtn.insertAdjacentElement('afterend', form);
  setTimeout(() => kInput.focus(), 80);
}
