import { state } from './state.js';
import { newMatch, summaryNext, humanBid, confirmExchange, playCard, onCardTap, announce } from './gameplay.js';
import { render, renderLog, localizeStatic, banner } from './ui.js';
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

function injectTysiachaSettings() {
    if (!window.KamekoSettings) return;

    window.KamekoSettings.registerSection('tys-quick-actions', {
        title: 'Quick Actions',
        render: function(container) {
            container.innerHTML = `
                <button class="settings-btn" id="drawer-btn-rules">❓ Rules of Tysiacha</button>
                <button class="settings-btn" id="drawer-btn-coach">🧭 ${state.coach ? 'Turn off Coach Hints' : 'Turn on Coach Hints'}</button>
            `;
            $('drawer-btn-rules').onclick = () => {
                window.KamekoSettings.closeDrawer();
                showHowto();
            };
            $('drawer-btn-coach').onclick = () => {
                state.coach = !state.coach;
                render();
                $('drawer-btn-coach').textContent = state.coach ? '🧭 Turn off Coach Hints' : '🧭 Turn on Coach Hints';
            };
        }
    });

    window.KamekoSettings.registerSection('tys-game-settings', {
        title: 'Tysiacha Match Settings',
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
                <div class="kameko-switch" style="display:inline-block; position:relative; width:44px; height:24px;">
                    <input type="checkbox" id="set-sound" style="opacity:0; width:0; height:0;">
                    <span class="kameko-slider" style="position:absolute; inset:0; background:rgba(255,255,255,0.25); border-radius:24px; transition:.4s; cursor:pointer;">
                        <span style="position:absolute; width:18px; height:18px; left:3px; bottom:3px; background:#fff; border-radius:50%; transition:.4s; pointer-events:none;"></span>
                    </span>
                </div>
            </div>
            <div class="setting-row">
                <label id="lbl-tap-to-play">1-Tap Play</label>
                <div class="kameko-switch" style="display:inline-block; position:relative; width:44px; height:24px;">
                    <input type="checkbox" id="set-tap-to-play" style="opacity:0; width:0; height:0;">
                    <span class="kameko-slider" style="position:absolute; inset:0; background:rgba(255,255,255,0.25); border-radius:24px; transition:.4s; cursor:pointer;">
                        <span style="position:absolute; width:18px; height:18px; left:3px; bottom:3px; background:#fff; border-radius:50%; transition:.4s; pointer-events:none;"></span>
                    </span>
                </div>
            </div>
            <div class="setting-row">
                <label id="lbl-target">Target Score</label>
                <select id="set-target">
                    <option id="opt-500" value="500">500 (Quick Match)</option>
                    <option id="opt-1000" value="1000">1000 (Classic)</option>
                </select>
            </div>

            <div class="setting-header" id="set-names-hdr">Player Names</div>

            <div class="setting-row"><label id="lbl-name-0">You</label><input type="text" id="set-name-0" maxlength="12" autocomplete="off"></div>
            <div class="setting-row"><label id="lbl-name-1">Vera</label><input type="text" id="set-name-1" maxlength="12" autocomplete="off"></div>
            <div class="setting-row"><label id="lbl-name-2">Boris</label><input type="text" id="set-name-2" maxlength="12" autocomplete="off"></div>

            <div class="setting-header" id="set-rules-hdr">Classic Rules</div>

            <label class="setting-check"><input type="checkbox" id="set-barrel"> <span id="lbl-barrel"><strong>The Barrel (880):</strong> Must win on the bid. 3 fails drops score.</span></label>
            <label class="setting-check"><input type="checkbox" id="set-bolts"> <span id="lbl-bolts"><strong>Bolts:</strong> 0 tricks in a deal gives a bolt. 3 bolts = −120.</span></label>
            <label class="setting-check"><input type="checkbox" id="set-rounding"> <span id="lbl-rounding"><strong>Rounding:</strong> Round scores to the nearest 5.</span></label>
            <label class="setting-check"><input type="checkbox" id="set-reraise"> <span id="lbl-reraise"><strong>Re-raise:</strong> Declarer can raise bid after talon.</span></label>
            <label class="setting-check"><input type="checkbox" id="set-raspasy"> <span id="lbl-raspasy"><strong>Raspasy:</strong> If all pass, negative round is played.</span></label>
            <label class="setting-check"><input type="checkbox" id="set-hidden"> <span id="lbl-hidden"><strong>Hidden Points:</strong> Hide opponent scores during deal.</span></label>

            <button class="settings-danger-btn" id="tys-set-apply" style="margin-top:16px;">Apply & Restart</button>
            `;

            // Helper to style custom toggles since they don't have the global kameko-switch class structure natively attached if we inline them, wait actually we can just manually trigger the transform.
            function updateSwitchUI(id) {
                let inp = $(id);
                let slider = inp.nextElementSibling;
                let knob = slider.firstElementChild;
                if (inp.checked) {
                    slider.style.background = '#00e5a0';
                    knob.style.transform = 'translateX(20px)';
                } else {
                    slider.style.background = 'rgba(255,255,255,0.25)';
                    knob.style.transform = 'none';
                }
            }

            // Populate settings UI from state
            $('set-lang').value = getLang();
            $('set-diff').value = state.difficulty;
            $('set-sound').checked = !isMuted();
            $('set-tap-to-play').checked = state.settings.tapToPlay;
            updateSwitchUI('set-sound');
            updateSwitchUI('set-tap-to-play');

            for (let p = 0; p < 3; p++) $('set-name-' + p).value = customName(p) || '';
            $('set-target').value = state.settings.targetScore;
            $('set-barrel').checked = state.settings.barrel;
            $('set-bolts').checked = state.settings.bolts;
            $('set-rounding').checked = state.settings.rounding;
            $('set-reraise').checked = state.settings.reraise;
            $('set-raspasy').checked = state.settings.raspasy;
            $('set-hidden').checked = state.settings.hiddenPoints;

            // Call localizeStatic so labels inside our new HTML get localized.
            localizeStatic();

            // Bind events
            $('set-lang').onchange = () => {
                setLang($('set-lang').value);
                localizeStatic();
                render();
            };
            $('set-diff').onchange = () => {
                state.difficulty = $('set-diff').value;
                localStorage.setItem('tysiacha_difficulty', state.difficulty);
            };
            $('set-sound').onchange = (e) => {
                setMuted(!e.target.checked);
                updateSwitchUI('set-sound');
            };
            $('set-tap-to-play').onchange = (e) => {
                updateSwitchUI('set-tap-to-play');
            }
            
            for (let p = 0; p < 3; p++) {
                $('set-name-' + p).onchange = e => {
                    setCustomName(p, e.target.value.trim());
                    if (state.players[p]) state.players[p].name = playerName(p);
                    render();
                };
            }

            $('tys-set-apply').onclick = () => {
                state.settings.targetScore = parseInt($('set-target').value, 10);
                state.settings.barrel = $('set-barrel').checked;
                state.settings.bolts = $('set-bolts').checked;
                state.settings.rounding = $('set-rounding').checked;
                state.settings.reraise = $('set-reraise').checked;
                state.settings.raspasy = $('set-raspasy').checked;
                state.settings.hiddenPoints = $('set-hidden').checked;
                state.settings.tapToPlay = $('set-tap-to-play').checked;
                
                window.KamekoSettings.closeDrawer();
                localizeStatic();

                // Restart match to apply rules cleanly
                if (!window.KamekoTokens || !window.KamekoTokens.spend()) {
                    if (window.KamekoTokens) window.KamekoTokens.toast();
                    return;
                }
                localStorage.setItem('lastPlayed_tysiacha', Date.now());
                newMatch();
            };
        }
    });
}

$('btn-restart').onclick = () => {
    $('summary').classList.add('hidden');
    if (!window.KamekoTokens || !window.KamekoTokens.spend()) {
        if (window.KamekoTokens) window.KamekoTokens.toast();
        return;
    }
    localStorage.setItem('lastPlayed_tysiacha', Date.now());
    newMatch();
};

$('sum-next').onclick = () => {
    $('summary').classList.add('hidden');
    if (state.phase === 'matchEnd') {
        if (!window.KamekoTokens || !window.KamekoTokens.spend()) {
            if (window.KamekoTokens) window.KamekoTokens.toast();
            return;
        }
        localStorage.setItem('lastPlayed_tysiacha', Date.now());
    }
    summaryNext();
};

$('marry-yes').onclick = () => {
    $('marry').classList.add('hidden');
    if (state.pendingCard) { playCard(0, state.pendingCard, true); state.pendingCard = null; }
};
$('marry-no').onclick = () => {
    $('marry').classList.add('hidden');
    if (state.pendingCard) { playCard(0, state.pendingCard, false); state.pendingCard = null; }
};

document.addEventListener('click', (e) => {
    // Overlay outside click or X button
    if (e.target.classList.contains('overlay') || e.target.classList.contains('close-btn')) {
        const overlay = e.target.closest('.overlay');
        if (overlay) overlay.classList.add('hidden');
        if (overlay && overlay.id === 'howto' && state.phase === 'idle') {
            if (!window.KamekoTokens || !window.KamekoTokens.spend()) {
                if (window.KamekoTokens) window.KamekoTokens.toast();
                return;
            }
            localStorage.setItem('lastPlayed_tysiacha', Date.now());
            newMatch();
        }
        return;
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

        if (window.KamekoTokens) {
            window.KamekoTokens.earn(1, 'tysiacha: finished');
        }

        // High score logic (best win margin)
        if (youWon) {
            const myScore = state.players[0].total;
            const highScore = parseInt(localStorage.getItem('tysiachaHighScore') || '0', 10);
            if (myScore > highScore) {
                localStorage.setItem('tysiachaHighScore', myScore);
                if (window.KamekoTokens) window.KamekoTokens.earn(2, 'tysiacha: new high score');
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
};

// ── Pause / Resume ─────────────────────────────────────────────────────────
let prevPhase = 'idle';
window.addEventListener('settingsOpened', () => {
    injectTysiachaSettings();
    prevPhase = state.phase;
    state.phase = 'paused';
    render();
});
window.addEventListener('settingsClosed', () => {
    var sec = document.getElementById('game-settings-tys-game-settings');
    if (sec) sec.remove();
    var secQa = document.getElementById('game-settings-tys-quick-actions');
    if (secQa) secQa.remove();
    
    if (state.phase === 'paused') {
        state.phase = prevPhase;
        render();
    }
});

// Initialize app
state.difficulty = localStorage.getItem('tysiacha_difficulty') || 'normal';
localizeStatic();

if (localStorage.getItem('lastPlayed_tysiacha')) {
    if (!window.KamekoTokens || !window.KamekoTokens.spend()) {
        if (window.KamekoTokens) window.KamekoTokens.toast();
        showHowto(); // Fallback so screen isn't blank
    } else {
        localStorage.setItem('lastPlayed_tysiacha', Date.now());
        newMatch();
    }
} else {
    showHowto();
}
