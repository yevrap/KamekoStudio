# Phase 2 — Dock Deck + Trump into the Table

**Goal:** The deck and trump card move INSIDE the felt table surface, docked in the top-left corner. They stop floating off to the side. The deck count label relocates here as well.

**Prerequisite:** [Phase 1](PHASE_1_table_surface.md) has landed — the felt `.table-surface` exists and `#table-center` has `position: relative`.

---

## Files touched

- `games/durak/style.css` — reposition `#deck-zone` absolutely inside `#table-center`; add `#deck-count` styling.
- `games/durak/index.html` — add a `#deck-count` element next to the deck zone (moved later from the header in Phase 4, but created here as the new target).
- `games/durak/ui.js` — adjust `updateHeader()` to target the relocated `#deck-count` element (safe here because the old element is still in the header; we read/write whichever one exists).

---

## Step-by-step changes

### 1. Dock the deck zone inside the table

Find `#deck-zone` in `games/durak/style.css` (around line 235–241). Replace with:

```css
#deck-zone {
  position: absolute;           /* was: relative */
  top: 10px;
  left: 10px;
  width: 50px;                  /* sync with hand/field card sizes per breakpoint */
  height: 70px;
  z-index: 2;
  margin-right: 0;              /* remove the -28px trump overflow hack */
  pointer-events: none;         /* the deck/trump don't receive taps; they're decor */
}
```

### 2. Add a deck count label

Append in `games/durak/style.css`:

```css
#deck-count {
  position: absolute;
  top: 82px;                    /* just below the deck zone on the base breakpoint */
  left: 10px;
  width: 50px;
  text-align: center;
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--text-muted);
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
  z-index: 2;
  pointer-events: none;
}
```

At this phase, `#deck-count` is still inside `#header` in the DOM. That's OK — we give it absolute positioning relative to its OFFSET PARENT, which at this phase is still the viewport (because `#header` doesn't have `position: relative`). To make it attach to `#table-center` right now, we relocate the DOM element.

### 3. Move `#deck-count` from the header into `#table-center`

In `games/durak/index.html`, remove `<span id="deck-count"></span>` from `#header`:

```html
<!-- BEFORE -->
<div id="header">
  <span id="game-title">DURAK</span>
  <span id="status-display"></span>
  <span id="trump-display"></span>
  <span id="deck-count"></span>
</div>

<!-- AFTER (this phase only removes #deck-count; #status-display and #trump-display leave later) -->
<div id="header">
  <span id="game-title">DURAK</span>
  <span id="status-display"></span>
  <span id="trump-display"></span>
</div>
```

In the same file, add a `#deck-count` div inside `#table-center`:

```html
<div id="table-center">
  <div id="field-watermark" aria-hidden="true"></div>
  <div id="deck-zone">
    <div id="trump-slot"></div>
    <div id="deck-stack"></div>
  </div>
  <div id="deck-count"></div>            <!-- NEW -->
  <div id="field"></div>
</div>
```

Change the element type from `<span>` to `<div>` for block layout.

### 4. Update the trump slot rotation

The trump card at `#trump-slot` is rotated 90° and translated so it peeks out to the right of the deck (current CSS line 247). Since the deck is now docked in the top-left corner, the trump still rotates and peeks right — but we need to confirm it doesn't collide with the upcoming action-prompt pill (Phase 4).

Keep the existing transform:

```css
#trump-slot {
  position: absolute;
  top: 50%; left: 50%;
  width: 50px; height: 70px;              /* match deck-zone size */
  transform: translate(-50%, -50%) rotate(90deg) translate(0, -28px);
  z-index: 1;
}
```

Adjust the size tokens to match the deck-zone base size (50 × 70 at the base breakpoint, per the DESIGN.md size table).

### 5. Give the field room for the docked deck

Cards played to the field (`#field`) should not spawn on top of the docked deck. Add left padding to reserve space:

```css
#field {
  /* ...existing rules (with transparent background from Phase 1)... */
  padding: 6px 6px 6px 72px;     /* left padding = deck width (50) + deck horizontal offset (10) + gap (12) */
  box-sizing: border-box;
}
```

At each breakpoint, `padding-left` should match `deck-zone width + 22px`:
- ≤ 380 px: `padding-left: 66px` (deck 44 + 22)
- 381–499 (base): `padding-left: 72px` (deck 50 + 22)
- 500–767 px: `padding-left: 78px` (deck 56 + 22)
- ≥ 768 px: `padding-left: 84px` (deck 62 + 22)

### 6. Size adjustments per breakpoint

Inside each existing `@media` block in `games/durak/style.css`, adjust the `#deck-zone`, `#trump-slot`, and `#deck-count` rules:

