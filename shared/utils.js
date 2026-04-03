// shared/utils.js — Pure utility functions for Kameko Studio games.
// Loaded as a <script> in the browser (functions become globals).
// Also require()-able in Node.js tests via the export guard at the bottom.

// ─── Deck text format ─────────────────────────────────────────────────────────

function deckToPlainText(deck) {
  return '# ' + deck.name + '\n' +
    deck.pairs.map(p => p.k + ': ' + p.v).join('\n');
}

function parsePlainText(str) {
  const lines = str.split('\n');
  let name = 'Imported Deck';
  const pairs = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('#')) { name = line.slice(1).trim() || name; continue; }
    const ci = line.indexOf(':');
    if (ci < 1) continue;
    const k = line.slice(0, ci).trim();
    const v = line.slice(ci + 1).trim();
    if (k && v) pairs.push({ k, v });
  }
  return pairs.length > 0 ? { name, pairs } : null;
}

// ─── General utilities ────────────────────────────────────────────────────────

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function lerpHex(a, b, t) {
  const ah = parseInt(a.slice(1), 16), bh = parseInt(b.slice(1), 16);
  const r = Math.round(((ah>>16)&0xff) + (((bh>>16)&0xff)-((ah>>16)&0xff))*t);
  const g = Math.round(((ah>>8)&0xff)  + (((bh>>8)&0xff) -((ah>>8)&0xff))*t);
  const bl= Math.round((ah&0xff)       + ((bh&0xff)      -(ah&0xff))*t);
  return '#'+(((r<<16)|(g<<8)|bl)>>>0).toString(16).padStart(6,'0');
}

// ─── Game logic ───────────────────────────────────────────────────────────────

// Returns tower tier (0–3) for a given answer streak count.
function typeForStreak(s) {
  if (s >= 8) return 3; if (s >= 5) return 2; if (s >= 3) return 1; return 0;
}

// ─── Node.js export (ignored in browser) ─────────────────────────────────────

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { parsePlainText, deckToPlainText, shuffle, lerpHex, typeForStreak };
}
