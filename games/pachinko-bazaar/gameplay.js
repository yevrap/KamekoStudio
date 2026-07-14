import { state } from './state.js';
import { BW, BH, G, REST_PEG, REST_WALL, MAX_SPEED, ORB_R, PEG_R, WALL, BUCKET_TOP, DIVIDERS, BUCKET_MULTS } from './constants.js';

export function buildPegs() {
    state.pegs = [];
    for (let row = 0; row < 8; row++) {
        const y = 95 + row * 44;
        const odd = row % 2 === 1;
        const count = odd ? 7 : 8;
        const startX = odd ? 64 : 40;
        for (let i = 0; i < count; i++) {
            state.pegs.push({ x: startX + i * 48, y, type: 'blue', hit: false, flash: 0 });
        }
    }
}

export function assignSpecials() {
    const idx = state.pegs.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    state.pegs.forEach(p => { p.type = 'blue'; p.hit = false; p.flash = 0; });
    idx.slice(0, 6).forEach(i => state.pegs[i].type = 'gold');
    idx.slice(6, 10).forEach(i => state.pegs[i].type = 'mult');
    idx.slice(10, 16).forEach(i => state.pegs[i].type = 'coin');
}

export function addFloat(x, y, txt, color) {
    state.floats.push({ x, y, txt, color, t: 0 });
}

export function burst(x, y, color) {
    for (let i = 0; i < 6; i++) {
        const a = Math.random() * Math.PI * 2, s = 60 + Math.random() * 140;
        state.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 40, t: 0, color });
    }
}

export let playSound = () => {};
export function setSoundCallback(cb) { playSound = cb; }

export function hitPeg(peg, orb) {
    peg.hit = true;
    peg.flash = 1;
    
    if (state.owned.upgrade && peg.type === 'blue' && !orb.upgradeUsed) {
        peg.type = 'gold';
        orb.upgradeUsed = true;
        addFloat(peg.x, peg.y - 30, 'UPGRADED!', '#ffcf4d');
    }

    if (peg.type === 'blue') {
        playSound('hit');
        orb.pts += 10;
        addFloat(peg.x, peg.y - 12, '+10', '#4d7cff');
        burst(peg.x, peg.y, '#4d7cff');
    } else if (peg.type === 'gold') {
        playSound('gold');
        const v = state.owned.golden ? 80 : 40;
        orb.pts += v;
        addFloat(peg.x, peg.y - 12, '+' + v, '#ffcf4d');
        burst(peg.x, peg.y, '#ffcf4d');
        if (state.owned.split && !state.dropSplitUsed) {
            state.dropSplitUsed = true;
            state.orbs.push({ x: orb.x, y: orb.y, vx: -orb.vx - 30, vy: Math.min(orb.vy, 0), pts: 0, trail: [], still: 0, ghostUsed: false, upgradeUsed: false });
            addFloat(orb.x, orb.y - 26, 'SPLIT!', '#e0e0ff');
        }
    } else if (peg.type === 'mult') {
        playSound('mult');
        state.dropMult = Math.min(state.dropMult + 1, 6);
        addFloat(peg.x, peg.y - 12, '×' + state.dropMult, '#b96bff');
        burst(peg.x, peg.y, '#b96bff');
        state.slowMo = 0.5;
        state.shake = 0.3;
    } else if (peg.type === 'coin') {
        playSound('coin');
        const c = state.owned.coinx2 ? 2 : 1;
        state.coins += c;
        orb.pts += 5;
        addFloat(peg.x, peg.y - 12, '+' + c + '🪙', '#3ce38f');
        burst(peg.x, peg.y, '#3ce38f');
    }
}

export function landOrb(orb) {
    let bucket = 4;
    for (let i = 0; i < DIVIDERS.length; i++) {
        if (orb.x < DIVIDERS[i]) { bucket = i; break; }
    }
    const bmult = BUCKET_MULTS[bucket] + (state.owned.heavy ? 1 : 0);
    const gain = Math.round(orb.pts * state.dropMult * bmult);
    state.roundScore += gain;
    addFloat(orb.x, BH - 40, '+' + gain.toLocaleString('en-US') + (bmult > 1 ? ' (×' + bmult + ')' : ''), '#00e5a0');
    burst(orb.x, BH - 20, '#00e5a0');
    playSound('land');
    state.shake = 0.2;
}

export const restPeg = () => state.owned.bouncy ? 0.72 : REST_PEG;

