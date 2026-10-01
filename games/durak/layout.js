// layout.js — field geometry, pure (no DOM) so it runs under node --test.
//
// Each attack is a column: the attack card, and under it the defense card
// shifted down DEF_OFFSET of a card height so the attack's rank and suit
// stay visible. Pairs sit side by side with no overlap and wrap into rows.

export var CARD_ASPECT = 1.4;   // card height / width
export var DEF_OFFSET = 0.45;   // defense card's drop, in card heights

// Height of one pair (attack + dropped defense) for a card width.
export function pairHeight(cardW) {
  return cardW * CARD_ASPECT * (1 + DEF_OFFSET);
}

// The largest card width (capped at maxW, floored at minW) at which n pairs
// fit a field of availW × availH, and how many pairs go in a row. One row
// reads best, so more rows win only when they make cards ≥10% bigger.
export function fieldLayout(n, availW, availH, opts) {
  var maxW = opts.maxW, minW = opts.minW;
  var gapX = opts.gapX || 0, gapY = opts.gapY || 0;
  if (n <= 0) return { cardW: maxW, perRow: 1 };
  var best = null;
  for (var perRow = n; perRow >= 1; perRow--) {
    var rows = Math.ceil(n / perRow);
    var byW = (availW - (perRow - 1) * gapX) / perRow;
    var byH = (availH - (rows - 1) * gapY) / (rows * CARD_ASPECT * (1 + DEF_OFFSET));
    var w = Math.min(maxW, byW, byH);
    if (!best || w > best.cardW * 1.1) best = { cardW: w, perRow: perRow };
  }
  // Same number of rows, balanced: 3 + 3 rather than 4 + 2 (never narrower).
  best.perRow = Math.ceil(n / Math.ceil(n / best.perRow));
  best.cardW = Math.max(minW, Math.floor(best.cardW));
  return best;
}
