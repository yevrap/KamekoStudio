// ═══════════════════════════════════════════════════════════════════════════
// GAMEPLAY — floor logic, combat, rewards, shop, enemy generation
// ═══════════════════════════════════════════════════════════════════════════

import { state, hasRelic, getActiveTrumpSuit, canDefend } from './state.js';
import { renderAll, renderRelics, renderEnemyCards, setStatus, spawnFloater, createCardEl } from './ui.js';
import { Card, RELIC_DEFS, MUTATION_DEFS, ENEMY_NAMES, BOSS_NAMES, displayValue, suitEmoji, shuffle } from './constants.js';

// ── DOM refs used in gameplay ──────────────────────────────────────────────

var $enemyName          = document.getElementById('enemy-name');
var $titleOverlay       = document.getElementById('title-overlay');
var $rewardOverlay      = document.getElementById('reward-overlay');
var $rewardTitle        = document.getElementById('reward-title');
var $rewardChoices      = document.getElementById('reward-choices');
var $shopOverlay        = document.getElementById('shop-overlay');
var $shopGold           = document.getElementById('shop-gold');
var $shopItems          = document.getElementById('shop-items');
var $shopDeck           = document.getElementById('shop-deck');
var $shopDeckLabel      = document.getElementById('shop-deck-label');
var $bossOverlay        = document.getElementById('boss-overlay');
var $bossName           = document.getElementById('boss-name');
var $bossMutations      = document.getElementById('boss-mutations');
var $gameoverOverlay    = document.getElementById('gameover-overlay');
var $gameoverTitle      = document.getElementById('gameover-title');
var $gameoverStats      = document.getElementById('gameover-stats');
var $gameoverSeed       = document.getElementById('gameover-seed');
var $floorTransition    = document.getElementById('floor-transition');
var $floorTransitionText = document.getElementById('floor-transition-text');

// ── Relic helpers ──────────────────────────────────────────────────────────

export function addRelic(relicDef) {
  if (state.run.relics.length >= 5) return false;
  state.run.relics.push({ id: relicDef.id, icon: relicDef.icon, name: relicDef.name, desc: relicDef.desc });
  renderRelics();
  return true;
}

// ── Overlay helpers ────────────────────────────────────────────────────────

export function hideAllOverlays() {
  $titleOverlay.classList.add('hidden');
  $rewardOverlay.classList.add('hidden');
  $shopOverlay.classList.add('hidden');
  $bossOverlay.classList.add('hidden');
  $gameoverOverlay.classList.add('hidden');
  $floorTransition.classList.add('hidden');
}

// ── Enemy generation ───────────────────────────────────────────────────────

export function generateEnemy(floor) {
  var isBoss = (floor % 5 === 0);
  var e = { hp: 0, maxHp: 0, cards: [], mutations: [], name: '' };

  if (isBoss) {
    var bossIndex = Math.floor(floor / 5) - 1;
    e.name = BOSS_NAMES[Math.min(bossIndex, BOSS_NAMES.length - 1)];
    e.maxHp = [40, 60, 80, 120][Math.min(bossIndex, 3)];
    e.hp = e.maxHp;

    var numMutations = Math.min(bossIndex + 1, 4);
    var mPool = MUTATION_DEFS.slice();
    shuffle(mPool, state.run.rng);
    for (var m = 0; m < numMutations && m < mPool.length; m++) {
      e.mutations.push(mPool[m].id);
    }

    var handSize = 6;
    var maxVal = 14;
    var minVal = 6;
    var trumpProb = 0.3;
    for (var i = 0; i < handSize; i++) {
      var val = minVal + Math.floor(state.run.rng() * (maxVal - minVal + 1));
      var suit = state.run.rng() < trumpProb ? state.run.trumpSuit : (Math.floor(state.run.rng() * 4) + 1);
      e.cards.push(new Card(val, suit));
    }
  } else {
    var act = Math.min(4, Math.ceil(floor / 5));
    var names = ENEMY_NAMES[act] || ENEMY_NAMES[1];
    e.name = names[Math.floor(state.run.rng() * names.length)];
    e.maxHp = 15 + floor * 3;
    e.hp = e.maxHp;

    var handSize = Math.min(6, 3 + Math.floor(floor / 4));
    var maxVal = Math.min(14, 9 + Math.floor(floor / 3));
    var minVal = 6;
    var trumpProb = Math.min(0.4, 0.1 + floor * 0.02);

    for (var i = 0; i < handSize; i++) {
      var val = minVal + Math.floor(state.run.rng() * (maxVal - minVal + 1));
      var suit = state.run.rng() < trumpProb ? state.run.trumpSuit : (Math.floor(state.run.rng() * 4) + 1);
      e.cards.push(new Card(val, suit));
    }
  }

  if (!hasRelic('chaos-orb')) {
    e.cards.sort(function (a, b) { return a.value - b.value; });
  } else {
    shuffle(e.cards, state.run.rng);
  }

  if (e.mutations.indexOf('relentless') !== -1 && e.cards.length < 10) {
    var extra = [];
    var minVal = 6;
    var maxVal = isBoss ? 14 : Math.min(14, 9 + Math.floor(floor / 3));
    for (var i = 0; i < Math.min(3, e.cards.length); i++) {
      extra.push(new Card(
        minVal + Math.floor(state.run.rng() * (maxVal - minVal + 1)),
        state.run.rng() < 0.3 ? state.run.trumpSuit : (Math.floor(state.run.rng() * 4) + 1)
      ));
    }
    e.cards = e.cards.concat(extra);
    if (!hasRelic('chaos-orb')) {
      e.cards.sort(function (a, b) { return a.value - b.value; });
    }
  }

  return e;
}

