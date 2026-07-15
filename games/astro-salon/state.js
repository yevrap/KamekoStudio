// ═══════════════════════════════════════════════════════════════════════════
// STATE — shared mutable game state + small persisted-value helpers.
// ═══════════════════════════════════════════════════════════════════════════

const hasLS = typeof localStorage !== 'undefined';

export const TOTAL_GUESTS = 5;

// The active salon session, or null before the first session starts.
export let G = null;
export function setG(next) { G = next; }

// settings drawer pause: turn-based game, so "pause" means "ignore taps"
// while the drawer is open, rather than freezing a timer/animation loop.
let paused = false;
export function isPaused() { return paused; }
export function setPaused(v) { paused = v; }

/* ---------------- persisted values ---------------- */

export function getMySign() {
    const n = hasLS ? parseInt(localStorage.getItem('astroSalon_mySign'), 10) : NaN;
    return (Number.isInteger(n) && n >= 0 && n <= 11) ? n : null;
}
export function setMySign(id) {
    if (hasLS) localStorage.setItem('astroSalon_mySign', String(id));
}
export function clearMySign() {
    if (hasLS) localStorage.removeItem('astroSalon_mySign');
}

// best stars are tracked per session type — the two rooms have different maxima
const BEST_KEY = { salon: 'astroSalon_bestStars', chart: 'astroSalon_bestStarsChart' };

export function getBestStars(mode = 'salon') {
    const n = hasLS ? parseInt(localStorage.getItem(BEST_KEY[mode]), 10) : NaN;
    return Number.isFinite(n) ? n : 0;
}
export function reportSessionStars(stars, mode = 'salon') {
    if (!hasLS) return getBestStars(mode);
    const best = Math.max(getBestStars(mode), stars);
    localStorage.setItem(BEST_KEY[mode], String(best));
    return best;
}
