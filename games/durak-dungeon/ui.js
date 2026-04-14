// ═══════════════════════════════════════════════════════════════════════════
// UI — all rendering and DOM manipulation
// ═══════════════════════════════════════════════════════════════════════════

import { state, hasRelic, getActiveTrumpSuit, canDefend } from './state.js';
import { ENHANCE_COLORS, suitName, suitEmoji, displayValue } from './constants.js';

// ── DOM refs ───────────────────────────────────────────────────────────────

var $trumpDisplay   = document.getElementById('trump-display');
var $floorDisplay   = document.getElementById('floor-display');
var $relicBar       = document.getElementById('relic-bar');
var $hpBar          = document.getElementById('hp-bar');
var $hpText         = document.getElementById('hp-text');
var $goldDisplay    = document.getElementById('gold-display');
var $seedDisplay    = document.getElementById('seed-display');
var $enemyCards     = document.getElementById('enemy-cards');
var $enemyHpBar     = document.getElementById('enemy-hp-bar');
var $enemyHpText    = document.getElementById('enemy-hp-text');
var $statusDisplay  = document.getElementById('status-display');
var $playerHand     = document.getElementById('player-hand');
var $btnTakeHit     = document.getElementById('btn-take-hit');
var $btnEndAttack   = document.getElementById('btn-end-attack');
var $damageFloaters = document.getElementById('damage-floaters');
var $relicTooltip      = document.getElementById('relic-tooltip');
var $relicTooltipName  = document.getElementById('relic-tooltip-name');
var $relicTooltipDesc  = document.getElementById('relic-tooltip-desc');

// ── Card element factory ───────────────────────────────────────────────────

export function createCardEl(card, interactive) {
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'card-btn suit-' + suitName(card.suit);
  if (card.suit === state.run.trumpSuit) btn.classList.add('trump-card');
  if (card.enhancement) btn.classList.add('enhance-' + card.enhancement);
  btn.dataset.uid = card.uid;
  var dVal = displayValue(card.value);
  var sE = suitEmoji(card.suit);
  var enhHtml = card.enhancement
    ? '<div class="card-enhance" style="color:' + (ENHANCE_COLORS[card.enhancement] || '#aaa') + '">' + card.enhancement + '</div>'
    : '';
  btn.innerHTML =
    '<div class="card-corner"><div class="c-val">' + dVal + '</div><div class="c-corner-suit">' + sE + '</div></div>' +
    '<div class="card-center">' + sE + '</div>' + enhHtml;
  if (!interactive) btn.style.cursor = 'default';
  return btn;
}

// ── HP color ───────────────────────────────────────────────────────────────

export function hpColor(ratio) {
  if (ratio > 0.5) return 'var(--hp-green)';
  if (ratio > 0.25) return 'var(--hp-yellow)';
  return 'var(--hp-red)';
}

// ── Render functions ───────────────────────────────────────────────────────

export function renderHeader() {
  if (!state.run) return;
  var isRed = (state.run.trumpSuit === 3 || state.run.trumpSuit === 4);
  $trumpDisplay.className = isRed ? 'suit-red' : 'suit-black';

  var activeTrump = getActiveTrumpSuit();
  $trumpDisplay.textContent = suitEmoji(activeTrump);
  $floorDisplay.textContent = 'F:' + state.run.floor;

  var hpRatio = state.run.hp / state.run.maxHp;
  $hpBar.style.width = (Math.max(0, hpRatio) * 100) + '%';
  $hpBar.style.backgroundColor = hpColor(hpRatio);
  $hpText.textContent = Math.max(0, state.run.hp) + ' / ' + state.run.maxHp;

  $goldDisplay.textContent = 'Gold: ' + state.run.gold;
  $seedDisplay.textContent = state.run.seed;
}

export function renderRelics() {
  $relicBar.innerHTML = '';
  for (var i = 0; i < 5; i++) {
    var slot = document.createElement('div');
    slot.className = 'relic-slot';
    if (i < state.run.relics.length) {
      slot.textContent = state.run.relics[i].icon;
      slot.dataset.relicIndex = i;
      if (state.run.relics[i].id === 'wild-card' && !state.run.wildCardUsedThisFloor) {
        slot.classList.add('active-relic');
      }
    } else {
      slot.classList.add('empty');
    }
    $relicBar.appendChild(slot);
  }
}

