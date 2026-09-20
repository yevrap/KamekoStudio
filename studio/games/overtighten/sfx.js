// Overtighten — synthesized audio. No binary assets, nothing before a gesture.
//
// The context is created on the first pointer or key press and not before, so
// the page never asks a browser for audio it has not been given permission for
// and never prints the autoplay warning. Every function is a no-op with no
// context, which is also what makes the module safe to import in a test.

let ctx = null;
let muted = false;

export function setMuted(value) { muted = Boolean(value); }
export function isMuted() { return muted; }

/** Called from a user gesture, and only from one. */
export function unlock() {
  if (ctx || typeof window === 'undefined') return ctx;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) return null;
  try { ctx = new Ctor(); } catch { ctx = null; }
  return ctx;
}

function tone({ from, to = from, dur = 0.08, type = 'sine', gain = 0.06, delay = 0 }) {
  if (muted || !ctx) return;
  if (ctx.state === 'suspended') ctx.resume();
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(to, 1), t0 + dur);
  amp.gain.setValueAtTime(gain, t0);
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(amp).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export const sfx = {
  /** The ratchet, once per click of travel. Pitch rises with the bolt's tension. */
  click(tension = 0) { tone({ from: 150 + 260 * tension, to: 110 + 200 * tension, dur: 0.035, type: 'square', gain: 0.03 }); },
  /** A bolt entering its band. The one unambiguously good sound in the game. */
  seat() { tone({ from: 700, to: 1050, dur: 0.1, type: 'triangle', gain: 0.05 }); },
  /** Leaving it again, which is a thing a neighbour did to you. */
  unseat() { tone({ from: 420, to: 300, dur: 0.09, type: 'triangle', gain: 0.04 }); },
  /** The thread going. Low, short, and not musical. */
  strip() {
    tone({ from: 190, to: 48, dur: 0.34, type: 'sawtooth', gain: 0.07 });
    tone({ from: 90, to: 40, dur: 0.4, type: 'square', gain: 0.03, delay: 0.02 });
  },
  /** The plate closing. */
  solved() {
    [0, 1, 2].forEach(i => tone({ from: 560 * Math.pow(1.26, i), dur: 0.16, type: 'triangle', gain: 0.05, delay: i * 0.1 }));
  }
};
