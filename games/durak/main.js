// ═══════════════════════════════════════════════════════════════════════════
// MAIN — event wiring, start/restart, settings integration, tick orchestration
// ═══════════════════════════════════════════════════════════════════════════

import { state, newGame, getPlayer, isTrump } from './state.js';
import { suitName } from './constants.js';
import { buildCardFaceSvg } from './cards.js';
import {
  renderAll, hideOverlays, showGameOver, cacheDom,
  showPassDevice, hidePassDevice
} from './ui.js';
import {
  playAttack, playDefense, passAttack, declareTake,
  pileOnPass, checkGameOver, dealInitial, legalDefense, legalAttack, getMatchStats,
  legalTransfer, playTransfer
} from './gameplay.js';
import { scheduleAiAction, clearAiTimeout } from './ai.js';

// ── Persisted setup ────────────────────────────────────────────────────────

var savedMode  = localStorage.getItem('durak_mode') || 'ai';
if (savedMode !== 'ai' && savedMode !== 'hotseat') savedMode = 'ai';
var savedCount = parseInt(localStorage.getItem('durak_playerCount'), 10);
if (!(savedCount >= 2 && savedCount <= 6)) savedCount = 2;

var setupMode  = savedMode;
var setupCount = savedCount;

cacheDom();

// Keep iOS PWA status-bar / Android theme-color in sync with the in-game
// light/dark toggle (settings.js mutates body.dark-mode without firing an event).
(function syncThemeColor() {
  var meta = document.querySelector('meta[name="theme-color"]:not([media])');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  function apply() {
    meta.setAttribute('content', document.body.classList.contains('dark-mode') ? '#070b08' : '#8ba994');
  }
  apply();
  new MutationObserver(apply).observe(document.body, { attributes: true, attributeFilter: ['class'] });
})();

var $modeToggle   = document.getElementById('mode-toggle');
var $countToggle  = document.getElementById('count-toggle');
var $btnPlay      = document.getElementById('btn-play');
var $btnReplay    = document.getElementById('btn-replay');
var $passOverlay  = document.getElementById('pass-device-overlay');
var $humanHand    = document.getElementById('human-hand');
var $humanOptions = document.getElementById('human-options');

if (window.$btnCloseLog) {
  window.$btnCloseLog.addEventListener('click', function() {
    window.$logOverlay.classList.add('hidden');
  });
}

if (window.$btnCloseRules) {
  window.$btnCloseRules.addEventListener('click', function() {
    window.$rulesOverlay.classList.add('hidden');
  });
}

function applyActive(container, attr, value) {
  var btns = container.querySelectorAll('[' + attr + ']');
  for (var i = 0; i < btns.length; i++) {
    btns[i].classList.toggle('active', btns[i].getAttribute(attr) === String(value));
  }
}

applyActive($modeToggle,  'data-mode',  setupMode);
applyActive($countToggle, 'data-count', setupCount);

$modeToggle.addEventListener('pointerdown', function (e) {
  var btn = e.target.closest('.mode-btn');
  if (!btn) return;
  e.preventDefault();
  setupMode = btn.dataset.mode;
  localStorage.setItem('durak_mode', setupMode);
  applyActive($modeToggle, 'data-mode', setupMode);
});

$countToggle.addEventListener('pointerdown', function (e) {
  var btn = e.target.closest('.count-btn');
  if (!btn) return;
  e.preventDefault();
  setupCount = parseInt(btn.dataset.count, 10);
  localStorage.setItem('durak_playerCount', String(setupCount));
  applyActive($countToggle, 'data-count', setupCount);
});

// ── Rules toggles (start screen) ────────────────────────────────────────────
// Perevodnoy is a match rule read at game init (state.js), so it belongs on
// the setup screen, not the mid-game drawer.

var $setupPerevodnoy = document.getElementById('setup-perevodnoy');
var $setupFirstTransfer = document.getElementById('setup-first-transfer');
var $setupFirstTransferRow = document.getElementById('setup-first-transfer-row');
var $setupAutoPlay = document.getElementById('setup-autoplay');
var $setupAutoRestart = document.getElementById('setup-autorestart');

