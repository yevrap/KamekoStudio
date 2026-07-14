import { state } from './state.js';
import { BW, BH, ORB_R, PEG_R, WALL, BUCKET_TOP, DIVIDERS, BUCKET_MULTS, BASE_DROPS, START_COINS, quotaFor, ITEMS, STEP } from './constants.js';
import { buildPegs, assignSpecials, stepPhysics, setSoundCallback } from './gameplay.js';

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSynth(freq, type, duration, vol) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

setSoundCallback((id) => {
    if (id === 'hit') playSynth(440 + Math.random()*50, 'sine', 0.1, 0.1);
    else if (id === 'gold') playSynth(880, 'sine', 0.15, 0.15);
    else if (id === 'mult') playSynth(300, 'square', 0.2, 0.15);
    else if (id === 'coin') playSynth(1200, 'sine', 0.1, 0.1);
    else if (id === 'land') playSynth(150, 'sawtooth', 0.3, 0.2);
});

const $ = id => document.getElementById(id);
const canvas = $('board'), ctx = canvas.getContext('2d');
const hudRound = $('hud-round'), hudOrbs = $('hud-orbs'), hudCoins = $('hud-coins');
const quotaFill = $('quota-fill'), quotaLabel = $('quota-label');
const hint = $('hint'), banner = $('banner');

let scale = 1;

function fitCanvas() {
    const stage = $('stage');
    const availW = stage.clientWidth - 8, availH = stage.clientHeight - 8;
    scale = Math.min(availW / BW, availH / BH);
    const cssW = Math.floor(BW * scale), cssH = Math.floor(BH * scale);
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    canvas.width = Math.floor(cssW * dpr);
    canvas.height = Math.floor(cssH * dpr);
    ctx.setTransform(canvas.width / BW, 0, 0, canvas.height / BH, 0, 0);
}
window.addEventListener('resize', fitCanvas);

const fmt = n => n.toLocaleString('en-US');

function updateHud() {
    hudRound.textContent = 'R' + state.round;
    hudOrbs.textContent = '🧿 ' + state.drops;
    hudCoins.textContent = '🪙 ' + state.coins;
    quotaFill.style.width = Math.min(100, state.roundScore / state.quota * 100) + '%';
    quotaLabel.textContent = fmt(state.roundScore) + ' / ' + fmt(state.quota);
}

function showBanner(text) {
    banner.textContent = text;
    banner.classList.remove('show');
    void banner.offsetWidth; // restart animation
    banner.classList.add('show');
}

function startRound(r) {
    state.round = r;
    state.quota = quotaFor(r);
    state.roundScore = 0;
    state.drops = BASE_DROPS + (state.owned.extra ? 1 : 0);
    state.orbs = []; state.particles = []; state.floats = [];
    assignSpecials();
    state.mode = 'aim';
    hint.style.display = r === 1 ? '' : 'none';
    showBanner('Round ' + r + ' — quota ' + fmt(state.quota));
    updateHud();
}

function dropOrb() {
    if (state.mode !== 'aim' || state.drops <= 0) return;
    hint.style.display = 'none';
    state.dropMult = 1;
    state.dropSplitUsed = false;
    state.pegs.forEach(p => p.hit = false);
    state.orbs = [{ x: state.launchX, y: 26, vx: (Math.random() - 0.5) * 16, vy: 0, pts: 0, trail: [], still: 0, ghostUsed: false, upgradeUsed: false }];
    state.mode = 'drop';
    state.slowMo = 0;
    state.shake = 0;
}

function openShop(bonus) {
    const pool = ITEMS.filter(it => !state.owned[it.id]);
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    state.shopStock = pool.slice(0, 3);
    $('shop-coins').innerHTML = '🪙 ' + state.coins + ' <span style="color:var(--text-muted);font-weight:400;font-size:0.72rem">(+' + bonus + ' for clearing with orbs to spare)</span>';
    renderShop();
    $('btn-continue').textContent = 'Drop into round ' + (state.round + 1) + ' →';
    $('shop').classList.remove('hidden');
    updateHud();
}

function renderShop() {
    const box = $('shop-items');
    box.innerHTML = '';
    if (state.shopStock.length === 0) {
        box.innerHTML = '<p class="muted" style="font-size:0.78rem;color:var(--text-muted)">Sold out — you own the whole bazaar.</p>';
        return;
    }
    state.shopStock.forEach(it => {
        const row = document.createElement('div');
        row.className = 'shop-item';
        row.innerHTML = '<div class="s-emoji">' + it.emoji + '</div>' +
            '<div class="s-body"><span class="s-name">' + it.name + '</span>' +
            '<span class="s-desc">' + it.desc + '</span></div>';
        const btn = document.createElement('button');
        btn.className = 'buy-btn';
        if (state.owned[it.id]) {
            btn.textContent = 'Owned';
            btn.className += ' owned';
            btn.disabled = true;
        } else {
            btn.textContent = '🪙 ' + it.price;
            btn.disabled = state.coins < it.price;
            btn.addEventListener('click', () => {
                if (state.coins < it.price || state.owned[it.id]) return;
                state.coins -= it.price;
                state.owned[it.id] = true;
                $('shop-coins').innerHTML = '🪙 ' + state.coins;
                renderShop();
                updateHud();
            });
        }
        row.appendChild(btn);
        box.appendChild(row);
    });
}

