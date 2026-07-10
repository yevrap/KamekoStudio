// ═══════════════════════════════════════════════════════════════════════════
// SFX — synthesized WebAudio sounds: card snap, marriage chime, bid gavel.
//       No audio assets (static-files-only repo) — everything is generated.
//       Every entry point no-ops headless and when muted; the AudioContext
//       is created lazily on the first sound after a user gesture.
// ═══════════════════════════════════════════════════════════════════════════

const hasWindow = typeof window !== 'undefined';
const hasLS = typeof localStorage !== 'undefined';

let muted = hasLS && localStorage.getItem('tysiacha_muted') === 'true';
let ctx = null;

export function isMuted() { return muted; }
export function setMuted(m) {
    muted = m;
    if (hasLS) localStorage.setItem('tysiacha_muted', String(m));
}

function ac() {
    if (!hasWindow || muted) return null;
    if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();   // scheduled sounds start once running
    return ctx;
}

// One decaying oscillator note.
function tone(c, { freq, sweepTo = null, type = 'sine', vol = 0.2, at = 0, dur = 0.3 }) {
    const t0 = c.currentTime + at;
    const o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (sweepTo) o.frequency.exponentialRampToValueAtTime(sweepTo, t0 + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g).connect(c.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
}

// One decaying noise burst through a bandpass.
function burst(c, { freq = 1800, q = 1.2, vol = 0.4, at = 0, dur = 0.06 }) {
    const t0 = c.currentTime + at;
    const len = Math.floor(dur * c.sampleRate);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = freq;
    bp.Q.value = q;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(bp).connect(g).connect(c.destination);
    src.start(t0);
}

// Card hitting the felt: bright noise tick + a soft low thump.
export function snap() {
    const c = ac(); if (!c) return;
    burst(c, { freq: 2200, vol: 0.35, dur: 0.045 });
    tone(c, { freq: 130, sweepTo: 70, vol: 0.12, dur: 0.08 });
}

// Marriage declared: two rising bell notes with a quiet overtone each.
export function chime() {
    const c = ac(); if (!c) return;
    tone(c, { freq: 880, vol: 0.16, dur: 0.5 });
    tone(c, { freq: 1760, vol: 0.05, dur: 0.4 });
    tone(c, { freq: 1174.7, vol: 0.16, at: 0.13, dur: 0.7 });
    tone(c, { freq: 2349.3, vol: 0.05, at: 0.13, dur: 0.5 });
}

// Bidding won: one gavel knock — low pitch drop plus woody click.
export function gavel() {
    const c = ac(); if (!c) return;
    tone(c, { freq: 160, sweepTo: 55, type: 'triangle', vol: 0.35, dur: 0.13 });
    burst(c, { freq: 900, q: 2, vol: 0.25, dur: 0.03 });
}
