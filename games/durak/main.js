// ═══════════════════════════════════════════════════════════════════════════
// MAIN — event wiring, start/restart, settings integration, tick orchestration
// ═══════════════════════════════════════════════════════════════════════════

import { state, newGame, getPlayer } from './state.js';
import {
  renderAll, hideOverlays, showGameOver, cacheDom,
  showPassDevice, hidePassDevice, localizeStatic
} from './ui.js';
import {
  playAttack, playDefense, passAttack, declareTake,
  pileOnPass, checkGameOver, dealInitial, legalDefense, legalAttack, getMatchStats,
  legalTransfer, playTransfer, forcedAction, playForcedAction, defenseTargets
} from './gameplay.js';
import { scheduleAiAction, scheduleForcedAction, clearAiTimeout } from './ai.js';
import { t, getLang, setLang, defaultPlayerName } from './i18n.js';

// ── Persisted setup ────────────────────────────────────────────────────────

var savedMode  = localStorage.getItem('durak_mode') || 'ai';
if (savedMode !== 'ai' && savedMode !== 'hotseat') savedMode = 'ai';
var savedCount = parseInt(localStorage.getItem('durak_playerCount'), 10);
if (!(savedCount >= 2 && savedCount <= 6)) savedCount = 2;

var setupMode  = savedMode;
var setupCount = savedCount;

cacheDom();
localizeStatic();

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
var $btnWatch     = document.getElementById('btn-watch');
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

function syncRuleTogglesUI() {
  $setupPerevodnoy.checked = localStorage.getItem('durak_perevodnoy') === 'true';
  $setupFirstTransfer.checked = localStorage.getItem('durak_first_transfer') === 'true';
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
  $namesSubtitle.textContent = t('names.subtitle', setupMode, setupCount);

  for (var i = 0; i < setupCount; i++) {
    var defName = defaultPlayerName(setupMode, i);

    var custom = localStorage.getItem('durak_name_' + setupMode + '_' + i) || '';

    var group = document.createElement('div');
    group.className = 'name-input-group';

    var lbl = document.createElement('label');
    lbl.textContent = t('names.seat', i + 1);
    
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

// Seat names are assigned once at newGame() time (defaultPlayerName), so a
// mid-match language switch would otherwise leave already-seated default
// names in the old language while everything rendered around them updates
// live. Re-derive any name that hasn't been overridden by the player.
function refreshDefaultPlayerNames() {
  for (var i = 0; i < state.players.length; i++) {
    var custom = localStorage.getItem('durak_name_' + state.mode + '_' + i);
    if (!custom) state.players[i].name = defaultPlayerName(state.mode, i);
  }
}

// ── Tick ───────────────────────────────────────────────────────────────────

function tick() {
  state.selection = null;
  renderAll();
  if (checkGameOver()) {
    clearAiTimeout();
    showGameOver(state.winnerOutcome, getMatchStats());
    renderAll();
    if (localStorage.getItem('durak_autoRestart') === 'true') {
      setTimeout(function() {
        if (state.phase === 'gameover') startMatch();
      }, 2500);
    }
    return;
  }
  if (state.phase === 'passDevice') return;      // waiting on user tap
  if (state.phase === 'paused') return;
  if (state.phase !== 'playing' && state.phase !== 'pileOn') return;

  var p = getPlayer(state.prioritySeat);
  if (!p) return;
  if (p.isHuman && localStorage.getItem('durak_autoPlay') !== 'true') {
    if (forcedAction(state.prioritySeat)) scheduleForcedAction(state.prioritySeat, handleAfterAction);
    return;
  }
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
  // A forced Pass/Done/Take needs no decision: play it now rather than hand
  // the device over just for the game to press the button.
  if (playForcedAction(state.prioritySeat)) { handleAfterAction(actorSeat); return; }
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

function abortDurakAutoPlay() {
  if (localStorage.getItem('durak_autoPlay') === 'true') {
    localStorage.setItem('durak_autoPlay', 'false');
  }
}

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
  abortDurakAutoPlay();
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
    var reselect = !state.selection || state.selection.cardId !== card.id;
    state.selection = null;
    if (!reselect) { renderAll(); return; }   // tapping the selected card again cancels
    ok = playOrSelectDefense(seat, card);
  } else if (legalAttack(seat, card)) {
    ok = playAttack(seat, start.cardId);
  }
  if (!ok) return;
  abortDurakAutoPlay();
  handleAfterAction(seat);
});

