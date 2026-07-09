import { state } from './state.js';
import { newMatch, summaryNext, humanBid, confirmExchange, playCard, onCardTap } from './gameplay.js';
import { render, HOWTO, banner } from './ui.js';

const $ = id => document.getElementById(id);

// ── App wiring ──────────────────────────────────────────────────────────────

let htStep = 0;
function showHowto(step) {
    htStep = step;
    $('ht-title').textContent = HOWTO[step][0];
    $('ht-body').innerHTML = HOWTO[step][1];
    $('ht-dots').textContent = HOWTO.map((_, i) => (i === step ? '●' : '○')).join(' ');
    $('ht-back').style.visibility = step === 0 ? 'hidden' : 'visible';
    $('ht-next').textContent = step === HOWTO.length - 1 ? "Let's play" : 'Next';
    $('howto').classList.remove('hidden');
}

$('ht-next').onclick = () => {
    if (htStep < HOWTO.length - 1) { showHowto(htStep + 1); return; }
    $('howto').classList.add('hidden');
    if (state.phase === 'idle') {
        if (!window.KamekoTokens || !window.KamekoTokens.spend()) {
            if (window.KamekoTokens) window.KamekoTokens.toast();
            return;
        }
        localStorage.setItem('lastPlayed_tysiacha', Date.now());
        newMatch();
    }
};

$('ht-back').onclick = () => showHowto(Math.max(0, htStep - 1));
$('btn-howto').onclick = () => showHowto(0);

$('btn-coach').onclick = () => {
    state.coach = !state.coach;
    $('btn-coach').classList.toggle('coach-on', state.coach);
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
    if (e.target.closest('#act-bid')) return humanBid(false);
    if (e.target.closest('#act-pass')) return humanBid(true);
    if (e.target.closest('#act-give')) return confirmExchange();

    const cardEl = e.target.closest('#hand .card');
    if (cardEl) {
        const c = state.players[0].hand.find(x => x.s + x.r === cardEl.dataset.k || x.r + x.s === cardEl.dataset.k);
        if (c) {
            const res = onCardTap(c);
            if (res && res.action === 'marriage-prompt') {
                const card = res.card;
                const suitSpan = s => `<span class="${['H', 'D'].includes(s) ? 'suit-red' : ''}">${{ H: '♥', D: '♦', C: '♣', S: '♠' }[s]}</span>`;
                const suitName = s => ({ H: 'hearts', D: 'diamonds', C: 'clubs', S: 'spades' }[s]);
                const MARRIAGE = { H: 100, D: 80, C: 60, S: 40 };
                
                $('marry-body').innerHTML =
                    `<p>You hold both ${suitSpan(card.s)} K and Q. Leading the <span class="hl">${card.r + { H: '♥', D: '♦', C: '♣', S: '♠' }[card.s]}</span> lets you declare the marriage:</p>
                     <p>· ${suitName(card.s)} become <span class="hl">trump</span> — they beat every other suit<br>
                      · you immediately score <span class="hl">+${MARRIAGE[card.s]} points</span></p>`;
                $('marry').classList.remove('hidden');
            }
        }
    }
});

// ── End deal handler and high score ──────────────────────────────────────────

state.onDealEnd = (result) => {
    const { rows, champion } = result;
    const suitSpan = s => `<span class="${['H', 'D'].includes(s) ? 'suit-red' : ''}">${{ H: '♥', D: '♦', C: '♣', S: '♠' }[s]}</span>`;
    
    let html = `<table class="pt-table"><tr><th>Player</th><th>Tricks</th><th>Marriage</th><th>Result</th><th>Total</th></tr>`;
    rows.forEach(({ pl, p, note }) => {
        const mar = pl.marriages.length ? pl.marriages.map(s => suitSpan(s)).join(' ') + ` (${pl.marriagePts})` : '—';
        html += `<tr><td>${pl.name}${p === state.declarer ? ' 👑' : ''}</td><td>${pl.trickPts}</td><td>${mar}</td><td>${note}</td><td><strong>${pl.total}</strong></td></tr>`;
    });
    html += `</table>`;
    
    if (state.coach) {
        const you = rows[0];
        html += `<p style="color:#b8f5dd">🧭 ${state.declarer === 0
            ? (you.delta > 0 ? 'You bid and delivered — that’s the whole game.' : 'Failed bids subtract the full bid — bid closer to what your hand can actually win.')
            : 'As a defender you keep every point you grab — stealing tricks from the declarer hurts them twice.'}</p>`;
    }

    if (champion) {
        const youWon = champion === state.players[0];
        $('sum-title').textContent = youWon ? '🏆 You win the match!' : `🏆 ${champion.name} wins the match`;
        $('sum-next').textContent = 'New match';
        
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
                banner('New high score! ' + myScore);
            }
        }
    } else {
        $('sum-title').textContent = `Deal ${state.dealNum} — result`;
        $('sum-next').textContent = 'Next deal →';
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

// Initialize app with How-to
showHowto(0);
