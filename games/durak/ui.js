// ═══════════════════════════════════════════════════════════════════════════
// UI — renders the N-player table. The "local viewer" is seat 0 in vs-Computer
// mode; in Hot-seat mode it rotates to whichever human currently has priority.
// All gameplay mutations live in gameplay.js.
// ═══════════════════════════════════════════════════════════════════════════

import { state, getPlayer, isTrump, adjacentContributors } from './state.js';
import { suitEmoji, suitName, displayValue } from './constants.js';
import { buildCardFaceSvg, buildCardBackSvg } from './cards.js';

var $app, $opponents, $field, $humanHand, $humanOptions,
    $statusDisplay, $trumpDisplay, $deckCount,
    $startOverlay, $gameoverOverlay, $winnerText,
    $passDeviceOverlay, $passDeviceName, $pileBanner,
    $btnTake, $btnPass, $btnDone,
    $deckStack, $trumpSlot;

var cardPool = {};

export function cacheDom() {
  $app               = document.getElementById('app');
  $opponents         = document.getElementById('opponents');
  $field             = document.getElementById('field');
  $humanHand         = document.getElementById('human-hand');
  $humanOptions      = document.getElementById('human-options');
  $statusDisplay     = document.getElementById('status-display');
  $trumpDisplay      = document.getElementById('trump-display');
  $deckCount         = document.getElementById('deck-count');
  $startOverlay      = document.getElementById('start-overlay');
  $gameoverOverlay   = document.getElementById('gameover-overlay');
  $winnerText        = document.getElementById('winner-text');
  $passDeviceOverlay = document.getElementById('pass-device-overlay');
  $passDeviceName    = document.getElementById('pass-device-name');
  $pileBanner        = document.getElementById('pile-banner');
  $btnTake           = document.getElementById('btn-take');
  $btnPass           = document.getElementById('btn-pass');
  $btnDone           = document.getElementById('btn-done');
  $deckStack         = document.getElementById('deck-stack');
  $trumpSlot         = document.getElementById('trump-slot');

  wireHandScroll($humanHand);
}

function wireHandScroll(el) {
  if (!el) return;

  el.addEventListener('wheel', function (e) {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  }, { passive: false });

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
    if (dragging) { try { el.releasePointerCapture(start.id); } catch (_) {} }
    start = null;
    dragging = false;
    el.classList.remove('dragging');
  }
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
}

// ── Local viewer seat ──────────────────────────────────────────────────────

// In vs-Computer mode the viewer is always seat 0. In Hot-seat mode it is
// whichever human seat currently has priority (or seat 0 when no one does,
// e.g. during game-over / paused).
export function currentViewerSeat() {
  if (state.mode !== 'hotseat') return 0;
  var p = state.players[state.prioritySeat];
  if (p && p.isHuman) return state.prioritySeat;
  return 0;
}

// ── Card elements ──────────────────────────────────────────────────────────

export function createCardEl(card, ownerTag) {
  if (!cardPool[card.id]) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.cardId = card.id;
    btn.innerHTML = buildCardFaceSvg(card.suit, card.value);
    cardPool[card.id] = btn;
  }
  var btn = cardPool[card.id];
  btn.className = 'card-btn suit-' + suitName(card.suit) + ' ' + ownerTag;
  if (isTrump(card.suit)) btn.classList.add('trump-card');
  btn.dataset.owner  = ownerTag;
  return btn;
}

export function createCardBackEl(keyId) {
  var id = keyId || 'generic_back';
  if (!cardPool[id]) {
    var el = document.createElement('div');
    el.className = 'card-btn card-back';
    el.innerHTML = buildCardBackSvg();
    cardPool[id] = el;
  }
  var el = cardPool[id];
  el.className = 'card-btn card-back';
  el.style.top = ''; el.style.left = '';
  return el;
}

// ── Role chips ─────────────────────────────────────────────────────────────

function roleFor(seat) {
  var p = state.players[seat];
  if (!p) return '';
  if (p.isOut) return 'Out';
  if (seat === state.attackerSeat) return 'Attacker';
  if (seat === state.defenderSeat) return 'Defender';
  if (adjacentContributors().indexOf(seat) !== -1) return 'Thrower';
  return '';
}

// ── Opponent tiles ─────────────────────────────────────────────────────────

function renderOpponents() {
  $opponents.innerHTML = '';
  var viewer = currentViewerSeat();
  var n = state.players.length;
  for (var step = 1; step < n; step++) {
    var seat = (viewer + step) % n;
    $opponents.appendChild(buildOpponentTile(seat));
  }
}

