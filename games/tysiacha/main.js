import { state } from './state.js';
import { newMatch, summaryNext, humanBid, confirmExchange, playCard, onCardTap, announce, step } from './gameplay.js';
import { render, renderLog, localizeStatic, localizeDrawer, banner } from './ui.js';
import { t, getLang, setLang, playerName, customName, setCustomName, suitHTML } from './i18n.js';
import { isMuted, setMuted } from './sfx.js';

const $ = id => document.getElementById(id);

// ── App wiring ──────────────────────────────────────────────────────────────

function showHowto() {
    const content = t('howto').map(([title, body]) => `<h3>${title}</h3>${body}`).join('<br>');
    $('ht-body').innerHTML = content;
    $('howto').classList.remove('hidden');
}

$('btn-log').onclick = () => {
    renderLog();
    $('logbook').classList.remove('hidden');
};
$('sum-log').onclick = () => {   // opens above the deal summary; closing returns to it
    renderLog();
    $('logbook').classList.remove('hidden');
};

// ── Match settings persistence ──────────────────────────────────────────────
// Target score, classic rules, and 1-tap play live in one JSON blob so a
// reload never silently resets the house rules.

function loadMatchSettings() {
    try {
        const saved = JSON.parse(localStorage.getItem('tysiacha_settings') || '{}');
        for (const k of Object.keys(state.settings)) {
            if (k in saved) state.settings[k] = saved[k];
        }
    } catch (e) { /* corrupt blob — keep defaults */ }
}

function saveMatchSettings() {
    localStorage.setItem('tysiacha_settings', JSON.stringify(state.settings));
}

// ── New Match setup overlay ─────────────────────────────────────────────────
// Names, target score, and classic rules apply to the NEXT match, so they
// live here (durak's setup-screen pattern), not in the settings drawer.

function showSetup() {
    for (let p = 0; p < 3; p++) $('set-name-' + p).value = customName(p) || '';
    $('set-target').value = state.settings.targetScore;
    $('set-barrel').checked = state.settings.barrel;
    $('set-bolts').checked = state.settings.bolts;
    $('set-rounding').checked = state.settings.rounding;
    $('set-reraise').checked = state.settings.reraise;
    $('set-raspasy').checked = state.settings.raspasy;
    $('set-hidden').checked = state.settings.hiddenPoints;

    // No match to return to → no close button.
    const isFirstStart = state.phase === 'idle';
    $('setup-close-top').style.display = isFirstStart ? 'none' : '';
    $('setup-play').textContent = isFirstStart ? t('setup.playCost') : t('setup.play');

    $('setup').classList.remove('hidden');
}

function applySetup() {
    for (let p = 0; p < 3; p++) setCustomName(p, $('set-name-' + p).value.trim());
    state.settings.targetScore = parseInt($('set-target').value, 10);
    state.settings.barrel = $('set-barrel').checked;
    state.settings.bolts = $('set-bolts').checked;
    state.settings.rounding = $('set-rounding').checked;
    state.settings.reraise = $('set-reraise').checked;
    state.settings.raspasy = $('set-raspasy').checked;
    state.settings.hiddenPoints = $('set-hidden').checked;
    saveMatchSettings();

    localStorage.setItem('lastPlayed_tysiacha', Date.now());
    $('setup').classList.add('hidden');
    localizeStatic();   // title-sub tracks the chosen target score
}

$('setup-play').onclick = () => {
    localStorage.setItem('tysiacha_autoPlay', 'false');
    state.autoPlay = false;
    applySetup();
    newMatch();
};

if ($('setup-watch')) {
    $('setup-watch').onclick = () => {
        localStorage.setItem('tysiacha_autoPlay', 'true');
        state.autoPlay = true;
        applySetup();
        newMatch();
    };
}

// ── Settings drawer ─────────────────────────────────────────────────────────
// Drawer = quick actions + instant settings only. Everything here applies
// live and persists; match-scoped choices are on the setup overlay above.