function gameOver() {
    let best = parseInt(localStorage.getItem('bestScore_pachinkoBazaar') || '0', 10);
    if (state.runScore > best) {
        best = state.runScore;
        try { localStorage.setItem('bestScore_pachinkoBazaar', best.toString()); } catch(e){}
    }
    
    $('go-stats').innerHTML =
        '<div class="stat-row"><span>Reached</span><b>Round ' + state.round + '</b></div>' +
        '<div class="stat-row"><span>Final quota</span><b>' + fmt(state.quota) + '</b></div>' +
        '<div class="stat-row"><span>Scored this round</span><b>' + fmt(state.roundScore) + '</b></div>' +
        '<div class="stat-row"><span>Run total</span><b>' + fmt(state.runScore) + '</b></div>' +
        '<div class="stat-row" style="margin-top:0.4rem; border:none; color:var(--text-muted)"><span>Best run</span><b>' + fmt(best) + '</b></div>';
    $('gameover').classList.remove('hidden');
}

function restart() {
    state.owned = {};
    state.coins = START_COINS;
    state.runScore = 0;
    ['shop', 'gameover', 'paused'].forEach(id => $(id).classList.add('hidden'));
    state.paused = false;
    startRound(1);
}

const PEG_COLORS = { blue: '#4d7cff', gold: '#ffcf4d', mult: '#b96bff', coin: '#3ce38f' };