**≤ 380 px** (around line 491):

```css
#deck-zone { width: 44px; height: 62px; top: 8px; left: 8px; }
#trump-slot {
  width: 44px; height: 62px;
  transform: translate(-50%, -50%) rotate(90deg) translate(0, -22px);
}
#deck-count { top: 72px; left: 8px; width: 44px; font-size: 0.6rem; }
#field { padding-left: 66px; }
```

**≥ 500 px** (around line 495):

```css
#deck-zone { width: 56px; height: 78px; top: 12px; left: 12px; }
#trump-slot {
  width: 56px; height: 78px;
  transform: translate(-50%, -50%) rotate(90deg) translate(0, -32px);
}
#deck-count { top: 92px; left: 12px; width: 56px; font-size: 0.72rem; }
#field { padding-left: 78px; }
```

**≥ 768 px** (around line 503):

```css
#deck-zone { width: 62px; height: 87px; top: 14px; left: 14px; }
#trump-slot {
  width: 62px; height: 87px;
  transform: translate(-50%, -50%) rotate(90deg) translate(0, -38px);
}
#deck-count { top: 103px; left: 14px; width: 62px; font-size: 0.75rem; }
#field { padding-left: 84px; }
```

### 7. Make sure `updateHeader()` still finds `#deck-count`

Open `games/durak/ui.js`. Find `$deckCount` assignment near the top of the file (likely around line 10–40 where DOM references are cached). It uses `document.getElementById('deck-count')` or similar — since we just moved the element rather than removed it, the reference still works. No change needed.

If the reference is cached at module-load time (before `init()`), verify it still resolves. In the current codebase the reference is cached in `ui.js` and works after the DOM is moved.

### 8. Remove the old `#deck-count` header styling

The existing `#deck-count { font-variant-numeric: tabular-nums; }` rule in the header block (around line 108) is now redundant but harmless — the new absolute-positioned rule overrides it. Either leave it or delete it; the new rule takes precedence by specificity and position.

### 9. Remove the trump overflow space in `#table-center`

The original `#deck-zone { margin-right: 28px; }` created space for the rotated trump peeking out. Since the deck is now absolute-positioned, that margin is gone. The flex layout of `#table-center` needs to accommodate the field taking full width; confirm that the existing `flex: 1` on `#field` still works.

### 10. Trump card remains visible during play

The trump stays in the `#trump-slot` as long as the deck has cards. When the deck is exhausted, the trump card moves to its natural position (either the player who drew it, or stays as a visible indicator if game logic retains it). No change needed — this is already how `renderDeckZone()` at `ui.js` line 323 works.

---

## Verification

1. Run `npx serve .` and open the game at `http://localhost:3000/games/durak/`.
2. Start a 4-player vs Computer game.
3. **Confirm:** the deck + trump are INSIDE the felt panel, docked in the top-left corner.
4. **Confirm:** a "Deck: 9" label (or similar) appears directly below the deck stack. The deck count decreases as cards are drawn.
5. **Confirm:** cards played to the field appear to the right of the docked deck — they don't overlap the deck visually.
6. **Confirm:** at all four breakpoints (380 / 500 / 768 / ≥ 768 px viewport widths in Chrome devtools), the deck stays docked with the right proportions.
7. Toggle light mode. Confirm the docked deck reads clearly against the lighter felt.
8. Run `node --test tests/`. Should still pass.

---

## What NOT to change in this phase

- Don't change opponent tiles (Phase 3).
- Don't move `#status-display` or `#trump-display` yet (Phase 4).
- Don't change card sizes (Phase 5).

---

## Common pitfalls

- **Deck count appears at the top-left of the viewport instead of inside the table:** this means `#table-center` is missing `position: relative` (should have been added in Phase 1). Verify.
- **Trump card clipped by `overflow: hidden`:** if the 90°-rotated trump card extends beyond `#table-center`, the `overflow: hidden` from Phase 1 will clip it. Re-check the trump-slot transform — at the base breakpoint, the trump peeks 28 px to the right of the deck; with `left: 10px`, the trump's rightmost edge is around `10 + 50/2 + 28 + 70/2 = 98 px` from the table's left edge — well within the table.
- **Card pool confusion:** `renderDeckZone()` uses pooled card elements. Re-rendering must not destroy the cached elements during the FLIP animation. Trust the existing pool; don't touch it in this phase.
- **Field pairs crowding the deck on small screens:** if attack + defense pairs feel too close to the docked deck at ≤ 380 px, the fallback is to give the field `padding-left` a tiny extra `+4 px` at the smallest breakpoint.