function injectTysiachaSettings() {
    if (!window.KamekoSettings) return;

    window.KamekoSettings.registerSection('tys-quick-actions', {
        title: () => t('set.quickActions'),
        render: function(container) {
            container.innerHTML = `
                <button class="settings-btn" id="drawer-btn-rules">❓ ${t('howto.title')}</button>
                <button class="settings-btn" id="drawer-btn-coach">${state.coach ? t('set.coachOff') : t('set.coachOn')}</button>
                <button class="settings-btn" id="drawer-btn-new-match">${t('set.newMatch')}</button>
            `;
            $('drawer-btn-rules').onclick = () => {
                window.KamekoSettings.closeDrawer();
                showHowto();
            };
            $('drawer-btn-coach').onclick = () => {
                state.coach = !state.coach;
                render();
                $('drawer-btn-coach').textContent = state.coach ? t('set.coachOff') : t('set.coachOn');
            };
            $('drawer-btn-new-match').onclick = () => {
                window.KamekoSettings.closeDrawer();
                showSetup();
            };
        }
    });

    window.KamekoSettings.registerSection('tys-game-settings', {
        title: () => t('set.title'),
        render: function(container) {
            container.innerHTML = `
            <div class="setting-row">
                <label id="lbl-lang">Language / Язык</label>
                <select id="set-lang">
                    <option value="en">English</option>
                    <option value="ru">Русский</option>
                </select>
            </div>
            <div class="setting-row">
                <label id="lbl-diff">AI Difficulty</label>
                <select id="set-diff">
                    <option id="opt-diff-easy" value="easy">Easy</option>
                    <option id="opt-diff-normal" value="normal">Normal</option>
                    <option id="opt-diff-hard" value="hard">Hard</option>
                </select>
            </div>
            <div class="setting-row">
                <label id="lbl-sound">Sound effects</label>
                <label class="kameko-switch">
                    <input type="checkbox" id="set-sound">
                    <span class="kameko-slider"></span>
                </label>
            </div>
            <div class="setting-row">
                <label id="lbl-tap-to-play">1-Tap Play</label>
                <label class="kameko-switch">
                    <input type="checkbox" id="set-tap-to-play">
                    <span class="kameko-slider"></span>
                </label>
            </div>
            `;

            // Populate from live state
            $('set-lang').value = getLang();
            $('set-diff').value = state.difficulty;
            $('set-sound').checked = !isMuted();
            $('set-tap-to-play').checked = state.settings.tapToPlay;

            // Localize the freshly injected drawer HTML (page chrome is separate).
            localizeDrawer();

            // Bind events — everything applies immediately and persists.
            $('set-lang').onchange = () => {
                setLang($('set-lang').value);
                localizeStatic();
                localizeDrawer();
                render();
            };
            $('set-diff').onchange = () => {
                state.difficulty = $('set-diff').value;
                localStorage.setItem('tysiacha_difficulty', state.difficulty);
            };
            $('set-sound').onchange = (e) => {
                setMuted(!e.target.checked);
            };
            $('set-tap-to-play').onchange = (e) => {
                state.settings.tapToPlay = e.target.checked;
                saveMatchSettings();
            };
        }
    });

    window.KamekoSettings.registerWatchSection('tysiacha', { 
        hasRevealHands: true,
        onStop: () => {
            if (state.phase === 'paused') {
                state.phase = prevPhase;
                render();
                if (state.resumeAction) {
                    const fn = state.resumeAction;
                    state.resumeAction = null;
                    fn();
                }
            }
        }
    });
}

// ↺ opens the New Match setup instead of silently restarting — one obvious
// restart path.
$('btn-restart').onclick = () => {
    $('summary').classList.add('hidden');
    showSetup();
};

$('sum-next').onclick = () => {
    $('summary').classList.add('hidden');
    if (state.phase === 'matchEnd') {
        localStorage.setItem('lastPlayed_tysiacha', Date.now());
    }
    summaryNext();
};

document.addEventListener('click', (e) => {
    // Overlay outside click or X button
    if (e.target.classList.contains('overlay') || e.target.classList.contains('close-btn')) {
        const overlay = e.target.closest('.overlay');
        // The setup overlay is the whole UI before the first match — nothing
        // behind it to return to, so it can't be dismissed.
        if (overlay && overlay.id === 'setup' && state.phase === 'idle') return;
        if (overlay) overlay.classList.add('hidden');
        // First visit: rules first, then the New Match setup screen.
        if (overlay && overlay.id === 'howto' && state.phase === 'idle') showSetup();
        return;
    }

    const isManualAction = e.target.closest('#act-bid') ||
                           e.target.closest('#act-pass') ||
                           e.target.closest('#act-give') ||
                           e.target.closest('#act-reraise') ||
                           e.target.closest('#act-play-card') ||
                           e.target.closest('#act-declare') ||
                           e.target.closest('#hand .card');

    if (isManualAction && state.autoPlay) {
        state.autoPlay = false;
        localStorage.setItem('tysiacha_autoPlay', 'false');
        banner('Manual Takeover');
        if (window.KamekoSettings) window.KamekoSettings.openDrawer = window.KamekoSettings.openDrawer; // Trigger settings re-render next time it opens, though it reads localStorage anyway.
    }

    if (e.target.closest('#act-bid')) return humanBid(false);
    if (e.target.closest('#act-pass')) return humanBid(true);
    if (e.target.closest('#act-give')) return confirmExchange();
    if (e.target.closest('#act-reraise')) {
        state.currentBid += 10;
        announce('reraise', { p: 0, amount: state.currentBid });
        render();
        return;
    }
    
    if (e.target.closest('#act-play-card')) {
        if (state.pendingCard) {
            playCard(0, state.pendingCard, false);
            state.pendingCard = null;
        }
        return;
    }
    if (e.target.closest('#act-declare')) {
        if (state.pendingCard) {
            playCard(0, state.pendingCard, true);
            state.pendingCard = null;
        }
        return;
    }

    const cardEl = e.target.closest('#hand .card');
    if (cardEl) {
        const c = state.players[0].hand.find(x => x.s + x.r === cardEl.dataset.k || x.r + x.s === cardEl.dataset.k);
        if (c) {
            onCardTap(c); // Modal prompt logic removed, handled in onCardTap and ui.js
        }
    }
});

