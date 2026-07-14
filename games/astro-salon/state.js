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

export function getBestStars() {
    const n = hasLS ? parseInt(localStorage.getItem('astroSalon_bestStars'), 10) : NaN;
    return Number.isFinite(n) ? n : 0;
}
export function reportSessionStars(stars) {
    if (!hasLS) return getBestStars();
    const best = Math.max(getBestStars(), stars);
    localStorage.setItem('astroSalon_bestStars', String(best));
    return best;
}
