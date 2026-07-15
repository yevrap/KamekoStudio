// Black Hole in One — synthesized WebAudio effects (headless-safe no-ops).
'use strict';

let AC = null;
let muted = false;

export function setMuted(m) { muted = m; }
export function isMuted() { return muted; }

export function audio() {
    if (typeof window === 'undefined') return null;
    if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; } }
    if (AC && AC.state === 'suspended') AC.resume();
    return AC;
}

function tone(freq, freqEnd, dur, type, gain, when) {
    if (muted || !AC) return;
    const t0 = AC.currentTime + (when || 0);
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    o.frequency.exponentialRampToValueAtTime(Math.max(freqEnd || freq, 1), t0 + dur);
    g.gain.setValueAtTime(gain || 0.1, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(AC.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
}

export const sfx = {
    flick()  { tone(180, 340, 0.12, 'triangle', 0.08); },
    bounce(k){ tone(80 + 60 * k, 55, 0.1, 'sine', 0.05 + 0.07 * k); },
    sling()  { tone(880, 1320, 0.14, 'triangle', 0.06); },
    lost()   { tone(220, 90, 0.35, 'sawtooth', 0.035); },
    land()   { tone(320, 210, 0.09, 'sine', 0.05); },
    sink()   { tone(420, 52, 0.7, 'sine', 0.1); tone(640, 66, 0.7, 'triangle', 0.04); },
    score(n) { for (let i = 0; i < n; i++) tone(520 * Math.pow(1.335, i), 520 * Math.pow(1.335, i), 0.12, 'triangle', 0.06, 0.55 + i * 0.09); },
};