function buildOpponentTile(seat) {
  var p = state.players[seat];
  var tile = document.createElement('div');
  tile.className = 'opponent-tile';
  if (p.isOut) tile.classList.add('is-out');
  if (state.prioritySeat === seat && (state.phase === 'playing' || state.phase === 'pileOn')) {
    tile.classList.add('has-priority');
  }

  var nameRow = document.createElement('div');
  nameRow.className = 'opp-name';
  nameRow.textContent = p.name;
  tile.appendChild(nameRow);

  var backs = document.createElement('div');
  backs.className = 'opp-backs';
  var showCount = Math.min(p.hand.length, 5);
  for (var i = 0; i < showCount; i++) {
    var b = document.createElement('div');
    b.className = 'mini-back';
    backs.appendChild(b);
  }
  var countBadge = document.createElement('span');
  countBadge.className = 'opp-count';
  countBadge.textContent = p.hand.length;
  backs.appendChild(countBadge);
  tile.appendChild(backs);

  var role = roleFor(seat);
  if (role) {
    var chip = document.createElement('div');
    chip.className = 'opp-role role-' + role.toLowerCase();
    chip.textContent = role;
    tile.appendChild(chip);
  }
  return tile;
}

// ── Field ──────────────────────────────────────────────────────────────────

function renderField() {
  $field.innerHTML = '';
  var attacks = state.field.attacks;
  var defenses = state.field.defenses;
  var n = attacks.length;
  for (var i = 0; i < n; i++) {
    var pair = document.createElement('div');
    pair.className = 'field-pair';
    var atkEl = createCardEl(attacks[i], 'field');
    atkEl.classList.add('field-card');
    pair.appendChild(atkEl);
    if (defenses[i]) {
      var defEl = createCardEl(defenses[i], 'field');
      defEl.classList.add('field-card', 'defense');
      pair.appendChild(defEl);
    } else {
      var ph = document.createElement('div');
      ph.className = 'card-placeholder';
      pair.appendChild(ph);
    }
    $field.appendChild(pair);
  }
}

// ── Human hand ─────────────────────────────────────────────────────────────

function renderHumanHand() {
  $humanHand.innerHTML = '';
  if (state.phase === 'passDevice') return;
  var viewer = currentViewerSeat();
  var p = state.players[viewer];
  if (!p) return;
  for (var i = 0; i < p.hand.length; i++) {
    var el = createCardEl(p.hand[i], 'hand');
    el.dataset.seat = viewer;
    $humanHand.appendChild(el);
  }
}

// ── Action buttons ─────────────────────────────────────────────────────────

function updateActionButtons() {
  var viewer = currentViewerSeat();
  var hasPriority = state.prioritySeat === viewer &&
                    (state.phase === 'playing' || state.phase === 'pileOn');

  var fullyDefended = state.field.attacks.length > 0 &&
                      state.field.defenses.every(function (d) { return d !== null; });

  var canTake = hasPriority && state.phase === 'playing'
                && viewer === state.defenderSeat
                && state.field.attacks.length > 0;

  var canPass = hasPriority && state.phase === 'playing'
                && viewer !== state.defenderSeat
                && fullyDefended;

  var canDone = hasPriority && state.phase === 'pileOn';

  $btnTake.dataset.seat = viewer;
  $btnPass.dataset.seat = viewer;
  $btnDone.dataset.seat = viewer;

  $btnTake.classList.toggle('hidden', !canTake);
  $btnPass.classList.toggle('hidden', !canPass);
  $btnDone.classList.toggle('hidden', !canDone);
}

// ── Status text ────────────────────────────────────────────────────────────

function getStatusText() {
  if (state.phase === 'start' || state.phase === 'gameover') return '';
  if (state.phase === 'paused') return 'Paused';
  if (state.phase === 'passDevice') return 'Pass device';

  var viewer = currentViewerSeat();
  var priorityP = state.players[state.prioritySeat];
  var pName = priorityP ? priorityP.name : '';

  if (state.phase === 'pileOn') {
    if (state.prioritySeat === viewer) return 'Pile on or tap Done';
    return pName + ' may throw on';
  }

  // 'playing'
  if (state.prioritySeat === viewer) {
    if (viewer === state.defenderSeat) return 'Defend \u2014 play a higher card or Take';
    if (state.field.attacks.length === 0) return 'Your attack \u2014 play a card';
    return 'Throw on or Pass';
  }
  if (!priorityP) return '';
  if (state.prioritySeat === state.defenderSeat) return pName + ' defending\u2026';
  return pName + ' attacking\u2026';
}

// ── Main render ────────────────────────────────────────────────────────────