// ── End deal handler and high score ──────────────────────────────────────────

state.onDealEnd = (result) => {
    const { rows, champion } = result;

    const headers = t('sum.headers');
    let html = `<table class="pt-table"><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
    rows.forEach(({ pl, p, note }) => {
        const mar = pl.marriages.length ? pl.marriages.map(s => suitHTML(s)).join(' ') + ` (${pl.marriagePts})` : '—';
        html += `<tr><td>${playerName(p)}${p === state.declarer ? ' 👑' : ''}</td><td>${pl.trickPts}</td><td>${mar}</td><td>${note}</td><td><strong>${pl.total}</strong></td></tr>`;
    });
    html += `</table>`;

    if (state.coach) {
        const you = rows[0];
        html += `<p style="color:#b8f5dd">🧭 ${state.declarer === 0
            ? (you.delta > 0 ? t('coach.endMade') : t('coach.endFailed'))
            : t('coach.endDefender')}</p>`;
    }

    if (champion) {
        const youWon = champion === state.players[0];
        $('sum-title').textContent = youWon ? t('sum.youWin') : t('sum.winner', playerName(state.players.indexOf(champion)));
        $('sum-next').textContent = t('sum.newMatch');



        // High score logic (best win margin)
        if (youWon) {
            const myScore = state.players[0].total;
            const highScore = parseInt(localStorage.getItem('tysiachaHighScore') || '0', 10);
            if (myScore > highScore) {
                localStorage.setItem('tysiachaHighScore', myScore);
                banner(t('banner.highScore', myScore));
            }
        }
    } else {
        $('sum-title').textContent = t('sum.deal', state.dealNum);
        $('sum-next').textContent = t('sum.nextDeal');
    }
    $('sum-body').innerHTML = html;
    $('summary').classList.remove('hidden');
    render();

    // Auto-advance logic for Visualizer mode
    if (state.autoPlay || (champion && state.autoRestart)) {
        setTimeout(() => {
            const summary = document.getElementById('summary');
            if (!summary.classList.contains('hidden')) {
                if (champion && !state.autoRestart) return; // Wait at match end if not auto-restarting
                document.getElementById('sum-next').click();
            }
        }, localStorage.getItem('tysiacha_autoPlaySpeed') === 'fast' ? 1500 : (localStorage.getItem('tysiacha_autoPlaySpeed') === 'slow' ? 5000 : 3500));
    }
};

// ── Pause / Resume ─────────────────────────────────────────────────────────
// Sections are registered once at boot; the drawer re-renders them on every
// open, so the listeners below only handle pause/resume.
let prevPhase = 'idle';
window.addEventListener('settingsOpened', () => {
    prevPhase = state.phase;
    state.phase = 'paused';
    render();
});
window.addEventListener('settingsClosed', () => {
    state.autoPlay = localStorage.getItem('tysiacha_autoPlay') === 'true';
    state.autoRestart = localStorage.getItem('tysiacha_autoRestart') === 'true';
    if (state.phase === 'paused') {
        state.phase = prevPhase;
        render();
        if (state.resumeAction) {
            const fn = state.resumeAction;
            state.resumeAction = null;
            fn();
        } else if (state.autoPlay) {
            import('./ai.js').then(ai => {
                if (state.phase === 'bidding' && state.bidTurn === 0) setTimeout(() => ai.aiBid(0), 400);
                else if (state.phase === 'exchange' && state.declarer === 0) setTimeout(() => ai.aiExchange(0), 400);
                else if (state.phase === 'play' && state.turn === 0 && state.trick.length < 3) setTimeout(() => ai.aiMove(0), 400);
            });
            if (state.phase === 'dealEnd' || state.phase === 'matchEnd') {
                const summary = document.getElementById('summary');
                if (summary && !summary.classList.contains('hidden')) {
                    if (state.phase === 'dealEnd' || state.autoRestart) {
                        setTimeout(() => document.getElementById('sum-next').click(), 400);
                    }
                }
            }
        }
    }
});

// Initialize app
state.difficulty = localStorage.getItem('tysiacha_difficulty') || 'normal';
state.autoPlay = localStorage.getItem('tysiacha_autoPlay') === 'true';
state.autoRestart = localStorage.getItem('tysiacha_autoRestart') === 'true';
loadMatchSettings();
localizeStatic();
injectTysiachaSettings();

// Boot lands on the New Match setup.
// First visit shows the rules first (closing them reveals the setup).
if (localStorage.getItem('lastPlayed_tysiacha')) {
    showSetup();
} else {
    showHowto();
}