function syncRuleTogglesUI() {
  $setupPerevodnoy.checked = localStorage.getItem('durak_perevodnoy') === 'true';
  $setupFirstTransfer.checked = localStorage.getItem('durak_first_transfer') === 'true';
  if ($setupAutoPlay) $setupAutoPlay.checked = localStorage.getItem('durak_autoPlay') === 'true';
  if ($setupAutoRestart) $setupAutoRestart.checked = localStorage.getItem('durak_autoRestart') === 'true';
  var on = $setupPerevodnoy.checked;
  $setupFirstTransferRow.style.opacity = on ? '1' : '0.5';
  $setupFirstTransferRow.style.pointerEvents = on ? 'auto' : 'none';
}

$setupPerevodnoy.addEventListener('change', function (e) {
  localStorage.setItem('durak_perevodnoy', e.target.checked ? 'true' : 'false');
  syncRuleTogglesUI();
});
$setupFirstTransfer.addEventListener('change', function (e) {
  localStorage.setItem('durak_first_transfer', e.target.checked ? 'true' : 'false');
});
if ($setupAutoPlay) {
  $setupAutoPlay.addEventListener('change', function (e) {
    localStorage.setItem('durak_autoPlay', e.target.checked ? 'true' : 'false');
  });
}
if ($setupAutoRestart) {
  $setupAutoRestart.addEventListener('change', function (e) {
    localStorage.setItem('durak_autoRestart', e.target.checked ? 'true' : 'false');
  });
}
syncRuleTogglesUI();

// ── Names Modal ────────────────────────────────────────────────────────────

var $btnEditNames = document.getElementById('btn-edit-names');
var $namesOverlay = document.getElementById('names-overlay');
var $namesGrid = document.getElementById('names-grid');
var $namesSubtitle = document.getElementById('names-subtitle');
var $btnNamesDone = document.getElementById('btn-names-done');
var $btnNamesReset = document.getElementById('btn-names-reset');

function populateNamesModal() {
  if (!$namesGrid) return;
  $namesGrid.innerHTML = '';
  var modeStr = setupMode === 'hotseat' ? 'Hot-seat' : 'vs Computer';
  $namesSubtitle.textContent = modeStr + ' — ' + setupCount + ' players';

  for (var i = 0; i < setupCount; i++) {
    var defName;
    if (i === 0) defName = (setupMode === 'hotseat') ? 'Player 1' : 'You';
    else defName = (setupMode === 'hotseat') ? ('Player ' + (i + 1)) : ('CPU ' + i);

    var custom = localStorage.getItem('durak_name_' + setupMode + '_' + i) || '';
    
    var group = document.createElement('div');
    group.className = 'name-input-group';
    
    var lbl = document.createElement('label');
    lbl.textContent = 'Seat ' + (i + 1);
    
    var inp = document.createElement('input');
    inp.type = 'text';
    inp.maxLength = 15;
    inp.dataset.seat = i;
    inp.dataset.mode = setupMode;
    inp.placeholder = defName;
    inp.value = custom;
    
    inp.addEventListener('input', function(e) {
      var val = e.target.value.trim();
      var key = 'durak_name_' + e.target.dataset.mode + '_' + e.target.dataset.seat;
      if (val === '') {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, val);
      }
    });
    
    group.appendChild(lbl);
    group.appendChild(inp);
    $namesGrid.appendChild(group);
  }
}

if ($btnEditNames) {
  $btnEditNames.addEventListener('click', function(e) {
    e.preventDefault();
    populateNamesModal();
    $namesOverlay.classList.remove('hidden');
  });
}

if ($btnNamesDone) {
  $btnNamesDone.addEventListener('click', function(e) {
    e.preventDefault();
    $namesOverlay.classList.add('hidden');
  });
}