export function renderEnemyCards() {
  $enemyCards.innerHTML = '';
  if (!state.run.enemy) return;
  for (var i = 0; i < state.run.enemy.cards.length; i++) {
    var card = state.run.enemy.cards[i];
    var el = createCardEl(card, false);
    if (i < state.run.enemyAttackIndex) {
      el.classList.add('card-defended');
    } else if (i === state.run.enemyAttackIndex && state.run.phase === 'defend') {
      el.classList.add('card-active-attack');
    }
    $enemyCards.appendChild(el);
  }
}

export function renderEnemyHp() {
  if (!state.run.enemy) {
    $enemyHpText.textContent = '';
    $enemyHpBar.style.width = '0';
    return;
  }
  var ratio = Math.max(0, state.run.enemy.hp) / state.run.enemy.maxHp;
  $enemyHpBar.style.width = (ratio * 100) + '%';
  $enemyHpText.textContent = Math.max(0, state.run.enemy.hp) + ' / ' + state.run.enemy.maxHp;
}

export function renderPlayerHand() {
  $playerHand.innerHTML = '';
  for (var i = 0; i < state.run.hand.length; i++) {
    var card = state.run.hand[i];
    var el = createCardEl(card, true);

    if (state.run.phase === 'defend') {
      var attackCard = state.run.enemy && state.run.enemyAttackIndex < state.run.enemy.cards.length
        ? state.run.enemy.cards[state.run.enemyAttackIndex] : null;
      var isWild = hasRelic('wild-card') && !state.run.wildCardUsedThisFloor;
      if (attackCard && !canDefend(card, attackCard) && !isWild) {
        el.classList.add('card-dimmed');
      } else if (attackCard) {
        el.classList.add('card-valid');
      }
    }

    $playerHand.appendChild(el);
  }
}

export function renderActionButtons() {
  $btnTakeHit.classList.toggle('hidden', state.run.phase !== 'defend');
  $btnEndAttack.classList.toggle('hidden', state.run.phase !== 'attack');
  $btnTakeHit.disabled = state.run.phase !== 'defend';
  $btnEndAttack.disabled = state.run.phase !== 'attack';
}

export function setStatus(text, type) {
  $statusDisplay.textContent = text;
  $statusDisplay.className = '';
  if (type === 'defend') $statusDisplay.classList.add('status-defend');
  else if (type === 'attack') $statusDisplay.classList.add('status-attack');
}

export function renderAll() {
  renderHeader();
  renderRelics();
  renderEnemyCards();
  renderEnemyHp();
  renderPlayerHand();
  renderActionButtons();
}

// ── Damage floaters ────────────────────────────────────────────────────────

export function spawnFloater(targetEl, text, type) {
  if (!targetEl) return;
  var rect = targetEl.getBoundingClientRect();
  var el = document.createElement('div');
  el.className = 'damage-float ' + type;
  el.textContent = text;
  el.style.left = (rect.left + rect.width / 2 - 15) + 'px';
  el.style.top = (rect.top) + 'px';
  $damageFloaters.appendChild(el);
  setTimeout(function () { el.remove(); }, 700);
}

// ── Relic tooltip ──────────────────────────────────────────────────────────

export function showRelicTooltip(relicSlot) {
  var idx = parseInt(relicSlot.dataset.relicIndex, 10);
  var relic = state.run.relics[idx];
  if (!relic) return;
  var rect = relicSlot.getBoundingClientRect();
  $relicTooltipName.textContent = relic.icon + ' ' + relic.name;
  $relicTooltipDesc.textContent = relic.desc;
  $relicTooltip.style.left = Math.max(8, rect.left) + 'px';
  $relicTooltip.style.top = (rect.bottom + 6) + 'px';
  $relicTooltip.classList.remove('hidden');
  setTimeout(function () { $relicTooltip.classList.add('hidden'); }, 2000);
}
