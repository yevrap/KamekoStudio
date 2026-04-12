(function () {
  'use strict';

  // --- Helpers ---
  var SUIT_EMOJI = { 1: '\u2660', 2: '\u2663', 3: '\u2666', 4: '\u2764' };
  var SUIT_NAME  = { 1: 'spades', 2: 'clubs', 3: 'diamonds', 4: 'hearts' };
  var FACE_MAP   = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };

  // Trump suit — set per game from bottom card of deck
  var trumpSuit = 4;
  var trumpCard = null;

  function suitEmoji(id) { return SUIT_EMOJI[id] || ''; }
  function suitName(id)  { return SUIT_NAME[id] || ''; }
  function displayValue(v) { return FACE_MAP[v] || v; }
  function isTrump(suitId) { return parseInt(suitId) === trumpSuit; }

  // --- Card class ---
  function Card(value, suit) {
    this.value = value;
    this.suit  = suit;
    this.id    = '' + value + suit;
  }

  // --- State ---
  var deckArray = [];
  var topHandArray = [];
  var bottomHandArray = [];
  var topBoardArray = [];
  var bottomBoardArray = [];
  var discardArray = [];
  var attacker = 'bottom';
  var priority = 'bottom';
  var gameState = 'start'; // start | playing | paused | gameover
  var aiMode = localStorage.getItem('durak_mode') !== 'pvp';
  var aiTimeout = null;

  // --- DOM refs ---
  var $app           = document.getElementById('app');
  var $topHand       = document.getElementById('top-hand');
  var $bottomHand    = document.getElementById('bottom-hand');
  var $field         = document.getElementById('field');
  var $topOptions    = document.getElementById('top-options');
  var $bottomOptions = document.getElementById('bottom-options');
  var $statusDisplay = document.getElementById('status-display');
  var $trumpDisplay  = document.getElementById('trump-display');
  var $deckCount     = document.getElementById('deck-count');
  var $startOverlay  = document.getElementById('start-overlay');
  var $gameoverOverlay = document.getElementById('gameover-overlay');
  var $winnerText    = document.getElementById('winner-text');
  var $topZone       = document.getElementById('top-zone');
  var $bottomZone    = document.getElementById('bottom-zone');

  // --- Mode toggle (start screen) ---
  var $modeToggle = document.getElementById('mode-toggle');
  $modeToggle.addEventListener('pointerdown', function (e) {
    var btn = e.target.closest('.mode-btn');
    if (!btn) return;
    e.preventDefault();
    var mode = btn.dataset.mode;
    aiMode = (mode === 'ai');
    localStorage.setItem('durak_mode', aiMode ? 'ai' : 'pvp');
    var btns = $modeToggle.querySelectorAll('.mode-btn');
    for (var i = 0; i < btns.length; i++) btns[i].classList.toggle('active', btns[i].dataset.mode === mode);
  });

  // Restore saved mode on start screen
  (function initModeToggle() {
    var btns = $modeToggle.querySelectorAll('.mode-btn');
    for (var i = 0; i < btns.length; i++) {
      btns[i].classList.toggle('active', (aiMode && btns[i].dataset.mode === 'ai') || (!aiMode && btns[i].dataset.mode === 'pvp'));
    }
  })();

  // --- Shuffle ---
  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
  }

  // --- Build deck ---
  function buildDeck() {
    var deck = [];
    for (var suit = 1; suit <= 4; suit++) {
      for (var val = 6; val <= 14; val++) {
        deck.push(new Card(val, suit));
      }
    }
    shuffle(deck);
    return deck;
  }

  // --- Create card button ---
  function createCardEl(card, owner) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'card-btn suit-' + suitName(card.suit) + ' ' + owner;
    if (isTrump(card.suit)) btn.classList.add('trump-card');
    btn.dataset.cardId = card.id;
    btn.dataset.value  = card.value;
    btn.dataset.suit   = card.suit;
    btn.dataset.owner  = owner;
    btn.textContent = displayValue(card.value) + ' ' + suitEmoji(card.suit);
    return btn;
  }

  function createCardBackEl() {
    var el = document.createElement('div');
    el.className = 'card-back';
    return el;
  }

  // --- Status messages ---
  function getStatusText() {
    if (gameState !== 'playing') return '';

    if (aiMode) {
      if (priority === 'top') return 'Opponent thinking\u2026';
      if (attacker === 'bottom') {
        if (topBoardArray.length === 0 && bottomBoardArray.length === 0) return 'Your attack \u2014 play a card';
        if (topBoardArray.length === bottomBoardArray.length) return 'Throw on or pass';
        return 'Your attack \u2014 play a card';
      }
      return 'Defend \u2014 play a higher card or take';
    }

    // PvP mode
    if (priority === 'bottom') {
      return attacker === 'bottom' ? 'Bottom attacks' : 'Bottom defends';
    }
    return attacker === 'top' ? 'Top attacks' : 'Top defends';
  }

  // --- UI updates ---
  function updateStatus() {
    $statusDisplay.textContent = getStatusText();
    $statusDisplay.classList.toggle('status-thinking', aiMode && priority === 'top' && gameState === 'playing');

    // Trump display
    if (gameState === 'playing' || gameState === 'paused') {
      var isRed = (trumpSuit === 3 || trumpSuit === 4);
      $trumpDisplay.className = isRed ? 'suit-red' : 'suit-black';
      if (deckArray.length > 0 && trumpCard) {
        $trumpDisplay.textContent = displayValue(trumpCard.value) + suitEmoji(trumpSuit);
      } else {
        $trumpDisplay.textContent = suitEmoji(trumpSuit);
      }
    } else {
      $trumpDisplay.textContent = '';
      $trumpDisplay.className = '';
    }

    $deckCount.textContent = deckArray.length > 0 ? 'Deck: ' + deckArray.length : '';

    $topZone.classList.toggle('active-turn', priority === 'top' && gameState === 'playing');
    $bottomZone.classList.toggle('active-turn', priority === 'bottom' && gameState === 'playing');

    $app.classList.toggle('ai-mode', aiMode);

    // Disable/enable action buttons based on state
    var topBtns = $topOptions.querySelectorAll('.action-btn');
    var bottomBtns = $bottomOptions.querySelectorAll('.action-btn');
    for (var i = 0; i < topBtns.length; i++) topBtns[i].disabled = (priority !== 'top' || gameState !== 'playing');
    for (var i = 0; i < bottomBtns.length; i++) bottomBtns[i].disabled = (priority !== 'bottom' || gameState !== 'playing');
  }

  function updateField() {
    $field.innerHTML = '';
    var maxCards = Math.max(topBoardArray.length, bottomBoardArray.length);
    for (var i = 0; i < maxCards; i++) {
      var pairEl = document.createElement('div');
      pairEl.className = 'field-pair';

      if (topBoardArray[i]) {
        var topEl = createCardEl(topBoardArray[i], 'field');
        topEl.classList.add('field-card');
        pairEl.appendChild(topEl);
      } else {
        var ph = document.createElement('div');
        ph.className = 'card-placeholder';
        pairEl.appendChild(ph);
      }

      if (bottomBoardArray[i]) {
        var botEl = createCardEl(bottomBoardArray[i], 'field');
        botEl.classList.add('field-card');
        pairEl.appendChild(botEl);
      } else {
        var ph = document.createElement('div');
        ph.className = 'card-placeholder';
        pairEl.appendChild(ph);
      }

      $field.appendChild(pairEl);
    }
  }

  function renderHand(arr, container, owner) {
    container.innerHTML = '';
    if (aiMode && owner === 'top') {
      for (var i = 0; i < arr.length; i++) {
        container.appendChild(createCardBackEl());
      }
    } else {
      for (var i = 0; i < arr.length; i++) {
        container.appendChild(createCardEl(arr[i], owner));
      }
    }
  }

  function renderAll() {
    renderHand(topHandArray, $topHand, 'top');
    renderHand(bottomHandArray, $bottomHand, 'bottom');
    updateField();
    updateStatus();
  }

  // --- Auto-draw both players up to 6 ---
  function autoDrawBoth() {
    // Attacker draws first (standard Durak rule)
    var first = (attacker === 'top') ? topHandArray : bottomHandArray;
    var second = (attacker === 'top') ? bottomHandArray : topHandArray;
    while (first.length < 6 && deckArray.length > 0) first.push(deckArray.pop());
    while (second.length < 6 && deckArray.length > 0) second.push(deckArray.pop());
  }

  // --- Game-over detection ---
  function checkGameOver() {
    if (deckArray.length > 0) return false;
    if (topBoardArray.length > 0 || bottomBoardArray.length > 0) return false;
    if (topHandArray.length === 0) {
      endGame(aiMode ? 'You lose!' : 'Top player wins!');
      return true;
    } else if (bottomHandArray.length === 0) {
      endGame(aiMode ? 'You win!' : 'Bottom player wins!');
      return true;
    }
    return false;
  }

  function endGame(msg) {
    clearAiTimeout();
    gameState = 'gameover';
    $winnerText.textContent = msg;
    $gameoverOverlay.classList.remove('hidden');
    updateStatus();
  }

  // --- Actions ---
  function drawCard(who) {
    if (gameState !== 'playing') return;
    var handArr = (who === 'top') ? topHandArray : bottomHandArray;
    if (handArr.length >= 6 || deckArray.length === 0) return;

    var card = deckArray.pop();
    handArr.push(card);
    renderAll();
  }

  function canPlayCard(card, who) {
    var cardVal  = parseInt(card.value);
    var cardSuit = parseInt(card.suit);
    var isAttacker = (who === attacker);
    var opponentBoard = (who === 'top') ? bottomBoardArray : topBoardArray;
    var lastAttackCard = opponentBoard.length > 0 ? opponentBoard[opponentBoard.length - 1] : null;

    if (isAttacker) {
      if (topBoardArray.length === 0 && bottomBoardArray.length === 0) return true;
      for (var i = 0; i < topBoardArray.length; i++) {
        if (parseInt(topBoardArray[i].value) === cardVal) return true;
      }
      for (var i = 0; i < bottomBoardArray.length; i++) {
        if (parseInt(bottomBoardArray[i].value) === cardVal) return true;
      }
      return false;
    }

    // Defender
    if (!lastAttackCard) return false;
    var atkVal  = parseInt(lastAttackCard.value);
    var atkSuit = parseInt(lastAttackCard.suit);
    if (cardSuit === atkSuit && cardVal > atkVal) return true;
    if (cardSuit === trumpSuit && atkSuit !== trumpSuit) return true;
    if (cardSuit === trumpSuit && atkSuit === trumpSuit && cardVal > atkVal) return true;
    return false;
  }

  function playCard(cardId, who) {
    if (gameState !== 'playing') return;
    if (who !== priority) return;

    var handArr = (who === 'top') ? topHandArray : bottomHandArray;
    var idx = -1;
    for (var i = 0; i < handArr.length; i++) {
      if (handArr[i].id === cardId) { idx = i; break; }
    }
    if (idx === -1) return;

    var card = handArr[idx];
    if (!canPlayCard(card, who)) return;

    handArr.splice(idx, 1);
    var boardArr = (who === 'top') ? topBoardArray : bottomBoardArray;
    boardArr.push(card);

    priority = (who === 'top') ? 'bottom' : 'top';
    renderAll();
    if (!checkGameOver()) maybeAiTurn();
  }

  function takeCards(who) {
    if (gameState !== 'playing') return;
    if (who !== priority) return;
    if (who === attacker) return;
    if (topBoardArray.length === 0 && bottomBoardArray.length === 0) return;

    var handArr = (who === 'top') ? topHandArray : bottomHandArray;

    while (topBoardArray.length > 0) handArr.push(topBoardArray.pop());
    while (bottomBoardArray.length > 0) handArr.push(bottomBoardArray.pop());

    // After take: same attacker keeps attacking, priority goes to other player
    priority = (who === 'top') ? 'bottom' : 'top';

    // Auto-draw the non-taker (attacker draws)
    var attackerHand = (attacker === 'top') ? topHandArray : bottomHandArray;
    while (attackerHand.length < 6 && deckArray.length > 0) attackerHand.push(deckArray.pop());

    renderAll();
    if (!checkGameOver()) maybeAiTurn();
  }

  function passRound(who) {
    if (gameState !== 'playing') return;
    if (who !== priority) return;
    if (who !== attacker) return;
    if (topBoardArray.length === 0) return;
    if (topBoardArray.length !== bottomBoardArray.length) return;

    while (topBoardArray.length > 0) discardArray.push(topBoardArray.pop());
    while (bottomBoardArray.length > 0) discardArray.push(bottomBoardArray.pop());

    // Swap attacker
    attacker = (attacker === 'top') ? 'bottom' : 'top';
    priority = attacker;

    // Auto-draw both players
    autoDrawBoth();

    renderAll();
    if (!checkGameOver()) maybeAiTurn();
  }

  // ─── AI Logic ─────────────────────────────────────────────────────────────────

  function clearAiTimeout() {
    if (aiTimeout !== null) {
      clearTimeout(aiTimeout);
      aiTimeout = null;
    }
  }

  function maybeAiTurn() {
    if (aiMode && priority === 'top' && gameState === 'playing') {
      aiTurn();
    }
  }

  function aiTurn() {
    if (gameState !== 'playing' || !aiMode || priority !== 'top') return;
    clearAiTimeout();

    // Auto-draw first
    if (topHandArray.length < 6 && deckArray.length > 0) {
      aiTimeout = setTimeout(function () {
        if (gameState !== 'playing' || priority !== 'top') return;
        while (topHandArray.length < 6 && deckArray.length > 0) {
          topHandArray.push(deckArray.pop());
        }
        renderAll();
        aiDecide();
      }, 300);
      return;
    }

    aiDecide();
  }

  function aiDecide() {
    if (gameState !== 'playing' || priority !== 'top') return;
    clearAiTimeout();

    var delay = 500 + Math.floor(Math.random() * 400);
    aiTimeout = setTimeout(function () {
      if (gameState !== 'playing' || priority !== 'top') return;
      if (attacker === 'top') aiAttack();
      else aiDefend();
    }, delay);
  }

  function cardStrength(card) {
    var val = parseInt(card.value);
    var suit = parseInt(card.suit);
    return suit === trumpSuit ? val + 100 : val;
  }

  // Find all cards in hand that canPlayCard approves
  function findPlayableCards(hand, who) {
    var playable = [];
    for (var i = 0; i < hand.length; i++) {
      if (canPlayCard(hand[i], who)) playable.push(hand[i]);
    }
    playable.sort(function (a, b) { return cardStrength(a) - cardStrength(b); });
    return playable;
  }

  function aiAttack() {
    var hand = topHandArray;
    if (hand.length === 0) { passRound('top'); return; }

    var playable = findPlayableCards(hand, 'top');

    // Field empty or can throw on: play cheapest valid card
    if (playable.length > 0) {
      // If all defended and hand is small, pass instead of throwing on
      if (topBoardArray.length > 0 && topBoardArray.length === bottomBoardArray.length && hand.length <= 2) {
        passRound('top');
        return;
      }
      // Prefer non-trump when throwing on
      if (topBoardArray.length > 0 && topBoardArray.length === bottomBoardArray.length) {
        var nonTrump = [];
        for (var i = 0; i < playable.length; i++) {
          if (!isTrump(playable[i].suit)) nonTrump.push(playable[i]);
        }
        if (nonTrump.length > 0) { playCard(nonTrump[0].id, 'top'); return; }
        // Only trumps to throw — pass instead
        passRound('top');
        return;
      }
      playCard(playable[0].id, 'top');
      return;
    }

    // No playable cards — pass if we can
    if (topBoardArray.length > 0 && topBoardArray.length === bottomBoardArray.length) {
      passRound('top');
    }
  }

  function aiDefend() {
    var hand = topHandArray;
    if (hand.length === 0) { takeCards('top'); return; }

    // Use canPlayCard as the single source of truth
    var valid = findPlayableCards(hand, 'top');

    if (valid.length === 0) { takeCards('top'); return; }

    // Rank: same suit as attack card (cheapest) > trump (cheapest)
    var lastAtk = bottomBoardArray[bottomBoardArray.length - 1];
    var atkSuit = parseInt(lastAtk.suit);

    var sameSuit = [];
    var trumpDef = [];
    for (var i = 0; i < valid.length; i++) {
      if (parseInt(valid[i].suit) === atkSuit) sameSuit.push(valid[i]);
      else trumpDef.push(valid[i]);
    }

    // Both arrays already sorted by cardStrength (from findPlayableCards)
    var pick = sameSuit.length > 0 ? sameSuit[0] : trumpDef[0];
    playCard(pick.id, 'top');
  }

  // ─── Pointer event delegation ─────────────────────────────────────────────────

  $app.addEventListener('pointerdown', function (e) {
    if (gameState !== 'playing') return;

    var actionBtn = e.target.closest('.action-btn');
    if (actionBtn) {
      var who = actionBtn.dataset.player;
      if (aiMode && who === 'top') return;
      var action = actionBtn.dataset.action;
      if (action === 'draw') drawCard(who);
      else if (action === 'take') takeCards(who);
      else if (action === 'pass') passRound(who);
      return;
    }

    var cardBtn = e.target.closest('.card-btn');
    if (cardBtn && cardBtn.dataset.owner !== 'field') {
      var owner = cardBtn.dataset.owner;
      if (aiMode && owner === 'top') return;
      playCard(cardBtn.dataset.cardId, owner);
    }
  });

  // ─── Start / restart ──────────────────────────────────────────────────────────

  function startGame() {
    clearAiTimeout();
    deckArray = buildDeck();

    // Bottom card of deck determines trump suit
    trumpCard = deckArray[0];
    trumpSuit = parseInt(trumpCard.suit);

    topHandArray.length = 0;
    bottomHandArray.length = 0;
    topBoardArray.length = 0;
    bottomBoardArray.length = 0;
    discardArray.length = 0;
    attacker = 'bottom';
    priority = 'bottom';
    gameState = 'playing';

    // Initial draw for both players
    autoDrawBoth();

    $startOverlay.classList.add('hidden');
    $gameoverOverlay.classList.add('hidden');
    renderAll();
    maybeAiTurn();
  }

  document.getElementById('btn-play').addEventListener('pointerdown', function (e) {
    e.preventDefault();
    if (!window.KamekoTokens || !window.KamekoTokens.spend()) {
      if (window.KamekoTokens) window.KamekoTokens.toast();
      return;
    }
    localStorage.setItem('lastPlayed_durak', Date.now());
    startGame();
  });

  document.getElementById('btn-replay').addEventListener('pointerdown', function (e) {
    e.preventDefault();
    if (!window.KamekoTokens || !window.KamekoTokens.spend()) {
      if (window.KamekoTokens) window.KamekoTokens.toast();
      return;
    }
    localStorage.setItem('lastPlayed_durak', Date.now());
    startGame();
  });

  // ─── Settings integration ─────────────────────────────────────────────────────

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
    btnAi.className = 'mode-btn' + (aiMode ? ' active' : '');
    btnAi.dataset.mode = 'ai';
    btnAi.textContent = 'vs Computer';

    var btnPvp = document.createElement('button');
    btnPvp.type = 'button';
    btnPvp.className = 'mode-btn' + (!aiMode ? ' active' : '');
    btnPvp.dataset.mode = 'pvp';
    btnPvp.textContent = 'vs Player';

    toggle.appendChild(btnAi);
    toggle.appendChild(btnPvp);
    sec.appendChild(toggle);

    toggle.addEventListener('pointerdown', function (e) {
      var btn = e.target.closest('.mode-btn');
      if (!btn) return;
      e.preventDefault();
      var mode = btn.dataset.mode;
      aiMode = (mode === 'ai');
      localStorage.setItem('durak_mode', aiMode ? 'ai' : 'pvp');
      btnAi.classList.toggle('active', aiMode);
      btnPvp.classList.toggle('active', !aiMode);
      var startBtns = $modeToggle.querySelectorAll('.mode-btn');
      for (var i = 0; i < startBtns.length; i++) {
        startBtns[i].classList.toggle('active', startBtns[i].dataset.mode === mode);
      }
    });

    if (devSection) panel.insertBefore(sec, devSection);
    else panel.appendChild(sec);
  }

  window.addEventListener('settingsOpened', function () {
    clearAiTimeout();
    if (gameState === 'playing') gameState = 'paused';
    updateStatus();
    injectDurakSettings();
  });

  window.addEventListener('settingsClosed', function () {
    document.getElementById('durak-settings')?.remove();
    if (gameState === 'paused') {
      gameState = 'playing';
      renderAll();
      maybeAiTurn();
    }
  });

  // --- iOS bfcache ---
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) updateStatus();
  });

})();
