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

$('btn-howto').onclick = () => showHowto();

$('btn-log').onclick = () => {
    renderLog();
    $('logbook').classList.remove('hidden');
};
$('sum-log').onclick = () => {   // opens above the deal summary; closing returns to it
    renderLog();
    $('logbook').classList.remove('hidden');
};

$('btn-tys-settings').onclick = () => {
    // Populate settings UI from state
    $('set-lang').value = getLang();
    $('set-diff').value = state.difficulty;
    $('set-sound').checked = !isMuted();
    for (let p = 0; p < 3; p++) $('set-name-' + p).value = customName(p) || '';
    $('set-target').value = state.settings.targetScore;
    $('set-barrel').checked = state.settings.barrel;
    $('set-bolts').checked = state.settings.bolts;
    $('set-rounding').checked = state.settings.rounding;
    $('set-reraise').checked = state.settings.reraise;
    $('set-raspasy').checked = state.settings.raspasy;
    $('set-hidden').checked = state.settings.hiddenPoints;
    $('tys-settings').classList.remove('hidden');
};

// Language is display-only — it applies immediately, mid-deal, no restart.
// The log re-renders in the new language because entries are typed, not text.
$('set-lang').onchange = () => {
    setLang($('set-lang').value);
    localizeStatic();
    render();
    if (!$('howto').classList.contains('hidden')) showHowto();
};

// Difficulty and names are also live — they steer the NEXT AI decision /
// render, no restart needed.
$('set-diff').onchange = () => {
    state.difficulty = $('set-diff').value;
    localStorage.setItem('tysiacha_difficulty', state.difficulty);
};

$('set-sound').onchange = () => setMuted(!$('set-sound').checked);

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
    $('tys-settings').classList.add('hidden');
    localizeStatic();   // the target score shows in the title

    // Restart match to apply rules cleanly
    if (!window.KamekoTokens || !window.KamekoTokens.spend()) {
        if (window.KamekoTokens) window.KamekoTokens.toast();
        return;
    }
    localStorage.setItem('lastPlayed_tysiacha', Date.now());
    newMatch();
};

$('btn-coach').onclick = () => {
    state.coach = !state.coach;
    render();
};

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
    prevPhase = state.phase;
    state.phase = 'paused';
    render();
});
window.addEventListener('settingsClosed', () => {
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
