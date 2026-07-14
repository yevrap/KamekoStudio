// ═══════════════════════════════════════════════════════════════════════════
// MAIN — event wiring, start/restart, settings integration, init.
// ═══════════════════════════════════════════════════════════════════════════

import { SIGNS } from './constants.js';
import { t, getLang } from './i18n.js';
import { setPaused, getBestStars } from './state.js';
import { newSession, onWheelTap, onChipTap, onContinue } from './gameplay.js';
import {
    $, renderStatic, buildWheel, buildLearnTable, setHub, renderDaily, changeDailySign, applyLanguage,
} from './ui.js';

function startNewSession() {
    localStorage.setItem('lastPlayed_astroSalon', String(Date.now()));
    newSession();
}

/* ---------------- boot ---------------- */

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
    meta.setAttribute('content', document.body.classList.contains('dark-mode') ? '#0b0a1a' : '#f4f2ff');
  }
  apply();
  new MutationObserver(apply).observe(document.body, { attributes: true, attributeFilter: ['class'] });
})();

renderStatic();
buildWheel();
buildLearnTable();
setHub('🔮', '');
document.documentElement.lang = getLang();

/* ---------------- static button wiring ---------------- */
// Pointer events (not click) per the studio's mobile-first convention —
// see games/durak-dungeon/main.js for the reference pattern.

function on(id, fn) {
    $(id).addEventListener('pointerdown', e => { e.preventDefault(); fn(e); });
}

on('btn-start', () => {
    $('ov-start').classList.remove('show');
    startNewSession();
});
on('btn-again', () => {
    $('ov-end').classList.remove('show');
    startNewSession();
});
on('btn-restart', () => {
    $('ov-end').classList.remove('show');
    startNewSession();
});
on('btn-learn', () => $('ov-learn').classList.add('show'));
on('btn-learn-close', () => $('ov-learn').classList.remove('show'));

const openDaily = () => { renderDaily(); $('ov-daily').classList.add('show'); };
on('btn-daily', openDaily);
on('btn-start-daily', openDaily);
on('btn-daily-change', changeDailySign);
on('btn-daily-close', () => $('ov-daily').classList.remove('show'));

on('btn-continue', onContinue);
on('btn-lang', () => applyLanguage(getLang() === 'en' ? 'ru' : 'en'));
on('btn-start-lang', () => applyLanguage(getLang() === 'en' ? 'ru' : 'en'));

/* ---------------- delegated gameplay taps ---------------- */
// The wheel svg and chips container persist across re-renders (their children
// are rebuilt each time), so one listener on each parent covers every render.

$('wheel').addEventListener('pointerdown', e => {
    const wedge = e.target.closest('.wedge');
    if (!wedge) return;
    e.preventDefault();
    onWheelTap(SIGNS[+wedge.dataset.sign]);
});

$('chips').addEventListener('pointerdown', e => {
    const chip = e.target.closest('.chip');
    if (!chip || chip.disabled) return;
    e.preventDefault();
    onChipTap(chip.dataset.key);
});

/* ---------------- settings integration ---------------- */
// Turn-based question flow, nothing to animate — "pause" means "ignore taps"
// while the drawer is open; state.js's isPaused() guards gameplay's handlers.

window.addEventListener('settingsOpened', () => setPaused(true));
window.addEventListener('settingsClosed', () => setPaused(false));

function registerSettingsSection() {
    if (!window.KamekoSettings) return;
    window.KamekoSettings.registerSection('astro-salon-info', {
        title: () => getLang() === 'ru' ? 'Астро Салон' : 'Astro Salon',
        render(container) {
            const best = getBestStars();
            const div = document.createElement('div');
            // No color set: the drawer panel is always dark chrome regardless
            // of the game's own light/dark theme, so it inherits the panel's
            // own `color: white` rather than risking var(--text) flipping dark
            // (the bug that pattern has elsewhere in the studio, e.g. durak-dungeon).
            div.style.cssText = 'font-size:0.78rem;line-height:1.6';
            div.textContent = best > 0
                ? t('bestStars')(best)
                : (getLang() === 'ru' ? 'Лучший результат пока не установлен.' : 'No best score yet.');
            container.appendChild(div);
        },
    });
}
registerSettingsSection();

// iOS PWA bfcache — DOMContentLoaded doesn't re-fire on back-navigation
window.addEventListener('pageshow', e => {
    if (e.persisted) {
        renderStatic();
        buildWheel();
    }
});