// ── Floor logic ────────────────────────────────────────────────────────────

export function startFloor() {
  state.run.enemy = generateEnemy(state.run.floor);
  state.run.enemyAttackIndex = 0;
  state.run.floorHitsTaken = 0;
  state.run.wildCardUsedThisFloor = false;
  state.run.defenseCards = [];
  state.run.attackDamageDealt = 0;
  state.run.lastDefendSuit = 0;
  state.run.currentTrumpOverride = null;

  if (hasRelic('blood-pact')) {
    state.run.hp = Math.max(1, state.run.hp - 2);
  }

  shuffle(state.run.deck, state.run.rng);
  var drawCount = hasRelic('magnet') ? 7 : 6;
  state.run.hand = [];
  for (var i = 0; i < drawCount && state.run.deck.length > 0; i++) {
    var card = state.run.deck.pop();
    state.run.hand.push(card);
    if (card.enhancement === 'lucky' && state.run.deck.length > 0) {
      state.run.hand.push(state.run.deck.pop());
    }
  }

  $enemyName.textContent = state.run.enemy.name;

  if (state.run.floor % 5 === 0 && state.run.enemy.mutations.length > 0) {
    showBossOverlay();
  } else {
    beginDefendPhase();
  }
}

export function showBossOverlay() {
  state.run.phase = 'boss-intro';
  $bossName.textContent = state.run.enemy.name;
  $bossMutations.innerHTML = '';
  for (var i = 0; i < state.run.enemy.mutations.length; i++) {
    var mDef = null;
    for (var j = 0; j < MUTATION_DEFS.length; j++) {
      if (MUTATION_DEFS[j].id === state.run.enemy.mutations[i]) { mDef = MUTATION_DEFS[j]; break; }
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

export function beginDefendPhase() {
  state.run.phase = 'defend';
  state.run.enemyAttackIndex = 0;

  if (state.run.enemy && state.run.enemy.mutations.indexOf('trump-shift') !== -1) {
    state.run.currentTrumpOverride = Math.floor(state.run.rng() * 4) + 1;
  }

  if (state.run.enemy && state.run.enemy.mutations.indexOf('mirror') !== -1 && state.run.lastDefendSuit > 0) {
    if (state.run.enemyAttackIndex < state.run.enemy.cards.length) {
      state.run.enemy.cards[state.run.enemyAttackIndex].suit = state.run.lastDefendSuit;
    }
  }

  hideAllOverlays();
  setStatus('Defend!', 'defend');
  renderAll();

  if (state.run.enemy.cards.length === 0) {
    beginAttackPhase();
  }
}

export function beginAttackPhase() {
  state.run.phase = 'attack';
  state.run.attackDamageDealt = 0;
  setStatus('Attack! Tap cards to deal damage', 'attack');
  renderAll();
}

// ── Combat ─────────────────────────────────────────────────────────────────

export function handleDefend(cardUid) {
  if (state.run.phase !== 'defend') return;
  if (!state.run.enemy || state.run.enemyAttackIndex >= state.run.enemy.cards.length) return;

  var cardIndex = -1;
  for (var i = 0; i < state.run.hand.length; i++) {
    if (state.run.hand[i].uid === cardUid) { cardIndex = i; break; }
  }
  if (cardIndex === -1) return;

  var card = state.run.hand[cardIndex];
  var attackCard = state.run.enemy.cards[state.run.enemyAttackIndex];

  var isWild = hasRelic('wild-card') && !state.run.wildCardUsedThisFloor;
  if (!canDefend(card, attackCard) && !isWild) return;

  if (!canDefend(card, attackCard) && isWild) {
    state.run.wildCardUsedThisFloor = true;
  }

  state.run.lastDefendSuit = card.suit;
  state.run.hand.splice(cardIndex, 1);
  state.run.defenseCards.push(card);
  state.run.stats.cardsPlayed++;

  if (card.enhancement === 'vampiric') {
    state.run.hp = Math.min(state.run.maxHp, state.run.hp + 2);
    spawnFloater(document.getElementById('hp-bar-container'), '+2', 'heal-float');
  }

  if (hasRelic('diamond-skin') && card.suit === 3) {
    state.run.hp = Math.min(state.run.maxHp, state.run.hp + 1);
    spawnFloater(document.getElementById('hp-bar-container'), '+1', 'heal-float');
  }

  if (hasRelic('recycle')) {
    state.run.deck.push(card);
  }

  state.run.enemyAttackIndex++;

  if (state.run.enemy.mutations.indexOf('mirror') !== -1 && state.run.enemyAttackIndex < state.run.enemy.cards.length) {
    state.run.enemy.cards[state.run.enemyAttackIndex].suit = card.suit;
  }

  if (state.run.enemyAttackIndex >= state.run.enemy.cards.length) {
    setTimeout(function () { beginAttackPhase(); }, 300);
  }

  renderAll();
}

export function handleTakeHit() {
  if (state.run.phase !== 'defend') return;
  if (!state.run.enemy || state.run.enemyAttackIndex >= state.run.enemy.cards.length) return;

  var attackCard = state.run.enemy.cards[state.run.enemyAttackIndex];
  var damage = attackCard.value;

  if (hasRelic('frost-armor') && state.run.floorHitsTaken === 0) {
    damage = 0;
    spawnFloater(document.getElementById('hp-bar-container'), 'Blocked!', 'heal-float');
  }

  if (hasRelic('iron-shield') && damage > 0) {
    damage = Math.max(1, damage - 1);
  }

  state.run.hp -= damage;
  state.run.floorHitsTaken++;
  state.run.stats.totalDamageTaken += damage;

  if (damage > 0) {
    spawnFloater(document.getElementById('hp-bar-container'), '-' + damage, 'player-damage');
  }

  state.run.enemyAttackIndex++;

  if (state.run.hp <= 0) {
    state.run.hp = 0;
    renderAll();
    setTimeout(endRun, 400);
    return;
  }

  if (state.run.enemyAttackIndex >= state.run.enemy.cards.length) {
    renderAll();
    setTimeout(function () { beginAttackPhase(); }, 300);
  } else {
    renderAll();
  }
}

export function handleAttack(cardUid) {
  if (state.run.phase !== 'attack') return;

  var cardIndex = -1;
  for (var i = 0; i < state.run.hand.length; i++) {
    if (state.run.hand[i].uid === cardUid) { cardIndex = i; break; }
  }
  if (cardIndex === -1) return;

  var card = state.run.hand[cardIndex];
  var damage = card.value;
  var activeTrump = getActiveTrumpSuit();

  if (card.suit === activeTrump) {
    damage += hasRelic('crown-of-trumps') ? 5 : 3;
  }
  if (hasRelic('sharp-edge')) damage += 2;
  if (hasRelic('fire-blade') && (card.value === 6 || card.value === 7)) {
    damage = damage * 2;
  }
  if (hasRelic('skull-ring')) damage += state.run.floorHitsTaken;
  if (hasRelic('blood-pact')) damage += 4;
  if (hasRelic('precision') && card.value >= 11) damage += 3;
  if (card.enhancement === 'burning') damage += 3;

  if (card.enhancement === 'vampiric') {
    state.run.hp = Math.min(state.run.maxHp, state.run.hp + 2);
    spawnFloater(document.getElementById('hp-bar-container'), '+2', 'heal-float');
  }

  if (state.run.enemy && state.run.enemy.mutations.indexOf('armored') !== -1) {
    damage = Math.floor(damage / 2);
  }

  state.run.enemy.hp -= damage;
  state.run.attackDamageDealt += damage;
  state.run.stats.totalDamageDealt += damage;
  state.run.stats.cardsPlayed++;
  state.run.hand.splice(cardIndex, 1);

  spawnFloater(document.getElementById('enemy-hp-container'), '-' + damage, 'enemy-damage');
  renderAll();
}

export function handleEndAttack() {
  if (state.run.phase !== 'attack') return;

  if (state.run.enemy && state.run.enemy.mutations.indexOf('regenerate') !== -1) {
    state.run.enemy.hp = Math.min(state.run.enemy.maxHp, state.run.enemy.hp + 5);
  }

  while (state.run.hand.length > 0) {
    state.run.deck.push(state.run.hand.pop());
  }

  if (state.run.enemy.hp <= 0) {
    floorCleared();
  } else {
    // Enemy survived — re-deal hand and generate new enemy cards for next round
    shuffle(state.run.deck, state.run.rng);
    var drawCount = hasRelic('magnet') ? 7 : 6;
    for (var i = 0; i < drawCount && state.run.deck.length > 0; i++) {
      var card = state.run.deck.pop();
      state.run.hand.push(card);
      if (card.enhancement === 'lucky' && state.run.deck.length > 0) {
        state.run.hand.push(state.run.deck.pop());
      }
    }

    var floor = state.run.floor;
    var isBoss = (floor % 5 === 0);
    var maxVal = isBoss ? 14 : Math.min(14, 9 + Math.floor(floor / 3));
    var minVal = 6;
    var trumpProb = isBoss ? 0.3 : Math.min(0.4, 0.1 + floor * 0.02);
    var handSize = isBoss ? 6 : Math.min(6, 3 + Math.floor(floor / 4));

    state.run.enemy.cards = [];
    for (var i = 0; i < handSize; i++) {
      var val = minVal + Math.floor(state.run.rng() * (maxVal - minVal + 1));
      var suit = state.run.rng() < trumpProb ? state.run.trumpSuit : (Math.floor(state.run.rng() * 4) + 1);
      state.run.enemy.cards.push(new Card(val, suit));
    }
    if (!hasRelic('chaos-orb')) {
      state.run.enemy.cards.sort(function (a, b) { return a.value - b.value; });
    }

    if (state.run.enemy.mutations.indexOf('trump-shift') !== -1) {
      state.run.currentTrumpOverride = Math.floor(state.run.rng() * 4) + 1;
    }

    state.run.enemyAttackIndex = 0;
    state.run.phase = 'defend';
    setStatus('Defend!', 'defend');
    renderAll();
  }
}

// ── Floor clearing & advancement ───────────────────────────────────────────

export function floorCleared() {
  state.run.stats.floorsCleared++;
  state.run.stats.enemiesDefeated++;

  var goldEarned = 5;
  if (state.run.floorHitsTaken === 0) goldEarned += 10;
  if (hasRelic('gold-tooth')) goldEarned += 5;
  state.run.gold += goldEarned;
  state.run.stats.goldEarned += goldEarned;

  while (state.run.hand.length > 0) {
    state.run.deck.push(state.run.hand.pop());
  }

  var best = parseInt(localStorage.getItem('durakDungeon_bestFloor') || '0', 10);
  if (state.run.floor > best) localStorage.setItem('durakDungeon_bestFloor', String(state.run.floor));

  if (state.run.floor >= 20) {
    var victories = parseInt(localStorage.getItem('durakDungeon_victories') || '0', 10);
    localStorage.setItem('durakDungeon_victories', String(victories + 1));
    state.run.phase = 'victory';
    showGameOver(true);
    return;
  }

  if (state.run.floor % 3 === 0) {
    showRewards(function () { showShop(); });
  } else {
    showRewards(function () { advanceFloor(); });
  }
}

export function advanceFloor() {
  state.run.floor++;
  state.run.enemy = null;
  state.run.phase = 'transition';

  $floorTransitionText.textContent = 'FLOOR ' + state.run.floor;
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

// ── Rewards ────────────────────────────────────────────────────────────────

export function showRewards(onDone) {
  state.run.phase = 'rewards';
  hideAllOverlays();

  var isBoss = ((state.run.floor) % 5 === 0);
  $rewardTitle.textContent = isBoss ? 'BOSS DEFEATED!' : 'FLOOR ' + state.run.floor + ' CLEARED!';

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
  var floor = state.run.floor;

  var cardVal = Math.min(14, 6 + Math.floor(state.run.rng() * (3 + Math.floor(floor / 3))));
  var cardSuit = Math.floor(state.run.rng() * 4) + 1;
  var enhancement = null;
  if (state.run.rng() < 0.2) {
    var enhancements = ['burning', 'armored', 'vampiric', 'lucky'];
    enhancement = enhancements[Math.floor(state.run.rng() * enhancements.length)];
  }
  var rewardCard = new Card(cardVal, cardSuit, enhancement);
  choices.push({
    type: 'card',
    icon: displayValue(rewardCard.value) + suitEmoji(rewardCard.suit),
    label: enhancement ? enhancement : 'Card',
    desc: 'Add to your deck',
    card: rewardCard
  });

  if (state.run.rng() < 0.5) {
    var goldAmt = 10 + Math.floor(state.run.rng() * 16);
    choices.push({ type: 'gold', icon: '🪙', label: '+' + goldAmt + ' Gold', desc: 'For the shop', amount: goldAmt });
  } else {
    var healAmt = 5 + Math.floor(state.run.rng() * 6);
    choices.push({ type: 'heal', icon: '❤️', label: '+' + healAmt + ' HP', desc: 'Restore health', amount: healAmt });
  }

  if (state.run.rng() < 0.15 && state.run.relics.length < 5) {
    var available = RELIC_DEFS.filter(function (r) { return !hasRelic(r.id); });
    if (available.length > 0) {
      var relicDef = available[Math.floor(state.run.rng() * available.length)];
      choices.push({ type: 'relic', icon: relicDef.icon, label: relicDef.name, desc: relicDef.desc, relicDef: relicDef });
    } else {
      pushFallbackReward(choices);
    }
  } else {
    pushFallbackReward(choices);
  }

  return choices;
}

function pushFallbackReward(choices) {
  if (state.run.rng() < 0.5) {
    var goldAmt = 8 + Math.floor(state.run.rng() * 13);
    choices.push({ type: 'gold', icon: '🪙', label: '+' + goldAmt + ' Gold', desc: 'For the shop', amount: goldAmt });
  } else {
    var healAmt = 5 + Math.floor(state.run.rng() * 6);
    choices.push({ type: 'heal', icon: '❤️', label: '+' + healAmt + ' HP', desc: 'Restore health', amount: healAmt });
  }
}

export function applyReward(ch) {
  if (ch.type === 'card') {
    state.run.deck.push(ch.card);
  } else if (ch.type === 'gold') {
    state.run.gold += ch.amount;
    state.run.stats.goldEarned += ch.amount;
  } else if (ch.type === 'heal') {
    state.run.hp = Math.min(state.run.maxHp, state.run.hp + ch.amount);
  } else if (ch.type === 'relic') {
    addRelic(ch.relicDef);
  }
}

// ── Shop ───────────────────────────────────────────────────────────────────

var shopAction = null;

export function showShop() {
  state.run.phase = 'shop';
  shopAction = null;
  hideAllOverlays();
  renderShop();
  $shopOverlay.classList.remove('hidden');
}

export function renderShop() {
  $shopGold.textContent = 'Gold: ' + state.run.gold;
  $shopItems.innerHTML = '';
  $shopDeck.innerHTML = '';
  $shopDeckLabel.classList.add('hidden');

  var items = [
    { id: 'remove',  label: 'Remove a Card',          cost: 15 },
    { id: 'upgrade', label: 'Upgrade a Card (+1 value)', cost: 20 },
    { id: 'heal',    label: 'Heal 10 HP',              cost: 10 },
    { id: 'relic',   label: 'Random Relic',            cost: 30 }
  ];

  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var div = document.createElement('div');
    div.className = 'shop-item';
    if (state.run.gold < item.cost) div.classList.add('disabled');
    if (item.id === 'relic' && state.run.relics.length >= 5) div.classList.add('disabled');
    if (item.id === 'heal' && state.run.hp >= state.run.maxHp) div.classList.add('disabled');
    if (shopAction === item.id) div.classList.add('shop-selected');
    div.dataset.action = item.id;
    div.dataset.cost = item.cost;
    div.innerHTML = '<span class="shop-item-label">' + item.label + '</span>' +
      '<span class="shop-item-cost">' + item.cost + ' 🪙</span>';
    $shopItems.appendChild(div);
  }

  if (shopAction === 'remove' || shopAction === 'upgrade') {
    $shopDeckLabel.classList.remove('hidden');
    $shopDeckLabel.textContent = shopAction === 'remove' ? 'Tap a card to remove' : 'Tap a card to upgrade';
    var sorted = state.run.deck.slice().sort(function (a, b) {
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

export function handleShopClick(e) {
  if (state.run.phase !== 'shop') return;

  var itemEl = e.target.closest('.shop-item');
  if (itemEl && !itemEl.classList.contains('disabled')) {
    var action = itemEl.dataset.action;
    var cost = parseInt(itemEl.dataset.cost, 10);

    if (action === 'heal') {
      state.run.gold -= cost;
      state.run.hp = Math.min(state.run.maxHp, state.run.hp + 10);
      shopAction = null;
      renderShop();
      return;
    }

    if (action === 'relic') {
      var available = RELIC_DEFS.filter(function (r) { return !hasRelic(r.id); });
      if (available.length > 0) {
        state.run.gold -= cost;
        var pick = available[Math.floor(state.run.rng() * available.length)];
        addRelic(pick);
        shopAction = null;
        renderShop();
      }
      return;
    }

    shopAction = (shopAction === action) ? null : action;
    renderShop();
    return;
  }

  var cardEl = e.target.closest('#shop-deck .card-btn');
  if (cardEl && shopAction) {
    var uid = cardEl.dataset.uid;
    var cost = shopAction === 'remove' ? 15 : 20;
    if (state.run.gold < cost) return;

    for (var i = 0; i < state.run.deck.length; i++) {
      if (state.run.deck[i].uid === uid) {
        if (shopAction === 'remove') {
          state.run.gold -= cost;
          state.run.deck.splice(i, 1);
        } else if (shopAction === 'upgrade') {
          if (state.run.deck[i].value < 14) {
            state.run.gold -= cost;
            state.run.deck[i].value++;
          }
        }
        break;
      }
    }
    shopAction = null;
    renderShop();
  }
}

// ── Game over ──────────────────────────────────────────────────────────────

export function endRun() {
  state.run.phase = 'gameover';
  showGameOver(false);
}

export function showGameOver(victory) {
  hideAllOverlays();
  $gameoverTitle.textContent = victory ? 'VICTORY!' : 'DEFEAT';
  $gameoverStats.innerHTML =
    '<div>Floor reached: ' + state.run.floor + '</div>' +
    '<div>Enemies defeated: ' + state.run.stats.enemiesDefeated + '</div>' +
    '<div>Damage dealt: ' + state.run.stats.totalDamageDealt + '</div>' +
    '<div>Damage taken: ' + state.run.stats.totalDamageTaken + '</div>' +
    '<div>Gold earned: ' + state.run.stats.goldEarned + '</div>' +
    '<div>Relics: ' + state.run.relics.length + '/5</div>';
  $gameoverSeed.textContent = 'Seed: ' + state.run.seed;
  localStorage.setItem('durakDungeon_lastSeed', state.run.seed);
  $gameoverOverlay.classList.remove('hidden');
}