export function collideCircle(o, cx, cy, cr, rest) {
    const dx = o.x - cx, dy = o.y - cy;
    const rr = ORB_R + cr;
    const d2 = dx * dx + dy * dy;
    if (d2 >= rr * rr || d2 === 0) return false;
    const d = Math.sqrt(d2);
    const nx = dx / d, ny = dy / d;
    o.x = cx + nx * rr;
    o.y = cy + ny * rr;
    const dot = o.vx * nx + o.vy * ny;
    if (dot < 0) {
        o.vx -= (1 + rest) * dot * nx;
        o.vy -= (1 + rest) * dot * ny;
        o.vx += (Math.random() - 0.5) * 24; // tangential jitter
    }
    return true;
}

export function collideRect(o, rx, ry, rw, rh) {
    const cx = Math.max(rx, Math.min(o.x, rx + rw));
    const cy = Math.max(ry, Math.min(o.y, ry + rh));
    const dx = o.x - cx, dy = o.y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 >= ORB_R * ORB_R) return;
    const d = Math.sqrt(d2) || 0.0001;
    const nx = dx / d, ny = dy / d;
    o.x += nx * (ORB_R - d);
    o.y += ny * (ORB_R - d);
    const dot = o.vx * nx + o.vy * ny;
    if (dot < 0) {
        o.vx -= (1 + REST_WALL) * dot * nx;
        o.vy -= (1 + REST_WALL) * dot * ny;
    }
}

export function stepPhysics(dt) {
    for (let oi = state.orbs.length - 1; oi >= 0; oi--) {
        const o = state.orbs[oi];
        o.vy += G * dt;

        if (state.owned.magnet) {
            for (const p of state.pegs) {
                if (p.hit) continue;
                const dx = p.x - o.x, dy = p.y - o.y;
                const d2 = dx * dx + dy * dy;
                if (d2 < 4900 && d2 > 260) {
                    const d = Math.sqrt(d2);
                    o.vx += (dx / d) * 220 * dt;
                    o.vy += (dy / d) * 220 * dt;
                }
            }
        }

        const sp = Math.hypot(o.vx, o.vy);
        if (sp > MAX_SPEED) { o.vx *= MAX_SPEED / sp; o.vy *= MAX_SPEED / sp; }

        o.x += o.vx * dt;
        o.y += o.vy * dt;

        if (o.x < WALL + ORB_R) { o.x = WALL + ORB_R; o.vx = Math.abs(o.vx) * REST_WALL; }
        if (o.x > BW - WALL - ORB_R) { o.x = BW - WALL - ORB_R; o.vx = -Math.abs(o.vx) * REST_WALL; }
        if (o.y < 12 + ORB_R) { o.y = 12 + ORB_R; o.vy = Math.abs(o.vy) * REST_WALL; }

        for (const p of state.pegs) {
            if (!p.hit) {
                if (state.owned.ghost && !o.ghostUsed) {
                    const dx = p.x - o.x, dy = p.y - o.y;
                    if (dx*dx + dy*dy < (ORB_R + PEG_R)*(ORB_R + PEG_R)) {
                        o.ghostUsed = true;
                        hitPeg(p, o);
                    }
                } else {
                    if (collideCircle(o, p.x, p.y, PEG_R, restPeg())) hitPeg(p, o);
                }
            }
        }

        for (const dx of DIVIDERS) collideRect(o, dx - 3, BUCKET_TOP, 6, BH - BUCKET_TOP);

        if (o.y > BH - 10 - ORB_R) {
            landOrb(o);
            state.orbs.splice(oi, 1);
            continue;
        }

        if (Math.hypot(o.vx, o.vy) < 26) {
            o.still += dt;
            if (o.still > 1.2) {
                o.vx += (Math.random() - 0.5) * 260;
                o.vy = -180;
                o.still = 0;
            }
        } else o.still = 0;

        o.trail.push({ x: o.x, y: o.y });
        if (o.trail.length > 12) o.trail.shift();
    }

    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.t += dt;
        p.vy += 900 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.t > 0.6) state.particles.splice(i, 1);
    }
    for (let i = state.floats.length - 1; i >= 0; i--) {
        state.floats[i].t += dt;
        if (state.floats[i].t > 1) state.floats.splice(i, 1);
    }
    for (const p of state.pegs) if (p.flash > 0) p.flash = Math.max(0, p.flash - dt * 2.5);
}
