(function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════════
  // CONSTANTS & HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  var SUIT_EMOJI = { 1: '\u2660', 2: '\u2663', 3: '\u2666', 4: '\u2764' };
  var SUIT_NAME  = { 1: 'spades', 2: 'clubs', 3: 'diamonds', 4: 'hearts' };
  var FACE_MAP   = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
  var ENHANCE_COLORS = {
    burning: '#ff8c32', armored: '#6496ff', vampiric: '#b850b8', lucky: '#32c864'
  };

  function suitEmoji(id) { return SUIT_EMOJI[id] || ''; }
  function suitName(id)  { return SUIT_NAME[id] || ''; }
  function displayValue(v) { return FACE_MAP[v] || String(v); }

  // ── Seeded PRNG ────────────────────────────────────────────────────────────
  function mulberry32(seed) {
    var h = seed | 0;
    return function () {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      h ^= h >>> 16;
      return (h >>> 0) / 4294967296;
    };
  }

  function seedFromString(str) {
    var hash = 0;
    for (var i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }

  function generateSeed() {
    var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var s = '';
    for (var i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }

  // ── Rng-based shuffle ──────────────────────────────────────────────────────
  function shuffle(arr, rng) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CARD
  // ═══════════════════════════════════════════════════════════════════════════

  var cardIdCounter = 0;
  function Card(value, suit, enhancement) {
    this.value = value;
    this.suit = suit;
    this.enhancement = enhancement || null;
    this.uid = 'c' + (cardIdCounter++);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RELICS
  // ═══════════════════════════════════════════════════════════════════════════

  var RELIC_DEFS = [
    { id: 'iron-shield',    icon: '\uD83D\uDEE1\uFE0F', name: 'Iron Shield',    desc: 'Reduce all damage taken by 1 (min 1)' },
    { id: 'sharp-edge',     icon: '\u2694\uFE0F',        name: 'Sharp Edge',      desc: 'All attack cards deal +2 damage' },
    { id: 'crown-of-trumps',icon: '\uD83D\uDC51',        name: 'Crown of Trumps', desc: 'Trump attacks deal +5 instead of +3' },
    { id: 'wild-card',      icon: '\uD83C\uDCCF',        name: 'Wild Card',       desc: 'Once per floor: any card defends any attack' },
    { id: 'diamond-skin',   icon: '\uD83D\uDC8E',        name: 'Diamond Skin',    desc: 'Defending with \u2666 heals 1 HP' },
    { id: 'fire-blade',     icon: '\uD83D\uDD25',        name: 'Fire Blade',      desc: '6s and 7s deal double attack damage' },
    { id: 'magnet',         icon: '\uD83E\uDDF2',        name: 'Magnet',          desc: 'Draw 7 cards instead of 6' },
    { id: 'skull-ring',     icon: '\uD83D\uDC80',        name: 'Skull Ring',      desc: '+1 attack damage per hit taken this floor' },
    { id: 'gold-tooth',     icon: '\uD83E\uDE99',        name: 'Gold Tooth',      desc: '+5 bonus gold after each floor' },
    { id: 'frost-armor',    icon: '\u2744\uFE0F',        name: 'Frost Armor',     desc: 'First hit each floor deals 0 damage' },
    { id: 'precision',      icon: '\uD83C\uDFAF',        name: 'Precision',       desc: 'Face cards (J/Q/K/A) deal +3 attack damage' },
    { id: 'chaos-orb',      icon: '\uD83C\uDF00',        name: 'Chaos Orb',       desc: 'Enemy attack order is randomized' },
    { id: 'blood-pact',     icon: '\uD83E\uDE78',        name: 'Blood Pact',      desc: '-2 HP per floor, but +4 attack damage' },
    { id: 'oracle',         icon: '\uD83D\uDD2E',        name: 'Oracle',          desc: 'See enemy cards before defend phase' },
    { id: 'recycle',        icon: '\u267B\uFE0F',        name: 'Recycle',         desc: 'Cards used to defend return to your deck' }
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  // BOSS MUTATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  var MUTATION_DEFS = [
    { id: 'no-trumps',   name: 'No Trumps',   desc: 'Trump suit disabled. Same-suit-higher only.' },
    { id: 'armored',     name: 'Armored',      desc: 'Boss takes half damage from attacks.' },
    { id: 'relentless',  name: 'Relentless',   desc: 'Boss attacks with 2 cards at once.' },
    { id: 'mirror',      name: 'Mirror',       desc: 'Next attack matches suit you last defended with.' },
    { id: 'regenerate',  name: 'Regenerate',   desc: 'Boss heals 5 HP after your attack phase.' },
    { id: 'trump-shift', name: 'Trump Shift',  desc: 'Trump suit changes each defend/attack cycle.' }
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  // ENEMY NAMES
  // ═══════════════════════════════════════════════════════════════════════════

  var ENEMY_NAMES = {
    1: ['Rat', 'Bandit', 'Thief', 'Stray Dog'],
    2: ['Knight', 'Archer', 'Spearman', 'Guard'],
    3: ['Sorcerer', 'Dark Knight', 'Assassin', 'Golem'],
    4: ['Dragon', 'Demon', 'Wraith', 'Lich']
  };
  var BOSS_NAMES = ['The Gatekeeper', 'The Warden', 'The Hollow King', 'The Durak'];

  // ═══════════════════════════════════════════════════════════════════════════
  // RUN STATE
  // ═══════════════════════════════════════════════════════════════════════════

  var run = null;

  function newRun(seed) {
    cardIdCounter = 0;
    var r = {
      seed: seed,
      rng: mulberry32(seedFromString(seed)),
      trumpSuit: 0,
      floor: 1,
      hp: 50,
      maxHp: 50,
      gold: 0,
      deck: [],
      relics: [],
      phase: 'title',
      enemy: null,
      hand: [],
      enemyAttackIndex: 0,
      floorHitsTaken: 0,
      wildCardUsedThisFloor: false,
      defenseCards: [],
      attackDamageDealt: 0,
      lastDefendSuit: 0,
      stats: {
        floorsCleared: 0,
        totalDamageDealt: 0,
        totalDamageTaken: 0,
        enemiesDefeated: 0,
        goldEarned: 0,
        cardsPlayed: 0
      }
    };

    // Pick trump suit
    r.trumpSuit = Math.floor(r.rng() * 4) + 1;

    // Build starting deck: 18 cards, two non-trump suits, values 6-14
    var suits = [1, 2, 3, 4].filter(function (s) { return s !== r.trumpSuit; });
    // Pick two of the three remaining suits
    shuffle(suits, r.rng);
    var deckSuits = [suits[0], suits[1]];
    for (var si = 0; si < deckSuits.length; si++) {
      for (var v = 6; v <= 14; v++) {
        r.deck.push(new Card(v, deckSuits[si]));
      }
    }
    shuffle(r.deck, r.rng);

    return r;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DOM REFS
  // ═══════════════════════════════════════════════════════════════════════════

  var $app = document.getElementById('app');
  var $trumpDisplay = document.getElementById('trump-display');
  var $floorDisplay = document.getElementById('floor-display');
  var $relicBar = document.getElementById('relic-bar');
  var $hpBar = document.getElementById('hp-bar');
  var $hpText = document.getElementById('hp-text');
  var $goldDisplay = document.getElementById('gold-display');
  var $seedDisplay = document.getElementById('seed-display');
  var $enemyName = document.getElementById('enemy-name');
  var $enemyCards = document.getElementById('enemy-cards');
  var $enemyHpBar = document.getElementById('enemy-hp-bar');
  var $enemyHpText = document.getElementById('enemy-hp-text');
  var $statusDisplay = document.getElementById('status-display');
  var $playerHand = document.getElementById('player-hand');
  var $btnTakeHit = document.getElementById('btn-take-hit');
  var $btnEndAttack = document.getElementById('btn-end-attack');
  var $titleOverlay = document.getElementById('title-overlay');
  var $rewardOverlay = document.getElementById('reward-overlay');
  var $rewardTitle = document.getElementById('reward-title');
  var $rewardChoices = document.getElementById('reward-choices');
  var $shopOverlay = document.getElementById('shop-overlay');
  var $shopGold = document.getElementById('shop-gold');
  var $shopItems = document.getElementById('shop-items');
  var $shopDeck = document.getElementById('shop-deck');
  var $shopDeckLabel = document.getElementById('shop-deck-label');
  var $bossOverlay = document.getElementById('boss-overlay');
  var $bossName = document.getElementById('boss-name');
  var $bossMutations = document.getElementById('boss-mutations');
  var $gameoverOverlay = document.getElementById('gameover-overlay');
  var $gameoverTitle = document.getElementById('gameover-title');
  var $gameoverStats = document.getElementById('gameover-stats');
  var $gameoverSeed = document.getElementById('gameover-seed');
  var $floorTransition = document.getElementById('floor-transition');
  var $floorTransitionText = document.getElementById('floor-transition-text');
  var $damageFloaters = document.getElementById('damage-floaters');
  var $relicTooltip = document.getElementById('relic-tooltip');
  var $relicTooltipName = document.getElementById('relic-tooltip-name');
  var $relicTooltipDesc = document.getElementById('relic-tooltip-desc');
  var $seedInput = document.getElementById('seed-input');

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDERING
  // ═══════════════════════════════════════════════════════════════════════════

  function createCardEl(card, interactive) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'card-btn suit-' + suitName(card.suit);
    if (card.suit === run.trumpSuit) btn.classList.add('trump-card');
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

  function hpColor(ratio) {
    if (ratio > 0.5) return 'var(--hp-green)';
    if (ratio > 0.25) return 'var(--hp-yellow)';
    return 'var(--hp-red)';
  }

  function renderHeader() {
    if (!run) return;
    var isRed = (run.trumpSuit === 3 || run.trumpSuit === 4);
    $trumpDisplay.className = isRed ? 'suit-red' : 'suit-black';

    var activeTrump = getActiveTrumpSuit();
    $trumpDisplay.textContent = suitEmoji(activeTrump);
    $floorDisplay.textContent = 'F:' + run.floor;

    var hpRatio = run.hp / run.maxHp;
    $hpBar.style.width = (Math.max(0, hpRatio) * 100) + '%';
    $hpBar.style.backgroundColor = hpColor(hpRatio);
    $hpText.textContent = Math.max(0, run.hp) + ' / ' + run.maxHp;

    $goldDisplay.textContent = 'Gold: ' + run.gold;
    $seedDisplay.textContent = run.seed;
  }

  function renderRelics() {
    $relicBar.innerHTML = '';
    for (var i = 0; i < 5; i++) {
      var slot = document.createElement('div');
      slot.className = 'relic-slot';
      if (i < run.relics.length) {
        slot.textContent = run.relics[i].icon;
        slot.dataset.relicIndex = i;
        if (run.relics[i].id === 'wild-card' && !run.wildCardUsedThisFloor) {
          slot.classList.add('active-relic');
        }
      } else {
        slot.classList.add('empty');
      }
      $relicBar.appendChild(slot);
    }
  }

  function renderEnemyCards() {
    $enemyCards.innerHTML = '';
    if (!run.enemy) return;
    for (var i = 0; i < run.enemy.cards.length; i++) {
      var card = run.enemy.cards[i];
      var el = createCardEl(card, false);
      if (i < run.enemyAttackIndex) {
        el.classList.add('card-defended');
      } else if (i === run.enemyAttackIndex && run.phase === 'defend') {
        el.classList.add('card-active-attack');
      }
      $enemyCards.appendChild(el);
    }
  }

  function renderEnemyHp() {
    if (!run.enemy) {
      $enemyHpText.textContent = '';
      $enemyHpBar.style.width = '0';
      return;
    }
    var ratio = Math.max(0, run.enemy.hp) / run.enemy.maxHp;
    $enemyHpBar.style.width = (ratio * 100) + '%';
    $enemyHpText.textContent = Math.max(0, run.enemy.hp) + ' / ' + run.enemy.maxHp;
  }

  function canDefend(card, attackCard) {
    if (!attackCard) return false;
    var activeTrump = getActiveTrumpSuit();
    // Check no-trumps mutation
    if (run.enemy && run.enemy.mutations.indexOf('no-trumps') !== -1) {
      return card.suit === attackCard.suit && card.value > attackCard.value;
    }
    if (card.suit === attackCard.suit && card.value > attackCard.value) return true;
    if (card.suit === activeTrump && attackCard.suit !== activeTrump) return true;
    if (card.suit === activeTrump && attackCard.suit === activeTrump && card.value > attackCard.value) return true;
    return false;
  }

  function renderPlayerHand() {
    $playerHand.innerHTML = '';
    for (var i = 0; i < run.hand.length; i++) {
      var card = run.hand[i];
      var el = createCardEl(card, true);

      if (run.phase === 'defend') {
        var attackCard = run.enemy && run.enemyAttackIndex < run.enemy.cards.length
          ? run.enemy.cards[run.enemyAttackIndex] : null;
        var isWild = hasRelic('wild-card') && !run.wildCardUsedThisFloor;
        if (attackCard && !canDefend(card, attackCard) && !isWild) {
          el.classList.add('card-dimmed');
        } else if (attackCard) {
          el.classList.add('card-valid');
        }
      }

      $playerHand.appendChild(el);
    }
  }

  function renderActionButtons() {
    $btnTakeHit.classList.toggle('hidden', run.phase !== 'defend');
    $btnEndAttack.classList.toggle('hidden', run.phase !== 'attack');
    $btnTakeHit.disabled = run.phase !== 'defend';
    $btnEndAttack.disabled = run.phase !== 'attack';
  }

  function setStatus(text, type) {
    $statusDisplay.textContent = text;
    $statusDisplay.className = '';
    if (type === 'defend') $statusDisplay.classList.add('status-defend');
    else if (type === 'attack') $statusDisplay.classList.add('status-attack');
  }

  function renderAll() {
    renderHeader();
    renderRelics();
    renderEnemyCards();
    renderEnemyHp();
    renderPlayerHand();
    renderActionButtons();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DAMAGE FLOATER
  // ═══════════════════════════════════════════════════════════════════════════

  function spawnFloater(targetEl, text, type) {
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

  // ═══════════════════════════════════════════════════════════════════════════
  // RELIC HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  function hasRelic(id) {
    for (var i = 0; i < run.relics.length; i++) {
      if (run.relics[i].id === id) return true;
    }
    return false;
  }

  function addRelic(relicDef) {
    if (run.relics.length >= 5) return false;
    run.relics.push({ id: relicDef.id, icon: relicDef.icon, name: relicDef.name, desc: relicDef.desc });
    renderRelics();
    return true;
  }

  function getActiveTrumpSuit() {
    if (!run) return 1;
    if (run.currentTrumpOverride) return run.currentTrumpOverride;
    return run.trumpSuit;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ENEMY GENERATION
  // ═══════════════════════════════════════════════════════════════════════════

  function generateEnemy(floor) {
    var isBoss = (floor % 5 === 0);
    var act = Math.min(4, Math.ceil(floor / 5));
    var e = { hp: 0, maxHp: 0, cards: [], mutations: [], name: '' };

    if (isBoss) {
      var bossIndex = Math.floor(floor / 5) - 1;
      e.name = BOSS_NAMES[Math.min(bossIndex, BOSS_NAMES.length - 1)];
      e.maxHp = [40, 60, 80, 120][Math.min(bossIndex, 3)];
      e.hp = e.maxHp;

      // Mutations
      var numMutations = Math.min(bossIndex + 1, 4);
      var mPool = MUTATION_DEFS.slice();
      shuffle(mPool, run.rng);
      for (var m = 0; m < numMutations && m < mPool.length; m++) {
        e.mutations.push(mPool[m].id);
      }

      // Boss hand: 6 cards, wider range
      var handSize = 6;
      var maxVal = 14;
      var minVal = 6;
      var trumpProb = 0.3;
      for (var i = 0; i < handSize; i++) {
        var val = minVal + Math.floor(run.rng() * (maxVal - minVal + 1));
        var suit = run.rng() < trumpProb ? run.trumpSuit : (Math.floor(run.rng() * 4) + 1);
        e.cards.push(new Card(val, suit));
      }
    } else {
      // Regular enemy
      var names = ENEMY_NAMES[act] || ENEMY_NAMES[1];
      e.name = names[Math.floor(run.rng() * names.length)];
      e.maxHp = 15 + floor * 3;
      e.hp = e.maxHp;

      var handSize = Math.min(6, 3 + Math.floor(floor / 4));
      var maxVal = Math.min(14, 9 + Math.floor(floor / 3));
      var minVal = 6;
      var trumpProb = Math.min(0.4, 0.1 + floor * 0.02);

      for (var i = 0; i < handSize; i++) {
        var val = minVal + Math.floor(run.rng() * (maxVal - minVal + 1));
        var suit = run.rng() < trumpProb ? run.trumpSuit : (Math.floor(run.rng() * 4) + 1);
        e.cards.push(new Card(val, suit));
      }
    }

    // Sort enemy cards lowest first (unless chaos orb)
    if (!hasRelic('chaos-orb')) {
      e.cards.sort(function (a, b) { return a.value - b.value; });
    } else {
      shuffle(e.cards, run.rng);
    }

    // Handle relentless: double up cards (pair them)
    if (e.mutations.indexOf('relentless') !== -1 && e.cards.length < 10) {
      var extra = [];
      for (var i = 0; i < Math.min(3, e.cards.length); i++) {
        var c = e.cards[i];
        extra.push(new Card(
          minVal + Math.floor(run.rng() * (maxVal - minVal + 1)),
          run.rng() < 0.3 ? run.trumpSuit : (Math.floor(run.rng() * 4) + 1)
        ));
      }
      e.cards = e.cards.concat(extra);
      if (!hasRelic('chaos-orb')) {
        e.cards.sort(function (a, b) { return a.value - b.value; });
      }
    }

    return e;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FLOOR LOGIC
  // ═══════════════════════════════════════════════════════════════════════════

  function startFloor() {
    run.enemy = generateEnemy(run.floor);
    run.enemyAttackIndex = 0;
    run.floorHitsTaken = 0;
    run.wildCardUsedThisFloor = false;
    run.defenseCards = [];
    run.attackDamageDealt = 0;
    run.lastDefendSuit = 0;
    run.currentTrumpOverride = null;

    // Blood pact
    if (hasRelic('blood-pact')) {
      run.hp = Math.max(1, run.hp - 2);
    }

    // Draw hand
    shuffle(run.deck, run.rng);
    var drawCount = hasRelic('magnet') ? 7 : 6;
    run.hand = [];
    for (var i = 0; i < drawCount && run.deck.length > 0; i++) {
      var card = run.deck.pop();
      run.hand.push(card);
      // Lucky enhancement: draw extra
      if (card.enhancement === 'lucky' && run.deck.length > 0) {
        run.hand.push(run.deck.pop());
      }
    }

    $enemyName.textContent = run.enemy.name;

    // Check boss
    if (run.floor % 5 === 0 && run.enemy.mutations.length > 0) {
      showBossOverlay();
    } else {
      beginDefendPhase();
    }
  }

  function showBossOverlay() {
    run.phase = 'boss-intro';
    $bossName.textContent = run.enemy.name;
    $bossMutations.innerHTML = '';
    for (var i = 0; i < run.enemy.mutations.length; i++) {
      var mDef = null;
      for (var j = 0; j < MUTATION_DEFS.length; j++) {
        if (MUTATION_DEFS[j].id === run.enemy.mutations[i]) { mDef = MUTATION_DEFS[j]; break; }
      }
      if (mDef) {
        var tag = document.createElement('div');
        tag.className = 'boss-mutation-tag';
        tag.textContent = mDef.name + ' — ' + mDef.desc;
        $bossMutations.appendChild(tag);
      }
    }
    hideAllOverlays();
    $bossOverlay.classList.remove('hidden');
    renderAll();
  }

  function beginDefendPhase() {
    run.phase = 'defend';
    run.enemyAttackIndex = 0;

    // Trump shift mutation
    if (run.enemy && run.enemy.mutations.indexOf('trump-shift') !== -1) {
      run.currentTrumpOverride = Math.floor(run.rng() * 4) + 1;
    }

    // Mirror mutation: set first attack card suit
    if (run.enemy && run.enemy.mutations.indexOf('mirror') !== -1 && run.lastDefendSuit > 0) {
      // Change current attack card to match last defend suit
      if (run.enemyAttackIndex < run.enemy.cards.length) {
        run.enemy.cards[run.enemyAttackIndex].suit = run.lastDefendSuit;
      }
    }

    hideAllOverlays();
    setStatus('Defend!', 'defend');
    renderAll();

    // Check if enemy has no cards
    if (run.enemy.cards.length === 0) {
      beginAttackPhase();
    }
  }

  function beginAttackPhase() {
    run.phase = 'attack';
    run.attackDamageDealt = 0;
    setStatus('Attack! Tap cards to deal damage', 'attack');
    renderAll();
  }

  function handleDefend(cardUid) {
    if (run.phase !== 'defend') return;
    if (!run.enemy || run.enemyAttackIndex >= run.enemy.cards.length) return;

    var cardIndex = -1;
    for (var i = 0; i < run.hand.length; i++) {
      if (run.hand[i].uid === cardUid) { cardIndex = i; break; }
    }
    if (cardIndex === -1) return;

    var card = run.hand[cardIndex];
    var attackCard = run.enemy.cards[run.enemyAttackIndex];

    var isWild = hasRelic('wild-card') && !run.wildCardUsedThisFloor;
    if (!canDefend(card, attackCard) && !isWild) return;

    // If using wild card and can't normally defend
    if (!canDefend(card, attackCard) && isWild) {
      run.wildCardUsedThisFloor = true;
    }

    run.lastDefendSuit = card.suit;

    // Remove card from hand
    run.hand.splice(cardIndex, 1);
    run.defenseCards.push(card);
    run.stats.cardsPlayed++;

    // Vampiric heal
    if (card.enhancement === 'vampiric') {
      run.hp = Math.min(run.maxHp, run.hp + 2);
      spawnFloater(document.getElementById('hp-bar-container'), '+2', 'heal-float');
    }

    // Diamond skin relic
    if (hasRelic('diamond-skin') && card.suit === 3) {
      run.hp = Math.min(run.maxHp, run.hp + 1);
      spawnFloater(document.getElementById('hp-bar-container'), '+1', 'heal-float');
    }

    // Recycle relic: card goes back to deck instead of discarded
    if (hasRelic('recycle')) {
      run.deck.push(card);
    }

    // Advance to next enemy attack
    run.enemyAttackIndex++;

    // Mirror mutation: change next attack card suit
    if (run.enemy.mutations.indexOf('mirror') !== -1 && run.enemyAttackIndex < run.enemy.cards.length) {
      run.enemy.cards[run.enemyAttackIndex].suit = card.suit;
    }

    // Check if defend phase is over
    if (run.enemyAttackIndex >= run.enemy.cards.length) {
      setTimeout(function () { beginAttackPhase(); }, 300);
    }

    renderAll();
  }

  function handleTakeHit() {
    if (run.phase !== 'defend') return;
    if (!run.enemy || run.enemyAttackIndex >= run.enemy.cards.length) return;

    var attackCard = run.enemy.cards[run.enemyAttackIndex];
    var damage = attackCard.value;

    // Frost armor
    if (hasRelic('frost-armor') && run.floorHitsTaken === 0) {
      damage = 0;
      spawnFloater(document.getElementById('hp-bar-container'), 'Blocked!', 'heal-float');
    }

    // Iron shield
    if (hasRelic('iron-shield') && damage > 0) {
      damage = Math.max(1, damage - 1);
    }

    // Armored enhancement on defense doesn't apply to take-hit

    run.hp -= damage;
    run.floorHitsTaken++;
    run.stats.totalDamageTaken += damage;

    if (damage > 0) {
      spawnFloater(document.getElementById('hp-bar-container'), '-' + damage, 'player-damage');
    }

    run.enemyAttackIndex++;

    // Check death
    if (run.hp <= 0) {
      run.hp = 0;
      renderAll();
      setTimeout(endRun, 400);
      return;
    }

    // Check if defend phase is over
    if (run.enemyAttackIndex >= run.enemy.cards.length) {
      renderAll();
      setTimeout(function () { beginAttackPhase(); }, 300);
    } else {
      renderAll();
    }
  }

  function handleAttack(cardUid) {
    if (run.phase !== 'attack') return;

    var cardIndex = -1;
    for (var i = 0; i < run.hand.length; i++) {
      if (run.hand[i].uid === cardUid) { cardIndex = i; break; }
    }
    if (cardIndex === -1) return;

    var card = run.hand[cardIndex];
    var damage = card.value;

    var activeTrump = getActiveTrumpSuit();

    // Trump bonus
    if (card.suit === activeTrump) {
      damage += hasRelic('crown-of-trumps') ? 5 : 3;
    }

    // Sharp edge
    if (hasRelic('sharp-edge')) damage += 2;

    // Fire blade
    if (hasRelic('fire-blade') && (card.value === 6 || card.value === 7)) {
      damage = damage * 2;
    }

    // Skull ring
    if (hasRelic('skull-ring')) damage += run.floorHitsTaken;

    // Blood pact
    if (hasRelic('blood-pact')) damage += 4;

    // Precision
    if (hasRelic('precision') && card.value >= 11) damage += 3;

    // Burning enhancement
    if (card.enhancement === 'burning') damage += 3;

    // Vampiric
    if (card.enhancement === 'vampiric') {
      run.hp = Math.min(run.maxHp, run.hp + 2);
      spawnFloater(document.getElementById('hp-bar-container'), '+2', 'heal-float');
    }

    // Armored mutation (boss takes half)
    if (run.enemy && run.enemy.mutations.indexOf('armored') !== -1) {
      damage = Math.floor(damage / 2);
    }

    run.enemy.hp -= damage;
    run.attackDamageDealt += damage;
    run.stats.totalDamageDealt += damage;
    run.stats.cardsPlayed++;

    // Remove card from hand
    run.hand.splice(cardIndex, 1);

    spawnFloater(document.getElementById('enemy-hp-container'), '-' + damage, 'enemy-damage');

    renderAll();
  }

  function handleEndAttack() {
    if (run.phase !== 'attack') return;

    // Regenerate mutation
    if (run.enemy && run.enemy.mutations.indexOf('regenerate') !== -1) {
      run.enemy.hp = Math.min(run.enemy.maxHp, run.enemy.hp + 5);
    }

    // Return unplayed hand cards to deck
    while (run.hand.length > 0) {
      run.deck.push(run.hand.pop());
    }

    // Check enemy death
    if (run.enemy.hp <= 0) {
      floorCleared();
    } else {
      // Enemy survived — take another round
      // Re-deal hand
      shuffle(run.deck, run.rng);
      var drawCount = hasRelic('magnet') ? 7 : 6;
      for (var i = 0; i < drawCount && run.deck.length > 0; i++) {
        var card = run.deck.pop();
        run.hand.push(card);
        if (card.enhancement === 'lucky' && run.deck.length > 0) {
          run.hand.push(run.deck.pop());
        }
      }

      // Re-generate enemy cards for next round
      var floor = run.floor;
      var act = Math.min(4, Math.ceil(floor / 5));
      var maxVal = Math.min(14, 9 + Math.floor(floor / 3));
      var minVal = 6;
      var trumpProb = Math.min(0.4, 0.1 + floor * 0.02);
      var isBoss = (floor % 5 === 0);
      var handSize = isBoss ? 6 : Math.min(6, 3 + Math.floor(floor / 4));
      if (isBoss) { maxVal = 14; trumpProb = 0.3; }

      run.enemy.cards = [];
      for (var i = 0; i < handSize; i++) {
        var val = minVal + Math.floor(run.rng() * (maxVal - minVal + 1));
        var suit = run.rng() < trumpProb ? run.trumpSuit : (Math.floor(run.rng() * 4) + 1);
        run.enemy.cards.push(new Card(val, suit));
      }
      if (!hasRelic('chaos-orb')) {
        run.enemy.cards.sort(function (a, b) { return a.value - b.value; });
      }

      // Trump shift for next cycle
      if (run.enemy.mutations.indexOf('trump-shift') !== -1) {
        run.currentTrumpOverride = Math.floor(run.rng() * 4) + 1;
      }

      run.enemyAttackIndex = 0;
      run.phase = 'defend';
      setStatus('Defend!', 'defend');
      renderAll();
    }
  }

  function floorCleared() {
    run.stats.floorsCleared++;
    run.stats.enemiesDefeated++;

    // Gold reward
    var goldEarned = 5;
    if (run.floorHitsTaken === 0) goldEarned += 10;
    if (hasRelic('gold-tooth')) goldEarned += 5;
    run.gold += goldEarned;
    run.stats.goldEarned += goldEarned;

    // Return hand to deck
    while (run.hand.length > 0) {
      run.deck.push(run.hand.pop());
    }

    // Save best floor
    var best = parseInt(localStorage.getItem('durakDungeon_bestFloor') || '0', 10);
    if (run.floor > best) localStorage.setItem('durakDungeon_bestFloor', String(run.floor));

    // Check victory
    if (run.floor >= 20) {
      var victories = parseInt(localStorage.getItem('durakDungeon_victories') || '0', 10);
      localStorage.setItem('durakDungeon_victories', String(victories + 1));
      run.phase = 'victory';
      showGameOver(true);
      return;
    }

    // Shop floor?
    if (run.floor % 3 === 0) {
      showRewards(function () { showShop(); });
    } else {
      showRewards(function () { advanceFloor(); });
    }
  }

  function advanceFloor() {
    run.floor++;
    run.enemy = null;
    run.phase = 'transition';

    $floorTransitionText.textContent = 'FLOOR ' + run.floor;
    $floorTransition.classList.remove('hidden');
    $floorTransition.classList.remove('fading');
    renderAll();

    setTimeout(function () {
      $floorTransition.classList.add('fading');
      setTimeout(function () {
        $floorTransition.classList.add('hidden');
        startFloor();
      }, 300);
    }, 500);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REWARDS
  // ═══════════════════════════════════════════════════════════════════════════

  function showRewards(onDone) {
    run.phase = 'rewards';
    hideAllOverlays();

    var isBoss = ((run.floor) % 5 === 0);
    $rewardTitle.textContent = isBoss ? 'BOSS DEFEATED!' : 'FLOOR ' + run.floor + ' CLEARED!';

    var choices = generateRewardChoices();
    $rewardChoices.innerHTML = '';

    for (var i = 0; i < choices.length; i++) {
      var ch = choices[i];
      var div = document.createElement('div');
      div.className = 'reward-choice';
      div.dataset.index = i;
      div.innerHTML = '<div class="reward-icon">' + ch.icon + '</div>' +
        '<div class="reward-label">' + ch.label + '</div>' +
        '<div class="reward-desc">' + ch.desc + '</div>';
      $rewardChoices.appendChild(div);
    }

    $rewardOverlay.classList.remove('hidden');

    // Handle choice
    $rewardChoices.onclick = function (e) {
      var choice = e.target.closest('.reward-choice');
      if (!choice) return;
      var idx = parseInt(choice.dataset.index, 10);
      var ch = choices[idx];
      applyReward(ch);
      $rewardChoices.onclick = null;
      $rewardOverlay.classList.add('hidden');
      if (onDone) onDone();
    };
  }

  function generateRewardChoices() {
    var choices = [];
    var floor = run.floor;

    // Always offer a card
    var cardVal = Math.min(14, 6 + Math.floor(run.rng() * (3 + Math.floor(floor / 3))));
    var cardSuit = Math.floor(run.rng() * 4) + 1;
    var enhancement = null;
    if (run.rng() < 0.2) {
      var enhancements = ['burning', 'armored', 'vampiric', 'lucky'];
      enhancement = enhancements[Math.floor(run.rng() * enhancements.length)];
    }
    var rewardCard = new Card(cardVal, cardSuit, enhancement);
    choices.push({
      type: 'card',
      icon: displayValue(rewardCard.value) + suitEmoji(rewardCard.suit),
      label: enhancement ? enhancement : 'Card',
      desc: 'Add to your deck',
      card: rewardCard
    });

    // Gold or heal
    if (run.rng() < 0.5) {
      var goldAmt = 10 + Math.floor(run.rng() * 16);
      choices.push({
        type: 'gold',
        icon: '\uD83E\uDE99',
        label: '+' + goldAmt + ' Gold',
        desc: 'For the shop',
        amount: goldAmt
      });
    } else {
      var healAmt = 5 + Math.floor(run.rng() * 6);
      choices.push({
        type: 'heal',
        icon: '\u2764\uFE0F',
        label: '+' + healAmt + ' HP',
        desc: 'Restore health',
        amount: healAmt
      });
    }

    // Third: relic (15% chance) or another card/gold/heal
    if (run.rng() < 0.15 && run.relics.length < 5) {
      var available = RELIC_DEFS.filter(function (r) { return !hasRelic(r.id); });
      if (available.length > 0) {
        var relicDef = available[Math.floor(run.rng() * available.length)];
        choices.push({
          type: 'relic',
          icon: relicDef.icon,
          label: relicDef.name,
          desc: relicDef.desc,
          relicDef: relicDef
        });
      } else {
        pushFallbackReward(choices);
      }
    } else {
      pushFallbackReward(choices);
    }

    return choices;
  }

  function pushFallbackReward(choices) {
    if (run.rng() < 0.5) {
      var goldAmt = 8 + Math.floor(run.rng() * 13);
      choices.push({
        type: 'gold',
        icon: '\uD83E\uDE99',
        label: '+' + goldAmt + ' Gold',
        desc: 'For the shop',
        amount: goldAmt
      });
    } else {
      var healAmt = 5 + Math.floor(run.rng() * 6);
      choices.push({
        type: 'heal',
        icon: '\u2764\uFE0F',
        label: '+' + healAmt + ' HP',
        desc: 'Restore health',
        amount: healAmt
      });
    }
  }

  function applyReward(ch) {
    if (ch.type === 'card') {
      run.deck.push(ch.card);
    } else if (ch.type === 'gold') {
      run.gold += ch.amount;
      run.stats.goldEarned += ch.amount;
    } else if (ch.type === 'heal') {
      run.hp = Math.min(run.maxHp, run.hp + ch.amount);
    } else if (ch.type === 'relic') {
      addRelic(ch.relicDef);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SHOP
  // ═══════════════════════════════════════════════════════════════════════════

  var shopAction = null;

  function showShop() {
    run.phase = 'shop';
    shopAction = null;
    hideAllOverlays();
    renderShop();
    $shopOverlay.classList.remove('hidden');
  }

  function renderShop() {
    $shopGold.textContent = 'Gold: ' + run.gold;
    $shopItems.innerHTML = '';
    $shopDeck.innerHTML = '';
    $shopDeckLabel.classList.add('hidden');

    var items = [
      { id: 'remove', label: 'Remove a Card', cost: 15 },
      { id: 'upgrade', label: 'Upgrade a Card (+1 value)', cost: 20 },
      { id: 'heal', label: 'Heal 10 HP', cost: 10 },
      { id: 'relic', label: 'Random Relic', cost: 30 }
    ];

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      var div = document.createElement('div');
      div.className = 'shop-item';
      if (run.gold < item.cost) div.classList.add('disabled');
      if (item.id === 'relic' && run.relics.length >= 5) div.classList.add('disabled');
      if (item.id === 'heal' && run.hp >= run.maxHp) div.classList.add('disabled');
      if (shopAction === item.id) div.classList.add('shop-selected');
      div.dataset.action = item.id;
      div.dataset.cost = item.cost;
      div.innerHTML = '<span class="shop-item-label">' + item.label + '</span>' +
        '<span class="shop-item-cost">' + item.cost + ' \uD83E\uDE99</span>';
      $shopItems.appendChild(div);
    }

    // If selecting cards for remove/upgrade, show deck
    if (shopAction === 'remove' || shopAction === 'upgrade') {
      $shopDeckLabel.classList.remove('hidden');
      $shopDeckLabel.textContent = shopAction === 'remove' ? 'Tap a card to remove' : 'Tap a card to upgrade';
      var sorted = run.deck.slice().sort(function (a, b) {
        return a.suit !== b.suit ? a.suit - b.suit : a.value - b.value;
      });
      for (var i = 0; i < sorted.length; i++) {
        var el = createCardEl(sorted[i], true);
        el.dataset.uid = sorted[i].uid;
        if (shopAction === 'upgrade' && sorted[i].value >= 14) {
          el.classList.add('card-dimmed');
        }
        $shopDeck.appendChild(el);
      }
    }
  }

  function handleShopClick(e) {
    if (run.phase !== 'shop') return;

    // Shop item click
    var itemEl = e.target.closest('.shop-item');
    if (itemEl && !itemEl.classList.contains('disabled')) {
      var action = itemEl.dataset.action;
      var cost = parseInt(itemEl.dataset.cost, 10);

      if (action === 'heal') {
        run.gold -= cost;
        run.hp = Math.min(run.maxHp, run.hp + 10);
        shopAction = null;
        renderShop();
        return;
      }

      if (action === 'relic') {
        var available = RELIC_DEFS.filter(function (r) { return !hasRelic(r.id); });
        if (available.length > 0) {
          run.gold -= cost;
          var pick = available[Math.floor(run.rng() * available.length)];
          addRelic(pick);
          shopAction = null;
          renderShop();
        }
        return;
      }

      // Toggle remove/upgrade selection mode
      shopAction = (shopAction === action) ? null : action;
      renderShop();
      return;
    }

    // Deck card click (for remove/upgrade)
    var cardEl = e.target.closest('#shop-deck .card-btn');
    if (cardEl && shopAction) {
      var uid = cardEl.dataset.uid;
      var cost = shopAction === 'remove' ? 15 : 20;
      if (run.gold < cost) return;

      for (var i = 0; i < run.deck.length; i++) {
        if (run.deck[i].uid === uid) {
          if (shopAction === 'remove') {
            run.gold -= cost;
            run.deck.splice(i, 1);
          } else if (shopAction === 'upgrade') {
            if (run.deck[i].value < 14) {
              run.gold -= cost;
              run.deck[i].value++;
            }
          }
          break;
        }
      }
      shopAction = null;
      renderShop();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GAME OVER
  // ═══════════════════════════════════════════════════════════════════════════

  function endRun() {
    run.phase = 'gameover';
    showGameOver(false);
  }

  function showGameOver(victory) {
    hideAllOverlays();
    $gameoverTitle.textContent = victory ? 'VICTORY!' : 'DEFEAT';
    $gameoverStats.innerHTML =
      '<div>Floor reached: ' + run.floor + '</div>' +
      '<div>Enemies defeated: ' + run.stats.enemiesDefeated + '</div>' +
      '<div>Damage dealt: ' + run.stats.totalDamageDealt + '</div>' +
      '<div>Damage taken: ' + run.stats.totalDamageTaken + '</div>' +
      '<div>Gold earned: ' + run.stats.goldEarned + '</div>' +
      '<div>Relics: ' + run.relics.length + '/5</div>';
    $gameoverSeed.textContent = 'Seed: ' + run.seed;
    localStorage.setItem('durakDungeon_lastSeed', run.seed);
    $gameoverOverlay.classList.remove('hidden');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // OVERLAY HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  function hideAllOverlays() {
    $titleOverlay.classList.add('hidden');
    $rewardOverlay.classList.add('hidden');
    $shopOverlay.classList.add('hidden');
    $bossOverlay.classList.add('hidden');
    $gameoverOverlay.classList.add('hidden');
    $floorTransition.classList.add('hidden');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════

  // Main game area — card clicks
  $app.addEventListener('pointerdown', function (e) {
    e.preventDefault();

    // Relic tooltip
    var relicSlot = e.target.closest('.relic-slot');
    if (relicSlot && relicSlot.dataset.relicIndex !== undefined) {
      var idx = parseInt(relicSlot.dataset.relicIndex, 10);
      var relic = run.relics[idx];
      if (relic) {
        // Wild card activation
        if (relic.id === 'wild-card' && !run.wildCardUsedThisFloor && run.phase === 'defend') {
          // Already handled in canDefend check — just visual
        }
        // Show tooltip
        var rect = relicSlot.getBoundingClientRect();
        $relicTooltipName.textContent = relic.icon + ' ' + relic.name;
        $relicTooltipDesc.textContent = relic.desc;
        $relicTooltip.style.left = Math.max(8, rect.left) + 'px';
        $relicTooltip.style.top = (rect.bottom + 6) + 'px';
        $relicTooltip.classList.remove('hidden');
        setTimeout(function () { $relicTooltip.classList.add('hidden'); }, 2000);
      }
      return;
    }

    // Player hand card click
    var cardBtn = e.target.closest('#player-hand .card-btn');
    if (cardBtn) {
      var uid = cardBtn.dataset.uid;
      if (run.phase === 'defend') {
        handleDefend(uid);
      } else if (run.phase === 'attack') {
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
    $bossOverlay.classList.add('hidden');
    beginDefendPhase();
  });

  // Seed display — copy on tap
  $seedDisplay.addEventListener('pointerdown', function () {
    if (run && navigator.clipboard) {
      navigator.clipboard.writeText(run.seed);
    }
  });

  // Game over seed — copy on tap
  $gameoverSeed.addEventListener('pointerdown', function () {
    if (run && navigator.clipboard) {
      navigator.clipboard.writeText(run.seed);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // START / RESTART
  // ═══════════════════════════════════════════════════════════════════════════

  function startGame() {
    var seedVal = $seedInput.value.trim().toUpperCase();
    if (!seedVal) seedVal = generateSeed();
    $seedInput.value = '';

    run = newRun(seedVal);
    hideAllOverlays();

    localStorage.setItem('lastPlayed_durakDungeon', String(Date.now()));
    run.phase = 'transition';

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

  // ═══════════════════════════════════════════════════════════════════════════
  // URL SEED PARSING
  // ═══════════════════════════════════════════════════════════════════════════

  (function parseSeedFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var seed = params.get('seed');
    if (seed) {
      $seedInput.value = seed.toUpperCase().slice(0, 8);
      history.replaceState(null, '', window.location.pathname);
    }
  })();

  // ═══════════════════════════════════════════════════════════════════════════
  // SETTINGS INTEGRATION
  // ═══════════════════════════════════════════════════════════════════════════

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

    if (run && run.phase !== 'title') {
      var label = document.createElement('div');
      label.style.cssText = 'font-size:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);margin-bottom:8px';
      label.textContent = 'Current Run';
      sec.appendChild(label);

      var info = document.createElement('div');
      info.style.cssText = 'font-size:0.78rem;line-height:1.6;color:var(--text)';
      info.innerHTML =
        'Seed: <strong>' + run.seed + '</strong><br>' +
        'Floor: <strong>' + run.floor + '</strong><br>' +
        'HP: <strong>' + run.hp + '/' + run.maxHp + '</strong><br>' +
        'Gold: <strong>' + run.gold + '</strong><br>' +
        'Relics: <strong>' + run.relics.length + '/5</strong><br>' +
        'Deck: <strong>' + run.deck.length + ' cards</strong>';
      sec.appendChild(info);
    }

    if (devSection) panel.insertBefore(sec, devSection);
    else panel.appendChild(sec);
  }

  window.addEventListener('settingsOpened', function () {
    if (run && (run.phase === 'defend' || run.phase === 'attack')) {
      pausedPhase = run.phase;
      run.phase = 'paused';
    }
    injectDungeonSettings();
  });

  window.addEventListener('settingsClosed', function () {
    var el = document.getElementById('dungeon-settings');
    if (el) el.remove();
    if (pausedPhase) {
      run.phase = pausedPhase;
      pausedPhase = null;
      renderAll();
    }
  });

  // iOS bfcache
  window.addEventListener('pageshow', function (e) {
    if (e.persisted && run) renderAll();
  });

})();