$humanHand.addEventListener('pointercancel', function () { tapStart = null; });

// ── Defense choices: transfer or beat, and which attack to cover ───────────
// A tap plays at once when it can mean only one move. A card that could both
// transfer and beat, or cover more than one open attack, is selected instead:
// the bar above the hand offers ⇄ Transfer / 🛡 Beat, and the attacks it could
// cover glow on the field for a second tap (p1-22, p1-23).

var $field = document.getElementById('field');

function playOrSelectDefense(seat, card) {
  var transfer = legalTransfer(seat, card);
  var targets = legalDefense(seat, card) ? defenseTargets(card) : [];
  if (!transfer && targets.length === 1) return playDefense(seat, card.id, targets[0]);
  if (transfer && targets.length === 0) return playTransfer(seat, card.id);
  if (transfer || targets.length > 1) {
    state.selection = { seat: seat, cardId: card.id, transfer: transfer, targets: targets };
  }
  renderAll();
  return false;
}

function clearSelection() {
  if (!state.selection) return;
  state.selection = null;
  renderAll();
}

function resolveSelection(action, target) {
  var sel = state.selection;
  if (!sel) return;
  state.selection = null;
  var ok = action === 'transfer' ? playTransfer(sel.seat, sel.cardId)
                                 : playDefense(sel.seat, sel.cardId, target);
  if (!ok) { renderAll(); return; }
  abortDurakAutoPlay();
  handleAfterAction(sel.seat);
}

document.getElementById('btn-choice-transfer').addEventListener('pointerdown', function (e) {
  e.preventDefault();
  resolveSelection('transfer');
});
document.getElementById('btn-choice-beat').addEventListener('pointerdown', function (e) {
  e.preventDefault();
  if (state.selection) resolveSelection('beat', state.selection.targets[0]);
});

// The field scrolls sideways when 5–6 pairs overflow, so a target is chosen
// on a tap, not a drag — same threshold as the hand.
var fieldTap = null;
$field.addEventListener('pointerdown', function (e) {
  var pair = state.selection && e.target.closest('.field-pair.is-target');
  fieldTap = pair ? { x: e.clientX, y: e.clientY, id: e.pointerId, index: parseInt(pair.dataset.attackIndex, 10) } : null;
});
$field.addEventListener('pointerup', function (e) {
  if (!fieldTap || e.pointerId !== fieldTap.id) return;
  var tap = fieldTap;
  fieldTap = null;
  var dx = e.clientX - tap.x;
  var dy = e.clientY - tap.y;
  if (dx * dx + dy * dy > TAP_MAX_DIST_SQ) return;
  resolveSelection('beat', tap.index);
});
$field.addEventListener('pointercancel', function () { fieldTap = null; });

// Tapping anywhere else cancels the selection.
document.addEventListener('pointerdown', function (e) {
  if (!state.selection) return;
  if (e.target.closest('#human-hand .card-btn, #choice-bar, .field-pair.is-target')) return;
  clearSelection();
});

// ── Start / restart ────────────────────────────────────────────────────────

function startGame() {
  clearAiTimeout();
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

function startMatch() {
  localStorage.setItem('lastPlayed_durak', Date.now());
  startGame();
}

$btnPlay.addEventListener('pointerdown', function (e) {
  e.preventDefault();
  localStorage.setItem('durak_autoPlay', 'false');
  startMatch();
});

if ($btnWatch) {
  $btnWatch.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    localStorage.setItem('durak_autoPlay', 'true');
    startMatch();
  });
}

$btnReplay.addEventListener('pointerdown', function (e) {
  e.preventDefault();
  startMatch();
});

// ── Settings panel integration ─────────────────────────────────────────────

