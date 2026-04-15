// ═══════════════════════════════════════════════════════════════════════════
// UI — render functions and DOM manipulation. All read from `state`; no
// gameplay mutations live here.
// ═══════════════════════════════════════════════════════════════════════════

import { state, getPlayer, isAIControlled, isTrump } from './state.js';
import { suitEmoji, suitName, displayValue } from './constants.js';

var $app, $topHand, $bottomHand, $field, $topOptions, $bottomOptions,
    $statusDisplay, $trumpDisplay, $deckCount, $startOverlay,
    $gameoverOverlay, $winnerText, $topZone, $bottomZone;

export function cacheDom() {
  $app             = document.getElementById('app');
  $topHand         = document.getElementById('top-hand');
  $bottomHand      = document.getElementById('bottom-hand');
  $field           = document.getElementById('field');
  $topOptions      = document.getElementById('top-options');
  $bottomOptions   = document.getElementById('bottom-options');
  $statusDisplay   = document.getElementById('status-display');
  $trumpDisplay    = document.getElementById('trump-display');
  $deckCount       = document.getElementById('deck-count');
  $startOverlay    = document.getElementById('start-overlay');
  $gameoverOverlay = document.getElementById('gameover-overlay');
  $winnerText      = document.getElementById('winner-text');
  $topZone         = document.getElementById('top-zone');
  $bottomZone      = document.getElementById('bottom-zone');

  wireHandScroll($topHand);
  wireHandScroll($bottomHand);
}

function wireHandScroll(el) {
  if (!el) return;

  // Vertical wheel → horizontal scroll (mouse-wheel users on laptop)
  el.addEventListener('wheel', function (e) {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  }, { passive: false });

  // Pointer drag-to-scroll (mouse / pen). Touch uses native pan-x.
  var start = null;
  var dragging = false;
  var THRESHOLD = 6;

  el.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'touch') return;
    start = { x: e.clientX, scrollLeft: el.scrollLeft, id: e.pointerId };
    dragging = false;
  });

  el.addEventListener('pointermove', function (e) {
    if (!start || e.pointerId !== start.id) return;
    var dx = e.clientX - start.x;
    if (!dragging && Math.abs(dx) > THRESHOLD) {
      dragging = true;
      try { el.setPointerCapture(start.id); } catch (_) {}
      el.classList.add('dragging');
    }
    if (dragging) {
      el.scrollLeft = start.scrollLeft - dx;
      e.preventDefault();
    }
  });

  function end(e) {
    if (!start || e.pointerId !== start.id) return;
    if (dragging) {
      try { el.releasePointerCapture(start.id); } catch (_) {}
    }
    start = null;
    dragging = false;
    el.classList.remove('dragging');
  }
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
}

// ── Card elements ──────────────────────────────────────────────────────────

export function createCardEl(card, owner) {
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'card-btn suit-' + suitName(card.suit) + ' ' + owner;
  if (isTrump(card.suit)) btn.classList.add('trump-card');
  btn.dataset.cardId = card.id;
  btn.dataset.value  = card.value;
  btn.dataset.suit   = card.suit;
  btn.dataset.owner  = owner;
  var dVal = displayValue(card.value);
  var sEmoji = suitEmoji(card.suit);
  btn.innerHTML =
    '<div class="card-corner"><div class="c-val">' + dVal + '</div><div class="c-corner-suit">' + sEmoji + '</div></div>' +
    '<div class="card-center">' + sEmoji + '</div>';
  return btn;
}

export function createCardBackEl() {
  var el = document.createElement('div');
  el.className = 'card-back';
  return el;
}

// ── Status text ────────────────────────────────────────────────────────────