if ($btnNamesReset) {
  $btnNamesReset.addEventListener('click', function(e) {
    e.preventDefault();
    for (var i = 0; i < setupCount; i++) {
      localStorage.removeItem('durak_name_' + setupMode + '_' + i);
    }
    populateNamesModal();
  });
}

// ── Tick ───────────────────────────────────────────────────────────────────

function tick() {
  renderAll();
  if (checkGameOver()) {
    clearAiTimeout();
    showGameOver(state.winnerText, getMatchStats());
    renderAll();
    if (localStorage.getItem('durak_autoRestart') === 'true') {
      setTimeout(function() {
        if (state.phase === 'gameover') spendTokenAndStart();
      }, 2500);
    }
    return;
  }
  if (state.phase === 'passDevice') return;      // waiting on user tap
  if (state.phase === 'paused') return;
  if (state.phase !== 'playing' && state.phase !== 'pileOn') return;

  var p = getPlayer(state.prioritySeat);
  if (!p) return;
  if (p.isHuman && localStorage.getItem('durak_autoPlay') !== 'true') return;
  scheduleAiAction(state.prioritySeat, tick);
}

// Remember pre-pause phase so settings-close resumes into the same state.
var prevStatePhase = 'playing';

// Called after a human action mutates state. Transfers control to the next
// actor, inserting a pass-device cover if hot-seat play just moved between
// two different humans (3+ player tables only).
function handleAfterAction(actorSeat) {
  if (checkGameOver()) { tick(); return; }
  var canCover = state.mode === 'hotseat'
                && (state.phase === 'playing' || state.phase === 'pileOn');
  if (!canCover) { tick(); return; }
  var next = getPlayer(state.prioritySeat);
  if (!next || !next.isHuman || state.prioritySeat === actorSeat) { tick(); return; }
  var resumePhase = state.phase;
  state.passDeviceSender = actorSeat;
  state.phase = 'passDevice';
  state.pendingReveal = { seat: state.prioritySeat, resumePhase: resumePhase };
  showPassDevice(next.name);
  renderAll();
}

// ── Overlay taps: pass-device cover ────────────────────────────────────────

$passOverlay.addEventListener('pointerdown', function (e) {
  e.preventDefault();
  if (state.phase !== 'passDevice') return;
  var resumePhase = (state.pendingReveal && state.pendingReveal.resumePhase) || 'playing';
  state.phase = resumePhase;
  state.passDeviceSender = null;
  state.pendingReveal = null;
  hidePassDevice();
  tick();
});

// ── Action buttons ─────────────────────────────────────────────────────────

$humanOptions.addEventListener('pointerdown', function (e) {
  var btn = e.target.closest('.action-btn');
  if (!btn || btn.classList.contains('hidden')) return;
  e.preventDefault();
  if (state.phase !== 'playing' && state.phase !== 'pileOn') return;
  var seat = parseInt(btn.dataset.seat, 10);
  if (!isFinite(seat)) return;
  if (state.prioritySeat !== seat) return;

  var action = btn.dataset.action;
  var ok = false;
  if (action === 'take') ok = declareTake(seat);
  else if (action === 'pass') ok = passAttack(seat);
  else if (action === 'done') ok = pileOnPass(seat);
  if (!ok) return;
  handleAfterAction(seat);
});

// ── Hand tap / drag-to-play ────────────────────────────────────────────────

var tapStart = null;
var TAP_MAX_DIST_SQ = 64;

$humanHand.addEventListener('pointerdown', function (e) {
  if (state.phase !== 'playing' && state.phase !== 'pileOn') return;
  var cardBtn = e.target.closest('.card-btn');
  if (!cardBtn) return;
  tapStart = {
    x: e.clientX, y: e.clientY, id: e.pointerId,
    cardId: cardBtn.dataset.cardId,
    seat: parseInt(cardBtn.dataset.seat, 10)
  };
});

