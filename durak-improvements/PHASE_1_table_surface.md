# Phase 1 — Felt Table Surface

**Goal:** The center of the screen looks like a green felt card table, not a grey box. No game mechanics change. The game remains fully playable at the end of this phase.

**Prerequisite:** Read [DESIGN.md](DESIGN.md) — specifically the sections on "New CSS Custom Properties" and "Empty-State Field Watermark". This phase implements those pieces.

---

## Files touched

- `games/durak/style.css` — add theme tokens, add `.table-surface` class, swap `#field` background.
- `games/durak/index.html` — add the `.field-watermark` element inside `#table-center`.
- `games/durak/ui.js` — toggle `.field-empty` class on `#table-center` in `renderField()`.

---

## Step-by-step changes

### 1. Add new theme tokens

In `games/durak/style.css`, append to the `:root { ... }` block (around line 3–24):

```css
--felt: radial-gradient(ellipse at center, #1f5740 0%, #0f2e22 70%, #081812 100%);
--table-border: rgba(255, 215, 100, 0.12);
--table-inner-shadow: inset 0 2px 20px rgba(0, 0, 0, 0.4);
--seat-bg: rgba(16, 36, 28, 0.85);
--seat-border: rgba(255, 255, 255, 0.08);
--active-seat-glow: rgba(255, 215, 100, 0.45);
--prompt-bg: rgba(20, 40, 30, 0.85);
--prompt-text: #f0f4f0;
--watermark-color: rgba(255, 255, 255, 0.06);
```

Append to the `body:not(.dark-mode) { ... }` block (around line 26–47):

```css
--felt: radial-gradient(ellipse at center, #4a7a5c 0%, #355a44 70%, #264030 100%);
--table-border: rgba(0, 0, 0, 0.15);
--table-inner-shadow: inset 0 2px 20px rgba(0, 0, 0, 0.2);
--seat-bg: rgba(245, 245, 240, 0.9);
--seat-border: rgba(0, 0, 0, 0.08);
--active-seat-glow: rgba(40, 100, 60, 0.4);
--prompt-bg: rgba(255, 255, 255, 0.9);
--prompt-text: #1a2a20;
--watermark-color: rgba(255, 255, 255, 0.18);
```

### 2. Re-style `#table-center` as the table surface

Find the existing `#table-center` rule in `games/durak/style.css` (around line 223). Replace with:

```css
#table-center {
  flex: 1.5;
  position: relative;                            /* NEW — anchors absolute children (watermark, later phases: deck + prompt) */
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 6px;
  min-height: 0;
  margin: 2px 8px;                               /* slightly more horizontal margin */
  background: var(--felt);                       /* NEW */
  border: 1px solid var(--table-border);         /* NEW */
  border-radius: 16px;                           /* NEW */
  box-shadow: var(--table-inner-shadow);         /* NEW */
  overflow: hidden;                              /* NEW — keeps the rounded-rect clip clean */
}
```

### 3. Make the field transparent so felt shows through

Find the `#field` rule (around line 263). Change:

```css
background: var(--field-bg);
```

to:

```css
background: transparent;
```

Leave the rest of `#field` alone — it's still a flex-wrap container for field pairs. The existing `border-radius: 8px` can be removed since the field no longer has its own background.

### 4. Add the field watermark element

In `games/durak/index.html`, modify the `#table-center` block (around line 28–34):

```html
<div id="table-center">
  <div id="field-watermark" aria-hidden="true"></div>   <!-- NEW -->
  <div id="deck-zone">
    <div id="trump-slot"></div>
    <div id="deck-stack"></div>
  </div>
  <div id="field"></div>
</div>
```

### 5. Style the watermark

Append to `games/durak/style.css`:

```css
#field-watermark {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 0;
  opacity: 0;
  transition: opacity 0.4s ease;
}
#table-center.field-empty #field-watermark {
  opacity: 1;
}
#field-watermark svg {
  width: 40%;
  max-width: 280px;
  height: auto;
  fill: var(--watermark-color);
}
```

Make sure `#deck-zone` and `#field` have `position: relative; z-index: 1` so they sit above the watermark. Add to the existing rules:

```css
#deck-zone { position: relative; z-index: 1; /* ...existing rules... */ }
#field { position: relative; z-index: 1; /* ...existing rules... */ }
```

### 6. Populate the watermark with the trump suit SVG

Open `games/durak/cards.js`. The `PIPS` dict (around line 21) holds SVG path data for each suit. Export a helper function that builds a full SVG for the watermark:

```js
// Append near the top-level exports in cards.js
export function suitSvgForWatermark(suit) {
  var pip = PIPS[suit];
  if (!pip) return '';
  // PIPS paths are drawn inside a 0..100 coordinate system.
  return '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">' +
         '<path d="' + pip + '"/>' +
         '</svg>';
}
```

(Check the actual variable name — if `PIPS` is named differently in `cards.js`, adjust accordingly.)

### 7. Wire the watermark in `ui.js`

In `games/durak/ui.js`:

**a.** Import the new helper at the top of the file, next to the existing imports from `cards.js`:

```js
import { createCardEl, createCardBackEl, suitSvgForWatermark } from './cards.js';
```

**b.** Find the `renderField()` function (around line 196). At the top of the function, before mutating `$field`, toggle the `field-empty` class on `#table-center` and refresh the watermark:

```js
function renderField() {
  var tableCenter = document.getElementById('table-center');
  var wm = document.getElementById('field-watermark');
  var isEmpty = state.field.attacks.length === 0;
  if (tableCenter) tableCenter.classList.toggle('field-empty', isEmpty);
  if (wm && isEmpty && state.trumpSuit) {
    wm.innerHTML = suitSvgForWatermark(state.trumpSuit);
  } else if (wm && !isEmpty) {
    wm.innerHTML = '';
  }

  $field.innerHTML = '';
  // ...existing body unchanged...
}
```

---

## Verification

1. Run `npx serve .` from the repo root. Open `http://localhost:3000/games/durak/` in Chrome devtools with an iPhone 13 mini viewport (390 × 844).
2. Start a 4-player vs Computer game.
3. **Confirm:** the center of the screen is now green felt with rounded corners, a subtle hairline border, and inset depth shadow. No more grey box.
4. **Confirm:** before the first card is played (or whenever the field is empty), a faint trump-suit watermark is visible centered in the table.
5. **Confirm:** when a card is played, the watermark fades out. When the pile clears, it fades back in.
6. Toggle to light mode via the settings gear. Confirm the felt is still a convincing "card table green", just lighter.
7. Run `node --test tests/` — tests should still pass (no logic changes).

---

## What NOT to change in this phase

- Don't move the deck zone yet (Phase 2 handles that).
- Don't touch the opponent tiles yet (Phase 3 handles that).
- Don't touch the header yet (Phase 4 handles that).
- Don't change card sizes yet (Phase 5 handles that).

Keep the diff scoped to what's listed above. The game should be fully playable at the end of this phase.

---

## Common pitfalls

- **Watermark hidden by field background:** make sure step 3 (transparent `#field`) is applied.
- **Watermark clipped:** `#table-center` needs `overflow: hidden` + `position: relative`.
- **Watermark SVG not filling:** check the `cards.js` export path and that `PIPS` really exists under that name.
- **Light-mode watermark invisible:** light mode uses a lighter watermark colour. If it looks too faint, bump `--watermark-color` opacity up slightly in the light block (0.18 → 0.25).
- **Felt gradient too harsh:** if the gradient center feels too bright, darken the first colour stop in `--felt` by 5–10 %.