function getStatusText() {
  if (state.phase !== 'playing') return '';

  var topBoard = getPlayer('top').board;
  var botBoard = getPlayer('bottom').board;

  if (state.aiMode) {
    if (state.priority === 'top') return 'Opponent thinking\u2026';
    if (state.attacker === 'bottom') {
      if (topBoard.length === 0 && botBoard.length === 0) return 'Your attack \u2014 play a card';
      if (topBoard.length === botBoard.length) return 'Throw on or pass';
      return 'Your attack \u2014 play a card';
    }
    return 'Defend \u2014 play a higher card or take';
  }

  if (state.priority === 'bottom') {
    return state.attacker === 'bottom' ? 'Bottom attacks' : 'Bottom defends';
  }
  return state.attacker === 'top' ? 'Top attacks' : 'Top defends';
}

// ── Main render ────────────────────────────────────────────────────────────

function renderHand(playerId, container) {
  container.innerHTML = '';
  var hand = getPlayer(playerId).hand;
  if (isAIControlled(playerId)) {
    for (var i = 0; i < hand.length; i++) container.appendChild(createCardBackEl());
  } else {
    for (var j = 0; j < hand.length; j++) container.appendChild(createCardEl(hand[j], playerId));
  }
}

function renderField() {
  $field.innerHTML = '';
  var topBoard = getPlayer('top').board;
  var botBoard = getPlayer('bottom').board;
  var maxCards = Math.max(topBoard.length, botBoard.length);
  for (var i = 0; i < maxCards; i++) {
    var pairEl = document.createElement('div');
    pairEl.className = 'field-pair';

    if (topBoard[i]) {
      var topEl = createCardEl(topBoard[i], 'field');
      topEl.classList.add('field-card');
      pairEl.appendChild(topEl);
    } else {
      var ph1 = document.createElement('div');
      ph1.className = 'card-placeholder';
      pairEl.appendChild(ph1);
    }

    if (botBoard[i]) {
      var botEl = createCardEl(botBoard[i], 'field');
      botEl.classList.add('field-card');
      pairEl.appendChild(botEl);
    } else {
      var ph2 = document.createElement('div');
      ph2.className = 'card-placeholder';
      pairEl.appendChild(ph2);
    }

    $field.appendChild(pairEl);
  }
}

function updateStatus() {
  $statusDisplay.textContent = getStatusText();
  $statusDisplay.classList.toggle(
    'status-thinking',
    state.aiMode && state.priority === 'top' && state.phase === 'playing'
  );

  if (state.phase === 'playing' || state.phase === 'paused') {
    var isRed = (state.trumpSuit === 3 || state.trumpSuit === 4);
    $trumpDisplay.className = isRed ? 'suit-red' : 'suit-black';
    if (state.deck.length > 0 && state.trumpCard) {
      $trumpDisplay.textContent = displayValue(state.trumpCard.value) + suitEmoji(state.trumpSuit);
    } else {
      $trumpDisplay.textContent = suitEmoji(state.trumpSuit);
    }
  } else {
    $trumpDisplay.textContent = '';
    $trumpDisplay.className = '';
  }

  $deckCount.textContent = state.deck.length > 0 ? 'Deck: ' + state.deck.length : '';

  $topZone.classList.toggle('active-turn', state.priority === 'top' && state.phase === 'playing');
  $bottomZone.classList.toggle('active-turn', state.priority === 'bottom' && state.phase === 'playing');
  $app.classList.toggle('ai-mode', state.aiMode);

  var topBtns = $topOptions.querySelectorAll('.action-btn');
  var bottomBtns = $bottomOptions.querySelectorAll('.action-btn');
  for (var i = 0; i < topBtns.length; i++) {
    topBtns[i].disabled = (state.priority !== 'top' || state.phase !== 'playing');
  }
  for (var k = 0; k < bottomBtns.length; k++) {
    bottomBtns[k].disabled = (state.priority !== 'bottom' || state.phase !== 'playing');
  }
}

export function renderAll() {
  renderHand('top', $topHand);
  renderHand('bottom', $bottomHand);
  renderField();
  updateStatus();
}

// ── Overlays ───────────────────────────────────────────────────────────────

export function hideOverlays() {
  $startOverlay.classList.add('hidden');
  $gameoverOverlay.classList.add('hidden');
}

export function showGameOver(msg) {
  $winnerText.textContent = msg;
  $gameoverOverlay.classList.remove('hidden');
}