$humanHand.addEventListener('pointerup', function (e) {
  if (!tapStart || e.pointerId !== tapStart.id) return;
  var start = tapStart;
  tapStart = null;
  if (state.phase !== 'playing' && state.phase !== 'pileOn') return;
  var dx = e.clientX - start.x;
  var dy = e.clientY - start.y;
  if (dx * dx + dy * dy > TAP_MAX_DIST_SQ) return;

  var seat = start.seat;
  if (!isFinite(seat)) return;
  if (state.prioritySeat !== seat) return;
  if (!getPlayer(seat) || !getPlayer(seat).isHuman) return;

  var card = null;
  var hand = getPlayer(seat).hand;
  for (var i = 0; i < hand.length; i++) if (hand[i].id === start.cardId) { card = hand[i]; break; }
  if (!card) return;

  var ok = false;
  if (seat === state.defenderSeat && state.phase === 'playing') {
    var canTransfer = legalTransfer(seat, card);
    var canBeatIt = legalDefense(seat, card);
    if (canTransfer && canBeatIt) { showChoice(seat, card); return; }
    if (canTransfer) {
      ok = playTransfer(seat, start.cardId);
    } else if (canBeatIt) {
      ok = playDefense(seat, start.cardId);
    }
  } else if (legalAttack(seat, card)) {
    ok = playAttack(seat, start.cardId);
  }
  if (!ok) return;
  handleAfterAction(seat);
});

$humanHand.addEventListener('pointercancel', function () { tapStart = null; });

// ── Transfer-or-beat choice (perevodnoy) ───────────────────────────────────
// A trump card matching the attack rank can either transfer the bout or beat
// the attack — the defender picks; auto-transferring was taking the choice away.

var $choiceOverlay = document.getElementById('choice-overlay');
var $choiceCard = document.getElementById('choice-card');
var pendingChoice = null;

function showChoice(seat, card) {
  pendingChoice = { seat: seat, cardId: card.id };
  $choiceCard.className = 'card-btn suit-' + suitName(card.suit) + (isTrump(card.suit) ? ' trump-card' : '');
  $choiceCard.innerHTML = buildCardFaceSvg(card.suit, card.value);
  $choiceOverlay.classList.remove('hidden');
}

function hideChoice() {
  pendingChoice = null;
  $choiceOverlay.classList.add('hidden');
}

function resolveChoice(action) {
  if (!pendingChoice) return;
  var pc = pendingChoice;
  hideChoice();
  var ok = action === 'transfer' ? playTransfer(pc.seat, pc.cardId) : playDefense(pc.seat, pc.cardId);
  if (ok) handleAfterAction(pc.seat);
}

document.getElementById('btn-choice-transfer').addEventListener('pointerdown', function (e) {
  e.preventDefault();
  e.stopPropagation();
  resolveChoice('transfer');
});
document.getElementById('btn-choice-beat').addEventListener('pointerdown', function (e) {
  e.preventDefault();
  e.stopPropagation();
  resolveChoice('beat');
});
$choiceOverlay.addEventListener('pointerdown', function (e) {
  if (e.target === $choiceOverlay) hideChoice();
});

// ── Start / restart ────────────────────────────────────────────────────────

function startGame() {
  clearAiTimeout();
  hideChoice();
  newGame(setupMode, setupCount);
  dealInitial();
  hideOverlays();
  // Hot-seat: show pass-device for the first human actor so no
  // one sees the others' hands during the opening tap.
  if (state.mode === 'hotseat') {
    state.passDeviceSender = state.prioritySeat;
    state.phase = 'passDevice';
    state.pendingReveal = { seat: state.prioritySeat, resumePhase: 'playing' };
    showPassDevice(getPlayer(state.prioritySeat).name);
    renderAll();
  } else {
    tick();
  }
}

function spendTokenAndStart() {
  if (!window.KamekoTokens || !window.KamekoTokens.spend()) {
    if (window.KamekoTokens) window.KamekoTokens.toast();
    return;
  }
  localStorage.setItem('lastPlayed_durak', Date.now());
  startGame();
}

$btnPlay.addEventListener('pointerdown', function (e) {
  e.preventDefault();
  spendTokenAndStart();
});