function render() {
    ctx.save();
    if (state.shake > 0) {
        const amt = state.shake * 15;
        ctx.translate((Math.random()-0.5)*amt, (Math.random()-0.5)*amt);
    }

    ctx.clearRect(0, 0, BW, BH);

    // background
    const bg = ctx.createLinearGradient(0, 0, 0, BH);
    bg.addColorStop(0, '#10102a');
    bg.addColorStop(1, '#0a0a18');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, BW, BH);

    // walls
    ctx.fillStyle = '#2a2a50';
    ctx.fillRect(0, 0, WALL, BH);
    ctx.fillRect(BW - WALL, 0, WALL, BH);
    ctx.fillRect(0, 0, BW, 12);

    // bucket zone
    ctx.fillStyle = '#0d0d20';
    ctx.fillRect(WALL, BUCKET_TOP, BW - WALL * 2, BH - BUCKET_TOP);
    ctx.fillStyle = '#2a2a50';
    for (const dx of DIVIDERS) {
        ctx.beginPath();
        ctx.roundRect(dx - 3, BUCKET_TOP, 6, BH - BUCKET_TOP, 3);
        ctx.fill();
    }
    const edges = [WALL, ...DIVIDERS, BW - WALL];
    ctx.font = '700 15px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < 5; i++) {
        const m = BUCKET_MULTS[i] + (state.owned.heavy ? 1 : 0);
        const cx = (edges[i] + edges[i + 1]) / 2;
        ctx.fillStyle = m >= 5 ? '#ffcf4d' : '#7777aa';
        ctx.fillText('×' + m, cx, BH - 38);
    }

    // pegs
    for (const p of state.pegs) {
        const c = PEG_COLORS[p.type];
        const dim = p.hit && state.mode === 'drop';
        ctx.globalAlpha = dim ? 0.22 : 0.28;
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(p.x, p.y, PEG_R + 4 + p.flash * 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = dim ? 0.35 : 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, PEG_R, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    // launcher
    if (state.mode === 'aim') {
        ctx.strokeStyle = '#7777aa';
        ctx.setLineDash([3, 7]);
        ctx.beginPath();
        ctx.moveTo(state.launchX, 36);
        
        let hitY = BH;
        for (const p of state.pegs) {
            if (Math.abs(p.x - state.launchX) < ORB_R + PEG_R) {
                if (p.y - PEG_R - ORB_R < hitY) hitY = p.y - PEG_R - ORB_R;
            }
        }
        ctx.lineTo(state.launchX, hitY);
        ctx.stroke();
        
        ctx.setLineDash([]);
        ctx.fillStyle = '#e0e0ff';
        ctx.beginPath();
        ctx.arc(state.launchX, 26, ORB_R, 0, Math.PI * 2);
        ctx.fill();
    }

    // orbs
    for (const o of state.orbs) {
        for (let i = 0; i < o.trail.length; i++) {
            ctx.globalAlpha = (i / o.trail.length) * 0.3;
            ctx.fillStyle = '#00e5a0';
            ctx.beginPath();
            ctx.arc(o.trail[i].x, o.trail[i].y, ORB_R * (0.4 + 0.5 * i / o.trail.length), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#e0e0ff';
        ctx.beginPath();
        ctx.arc(o.x, o.y, ORB_R, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#00e5a0';
        ctx.beginPath();
        ctx.arc(o.x - 2, o.y - 2, ORB_R * 0.45, 0, Math.PI * 2);
        ctx.fill();
    }

    // live drop meter
    if (state.mode === 'drop' && state.orbs.length) {
        const pts = state.orbs.reduce((s, o) => s + o.pts, 0);
        ctx.fillStyle = '#7777aa';
        ctx.font = '600 13px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('drop: ' + pts + (state.dropMult > 1 ? '  ×' + state.dropMult : ''), BW / 2, 30);
    }

    // particles
    for (const p of state.particles) {
        ctx.globalAlpha = 1 - p.t / 0.6;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // floating texts
    ctx.font = '700 14px -apple-system, sans-serif';
    ctx.textAlign = 'center';
    for (const f of state.floats) {
        ctx.globalAlpha = 1 - f.t;
        ctx.fillStyle = f.color;
        ctx.fillText(f.txt, f.x, f.y - f.t * 34);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
}

let lastT = 0, acc = 0;
function loop(t) {
    requestAnimationFrame(loop);
    if (!lastT) lastT = t;
    let dt = (t - lastT) / 1000;
    lastT = t;
    if (dt > 0.05) dt = 0.05;

    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt);
    if (state.slowMo > 0) {
        dt *= 0.3; // 30% speed
        state.slowMo = Math.max(0, state.slowMo - dt);
    }

    if (state.mode === 'drop' && !state.paused) {
        acc += dt;
        while (acc >= STEP) {
            stepPhysics(STEP);
            acc -= STEP;
        }

        if (state.orbs.length === 0) {
            state.drops--;
            updateHud();
            if (state.roundScore >= state.quota) {
                const bonus = 3 + state.drops;
                state.coins += bonus;
                state.runScore += state.roundScore;
                setTimeout(() => openShop(bonus), 500);
                state.mode = 'shop';
            } else if (state.drops <= 0) {
                state.runScore += state.roundScore;
                setTimeout(gameOver, 500);
                state.mode = 'over';
            } else {
                state.mode = 'aim';
            }
        }
    }
    render();
}

function pointerX(e) {
    const rect = canvas.getBoundingClientRect();
    return (e.clientX - rect.left) / rect.width * BW;
}
canvas.addEventListener('pointerdown', e => {
    if (state.mode !== 'aim') return;
    state.aiming = true;
    canvas.setPointerCapture(e.pointerId);
    state.launchX = Math.max(WALL + ORB_R + 4, Math.min(BW - WALL - ORB_R - 4, pointerX(e)));
});
canvas.addEventListener('pointermove', e => {
    if (!state.aiming || state.mode !== 'aim') return;
    state.launchX = Math.max(WALL + ORB_R + 4, Math.min(BW - WALL - ORB_R - 4, pointerX(e)));
});
canvas.addEventListener('pointerup', () => {
    if (state.aiming && state.mode === 'aim') dropOrb();
    state.aiming = false;
});
canvas.addEventListener('pointercancel', () => { state.aiming = false; });

$('btn-start').addEventListener('click', () => {
    $('howto').classList.add('hidden');
    startRound(1);
});
$('btn-continue').addEventListener('click', () => {
    $('shop').classList.add('hidden');
    startRound(state.round + 1);
});
$('btn-again').addEventListener('click', restart);
$('btn-restart').addEventListener('click', restart);
$('btn-resume').addEventListener('click', () => {
    state.paused = false;
    $('paused').classList.add('hidden');
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.mode === 'drop') {
        state.paused = true;
        $('paused').classList.remove('hidden');
    }
});

document.addEventListener('settingsOpened', () => {
    if (state.mode === 'drop') {
        state.paused = true;
        $('paused').classList.remove('hidden');
    }
});

function init() {
    if (document.body.clientWidth === 0) {
        requestAnimationFrame(init);
        return;
    }
    buildPegs();
    assignSpecials();
    fitCanvas();
    updateHud();
    requestAnimationFrame(loop);
    
    try {
        localStorage.setItem('lastPlayed_pachinkoBazaar', Date.now().toString());
    } catch(e) {}
}

init();