function updateHeader() {
  $statusDisplay.textContent = getStatusText();
  var thinking = state.phase === 'playing' || state.phase === 'pileOn';
  $statusDisplay.classList.toggle(
    'status-thinking',
    thinking && state.players[state.prioritySeat] && !state.players[state.prioritySeat].isHuman
  );

  if (state.phase !== 'start') {
    var isRed = (state.trumpSuit === 3 || state.trumpSuit === 4);
    $trumpDisplay.className = isRed ? 'suit-red' : 'suit-black';
    if (state.deck.length > 0 && state.trumpCard) {
      $trumpDisplay.textContent = displayValue(state.trumpCard.value) + suitEmoji(state.trumpSuit);
    } else if (state.trumpCard) {
      $trumpDisplay.textContent = suitEmoji(state.trumpSuit);
    } else {
      $trumpDisplay.textContent = '';
    }
  } else {
    $trumpDisplay.textContent = '';
    $trumpDisplay.className = '';
  }
  $deckCount.textContent = state.deck.length > 0 ? 'Deck: ' + state.deck.length : '';
}

function updatePileBanner() {
  if (!$pileBanner) return;
  $pileBanner.classList.toggle('hidden', state.phase !== 'pileOn');
}

function renderDeckZone() {
  if (!$deckStack || !$trumpSlot) return;
  $deckStack.innerHTML = '';
  $trumpSlot.innerHTML = '';

  if (state.deck.length > 0 && state.trumpCard) {
    var tEl = createCardEl(state.trumpCard, 'trump');
    $trumpSlot.appendChild(tEl);
  }

  var stackSize = Math.min(state.deck.length, 5);
  for (var i = 0; i < stackSize; i++) {
    var b = createCardBackEl('deck_back_' + i);
    b.style.top = '-' + (i * 2) + 'px';
    b.style.left = '-' + (i * 1.5) + 'px';
    $deckStack.appendChild(b);
  }
}

export function renderAll() {
  // FLIP First
  var flippedEls = [];
  var keys = Object.keys(cardPool);
  for (var i = 0; i < keys.length; i++) {
    var el = cardPool[keys[i]];
    if (el.parentElement) {
      el._flipRect = el.getBoundingClientRect();
      flippedEls.push(el);
    } else {
      el._flipRect = null;
    }
  }

  // Update State DOM
  updateHeader();
  renderOpponents();
  renderDeckZone();
  renderField();
  renderHumanHand();
  updateActionButtons();
  updatePileBanner();

  // FLIP Last & Invert
  for (var i = 0; i < flippedEls.length; i++) {
    var el = flippedEls[i];
    if (!el.parentElement) continue;
    var newRect = el.getBoundingClientRect();
    var oldRect = el._flipRect;
    if (oldRect && newRect) {
      var dx = oldRect.left - newRect.left;
      var dy = oldRect.top - newRect.top;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        el.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
        el.style.transition = 'none';
        el._flipNeedsPlay = true;
      }
    }
  }

  // Force reflow
  document.body.offsetHeight;

  // FLIP Play
  for (var i = 0; i < flippedEls.length; i++) {
    var el = flippedEls[i];
    if (el._flipNeedsPlay) {
      el._flipNeedsPlay = false;
      el.classList.add('flip-animating');
      el.style.transform = '';
      el.style.transition = '';
      
      (function(animEl) {
        animEl.addEventListener('transitionend', function cleanup(e) {
          if (e.propertyName === 'transform') {
            animEl.classList.remove('flip-animating');
            animEl.removeEventListener('transitionend', cleanup);
          }
        });
        
        // Safety timeout
        setTimeout(function() {
          animEl.classList.remove('flip-animating');
          animEl.removeEventListener('transitionend', cleanup);
        }, 350);
      })(el);
    }
  }
}

// ── Overlays ───────────────────────────────────────────────────────────────

export function hideOverlays() {
  $startOverlay.classList.add('hidden');
  $gameoverOverlay.classList.add('hidden');
  if ($passDeviceOverlay) $passDeviceOverlay.classList.add('hidden');
}

export function showGameOver(msg) {
  $winnerText.textContent = msg;
  $gameoverOverlay.classList.remove('hidden');
}

export function showPassDevice(name) {
  if (!$passDeviceOverlay) return;
  $passDeviceName.textContent = name;
  $passDeviceOverlay.classList.remove('hidden');
}

export function hidePassDevice() {
  if ($passDeviceOverlay) $passDeviceOverlay.classList.add('hidden');
}

export function showStart() {
  $startOverlay.classList.remove('hidden');
}