$btnReplay.addEventListener('pointerdown', function (e) {
  e.preventDefault();
  spendTokenAndStart();
});

// ── Settings panel integration ─────────────────────────────────────────────

function injectDurakSettings() {
  if (!window.KamekoSettings) return;

  window.KamekoSettings.registerSection('durak-quick-actions', {
    title: 'Quick Actions',
    render: function(container) {
      var btnRules = document.createElement('button');
      btnRules.className = 'settings-btn';
      btnRules.textContent = '❓ Rules of Durak';
      btnRules.addEventListener('click', function() {
        window.KamekoSettings.closeDrawer();
        window.$rulesOverlay.classList.remove('hidden');
      });
      container.appendChild(btnRules);

      var btnLog = document.createElement('button');
      btnLog.className = 'settings-btn';
      btnLog.textContent = '📜 Game Log';
      btnLog.addEventListener('click', function() {
        window.KamekoSettings.closeDrawer();
        import('./log.js').then(logModule => {
          var html = '';
          var lastBout = 0;
          for (var i = 0; i < state.log.length; i++) {
            var e = state.log[i];
            if (e.bout !== lastBout) {
              html += `<div style="margin-top:12px; font-weight:bold; color:var(--text-muted); border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:4px; margin-bottom:4px;">Bout ${e.bout}</div>`;
              lastBout = e.bout;
            }
            html += `<div style="padding:4px 0;">${logModule.eventText(e)}</div>`;
          }
          window.$logBody.innerHTML = html;
          window.$logOverlay.classList.remove('hidden');
        });
      });
      container.appendChild(btnLog);

      // Coach hints: quick action, not a settings toggle (drawer-UX Q5).
      var btnCoach = document.createElement('button');
      btnCoach.className = 'settings-btn';
      function coachLabel() {
        return localStorage.getItem('durak_coach') === 'true' ? '🧭 Turn off Coach Hints' : '🧭 Turn on Coach Hints';
      }
      btnCoach.textContent = coachLabel();
      btnCoach.addEventListener('click', function() {
        var on = localStorage.getItem('durak_coach') === 'true';
        localStorage.setItem('durak_coach', on ? 'false' : 'true');
        btnCoach.textContent = coachLabel();
        renderAll();
      });
      container.appendChild(btnCoach);

      // Auto Play toggle
      var btnAutoPlay = document.createElement('button');
      btnAutoPlay.className = 'settings-btn';
      function autoPlayLabel() {
        return localStorage.getItem('durak_autoPlay') === 'true' ? '🤖 Turn off Auto Play' : '🤖 Turn on Auto Play';
      }
      btnAutoPlay.textContent = autoPlayLabel();
      btnAutoPlay.addEventListener('click', function() {
        var on = localStorage.getItem('durak_autoPlay') === 'true';
        localStorage.setItem('durak_autoPlay', on ? 'false' : 'true');
        btnAutoPlay.textContent = autoPlayLabel();
        if (typeof syncRuleTogglesUI === 'function') syncRuleTogglesUI();
        if (!on && state.phase === 'playing') tick(); // trigger turn if we just turned it on
      });
      container.appendChild(btnAutoPlay);
    }
  });

  // Match-scoped section: only rendered while a round is actually underway.
  // On the start menu there is no current match — mode/players/rules live on
  // the setup screen itself (drawer-UX p1-18).
  window.KamekoSettings.registerSection('durak', {
    title: function() {
      return 'Current Match: ' + (state.mode === 'hotseat' ? 'Hot-seat' : 'vs Computer') + ' (' + state.playerCount + ' players)';
    },
    when: function() {
      return state.phase !== 'start' && state.phase !== 'gameover';
    },
    render: function(container) {
      if (state.mode === 'ai') {
        var diffLabel = document.createElement('div');
        diffLabel.style.cssText = 'font-size:0.7em;color:rgba(255,255,255,0.5);letter-spacing:0.1em;text-transform:uppercase;font-family:sans-serif;margin-bottom:6px;';
        diffLabel.textContent = 'AI Difficulty';
        container.appendChild(diffLabel);

        var diffToggle = document.createElement('div');
        diffToggle.className = 'mode-toggle';
        var diffs = ['easy', 'normal', 'hard'];
        var diffNames = ['Easy', 'Normal', 'Hard'];
        var currentDiff = localStorage.getItem('durak_difficulty') || 'normal';

        for (var i = 0; i < diffs.length; i++) {
          (function(d, name) {
            var btn = document.createElement('button');
            btn.className = 'mode-btn' + (currentDiff === d ? ' active' : '');
            btn.type = 'button';
            btn.dataset.diff = d;
            btn.textContent = name;
            btn.addEventListener('click', function(e) {
              e.preventDefault();
              localStorage.setItem('durak_difficulty', d);
              var btns = diffToggle.querySelectorAll('.mode-btn');
              for (var j = 0; j < btns.length; j++) {
                btns[j].classList.toggle('active', btns[j].dataset.diff === d);
              }
            });
            diffToggle.appendChild(btn);
          })(diffs[i], diffNames[i]);
        }
        container.appendChild(diffToggle);
      }

      var sortLabel = document.createElement('div');
      sortLabel.style.cssText = 'font-size:0.7em;color:rgba(255,255,255,0.5);letter-spacing:0.1em;text-transform:uppercase;font-family:sans-serif;margin:12px 0 6px;';
      sortLabel.textContent = 'Hand Sort';
      container.appendChild(sortLabel);

      var sortToggle = document.createElement('div');
      sortToggle.className = 'mode-toggle';
      var sorts = ['none', 'suit', 'strength'];
      var sortNames = ['Off', 'Suit', 'Strength'];
      var currentSort = localStorage.getItem('durak_sort') || 'none';

      for (var s = 0; s < sorts.length; s++) {
        (function(mode, name) {
          var btn = document.createElement('button');
          btn.className = 'mode-btn' + (currentSort === mode ? ' active' : '');
          btn.type = 'button';
          btn.dataset.sort = mode;
          btn.textContent = name;
          btn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.setItem('durak_sort', mode);
            var btns = sortToggle.querySelectorAll('.mode-btn');
            for (var j = 0; j < btns.length; j++) {
              btns[j].classList.toggle('active', btns[j].dataset.sort === mode);
            }
            renderAll();
          });
          sortToggle.appendChild(btn);
        })(sorts[s], sortNames[s]);
      }
      container.appendChild(sortToggle);

      var btnEnd = document.createElement('button');
      btnEnd.className = 'settings-danger-btn';
      btnEnd.style.marginTop = '12px';
      btnEnd.textContent = 'End round & back to menu';
      btnEnd.addEventListener('click', function(e) {
        e.preventDefault();
        window.KamekoSettings.closeDrawer();
        clearAiTimeout();
        state.phase = 'gameover';
        var startOverlay = document.getElementById('start-overlay');
        if (startOverlay) startOverlay.classList.remove('hidden');
        var gameoverOverlay = document.getElementById('gameover-overlay');
        if (gameoverOverlay) gameoverOverlay.classList.add('hidden');
      });
      container.appendChild(btnEnd);
    }
  });
}

// Sections are registered once at boot; the drawer re-renders them on every
// open, so the listeners below only handle pause/resume.
window.addEventListener('settingsOpened', function () {
  clearAiTimeout();
  hideChoice();
  if (state.phase === 'playing' || state.phase === 'pileOn' || state.phase === 'passDevice') {
    prevStatePhase = state.phase;
    state.phase = 'paused';
  }
  renderAll();
});

window.addEventListener('settingsClosed', function () {
  if (state.phase === 'paused') {
    state.phase = prevStatePhase || 'playing';
    renderAll();
    tick();
  }
});

// ── iOS bfcache ────────────────────────────────────────────────────────────

window.addEventListener('pageshow', function (e) { if (e.persisted) renderAll(); });

// Initial render (start overlay is already visible in HTML).
renderAll();
injectDurakSettings();