function injectDurakSettings() {
  if (!window.KamekoSettings) return;
  var ui = window.KamekoSettings.ui;
  function inMatch() { return state.phase !== 'start' && state.phase !== 'gameover'; }

  window.KamekoSettings.registerSection('durak-quick-actions', {
    render: function(container) {
      var pair = document.createElement('div');
      pair.className = 'settings-row-pair';

      var btnRules = document.createElement('button');
      btnRules.className = 'settings-btn compact';
      btnRules.textContent = t('act.rulesShort');
      btnRules.addEventListener('click', function() {
        window.KamekoSettings.closeDrawer();
        window.$rulesOverlay.classList.remove('hidden');
      });
      pair.appendChild(btnRules);

      var btnLog = document.createElement('button');
      btnLog.className = 'settings-btn compact';
      btnLog.textContent = t('act.log');
      btnLog.addEventListener('click', function() {
        window.KamekoSettings.closeDrawer();
        import('./log.js').then(logModule => {
          var html = '';
          var lastBout = 0;
          for (var i = 0; i < state.log.length; i++) {
            var e = state.log[i];
            if (e.bout !== lastBout) {
              html += `<div style="margin-top:12px; font-weight:bold; color:var(--text-muted); border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:4px; margin-bottom:4px;">${t('log.bout', e.bout)}</div>`;
              lastBout = e.bout;
            }
            html += `<div style="padding:4px 0;">${logModule.eventText(e)}</div>`;
          }
          window.$logBody.innerHTML = html;
          window.$logOverlay.classList.remove('hidden');
        });
      });
      pair.appendChild(btnLog);

      container.appendChild(pair);
    }
  });

  // Aids you flip mid-game sit right under the quick actions (drawer-UX Q5),
  // as switches so their state shows at a glance.
  window.KamekoSettings.registerSection('durak-aids', {
    title: function() { return t('set.aids'); },
    render: function(container) {
      container.appendChild(ui.group([
        ui.toggle({
          id: 'durak-show-playable',
          label: t('set.showPlayable'), hint: t('set.showPlayableHint'),
          checked: localStorage.getItem('durak_showPlayable') !== 'false',
          onChange: function(on) {
            localStorage.setItem('durak_showPlayable', on ? 'true' : 'false');
            renderAll();
          }
        }),
        ui.toggle({
          id: 'durak-coach',
          label: t('set.coach'), hint: t('set.coachHint'),
          checked: localStorage.getItem('durak_coach') === 'true',
          onChange: function(on) {
            localStorage.setItem('durak_coach', on ? 'true' : 'false');
            renderAll();
          }
        })
      ]));
    }
  });

  // Persisted preferences. Mode, players and rules are match-scoped and live
  // on the setup screen (drawer-UX p1-18); AI difficulty shows only during a
  // match against the computer.
  window.KamekoSettings.registerSection('durak-settings', {
    title: function() { return t('set.title'); },
    render: function(container) {
      container.appendChild(ui.group([
        ui.segmented({
          label: t('set.handSort'),
          options: [
            { value: 'none', label: t('set.sortOff') },
            { value: 'suit', label: t('set.sortSuit') },
            { value: 'strength', label: t('set.sortStrength') }
          ],
          value: localStorage.getItem('durak_sort') || 'none',
          onChange: function(mode) {
            localStorage.setItem('durak_sort', mode);
            renderAll();
          }
        }),
        (state.mode === 'ai' && inMatch()) ? ui.segmented({
          label: t('set.aiDifficulty'),
          options: [
            { value: 'easy', label: t('set.diffEasy') },
            { value: 'normal', label: t('set.diffNormal') },
            { value: 'hard', label: t('set.diffHard') }
          ],
          value: localStorage.getItem('durak_difficulty') || 'normal',
          onChange: function(d) { localStorage.setItem('durak_difficulty', d); }
        }) : null,
        // Bilingual label so it can be found from either language.
        ui.segmented({
          label: 'Language / Язык',
          options: [{ value: 'en', label: 'English' }, { value: 'ru', label: 'Русский' }],
          value: getLang(),
          onChange: function(lang) {
            setLang(lang);
            refreshDefaultPlayerNames();
            localizeStatic();
            renderAll();
            if (state.phase === 'gameover') showGameOver(state.winnerOutcome, getMatchStats());
            injectDurakSettings();
          }
        })
      ]));
    }
  });

  window.KamekoSettings.registerWatchSection('durak', { hasRevealHands: true });

  window.KamekoSettings.registerSection('durak-end-round', {
    when: inMatch,
    render: function(container) {
      var btnEnd = document.createElement('button');
      btnEnd.className = 'settings-danger-btn quiet';
      btnEnd.textContent = t('act.endRound');
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
  state.selection = null;
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
