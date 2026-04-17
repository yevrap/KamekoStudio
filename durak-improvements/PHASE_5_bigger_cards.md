# Phase 5 — Bigger Cards + Fanned Hand

**Goal:** Make cards 15–20 % larger at every breakpoint. Give the hand a subtle fan (outer cards tilted ±3°, middle cards lifted slightly) so it reads as a real player's hand. Refactor transform composition to use CSS variables so the `:active` scale no longer clobbers the fan rotation.

**Prerequisite:** Phases 1–4 have landed.

---

## Files touched

- `games/durak/style.css` — card size rules at all four breakpoints; hand overlap calc; transform composition refactor.
- `games/durak/ui.js` — set `--fan-angle` and `--fan-lift` per card in `renderHumanHand()`.

---

## Step-by-step changes

### 1. Refactor `.card-btn` transform to use CSS variables

Find `.card-btn` in `games/durak/style.css` (around line 353). Update the transform property:

```css
.card-btn {
  position: relative;
  display: flex;
  width: 68px;                       /* new base size (381–499 px breakpoint) */
  height: 95px;
  border: 1px solid var(--card-border);
  border-radius: 6px;
  background: var(--card-bg);
  color: var(--text);
  padding: 0;
  cursor: pointer;
  touch-action: manipulation;
  flex-shrink: 0;
  user-select: none;
  overflow: hidden;
  z-index: 1;
  box-shadow: 0 2px 5px rgba(0,0,0,0.3);
  transform: rotate(var(--fan-angle, 0deg))
             translateY(var(--fan-lift, 0px))
             scale(var(--card-scale, 1));
  transition: transform 0.1s, box-shadow 0.15s, opacity 0.15s ease;
}
```

Change the `.card-btn:active` rule (around line 376):

```css
.card-btn:active {
  --card-scale: 0.95;
  z-index: 10;
  /* no transform override */
}
```

Leave `.card-btn.flip-animating` alone — it already uses the `transform` property and the CSS-variable composition lets FLIP translate work because FLIP sets inline style `transform`, which takes precedence over the rule above. **Actually, this is a problem.** FLIP writes `element.style.transform = 'translate(dx, dy)'`, which overrides the CSS rule entirely. We need a different FLIP approach that composes with the fan rotation.

**Option A (simple, recommended):** let FLIP keep writing inline `transform` during the invert step, but ensure it writes a full composition including the current fan:

In `ui.js` `renderAll()`, when setting the inverted transform, include the cached fan angle/lift:

```js
// FLIP Invert step (around line 366–380)
for (var i = 0; i < flippedEls.length; i++) {
  var el = flippedEls[i];
  if (!el.parentElement) continue;
  var newRect = el.getBoundingClientRect();
  var dx = el._flipRect.left - newRect.left;
  var dy = el._flipRect.top - newRect.top;
  if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
    var fanAngle = el.style.getPropertyValue('--fan-angle') || '0deg';
    var fanLift = el.style.getPropertyValue('--fan-lift') || '0px';
    el.style.transform = 'translate(' + dx + 'px, ' + dy + 'px) ' +
                         'rotate(' + fanAngle + ') ' +
                         'translateY(' + fanLift + ') ' +
                         'scale(var(--card-scale, 1))';
    el.classList.add('flip-animating');
  }
}
```

Then in the Play step (where the invert is cleared), reset the inline transform to empty so the CSS rule takes over again:

```js
// FLIP Play step
requestAnimationFrame(function () {
  for (var i = 0; i < flippedEls.length; i++) {
    var el = flippedEls[i];
    el.style.transform = '';   // fall back to CSS rule composition
  }
});
```

**Option B (cleaner if FLIP code is more complex):** write the FLIP delta as a CSS variable instead of inline `transform`:

```js
el.style.setProperty('--flip-dx', dx + 'px');
el.style.setProperty('--flip-dy', dy + 'px');
el.classList.add('flip-animating');
```

And extend the CSS rule:

```css
.card-btn {
  transform: translate(var(--flip-dx, 0px), var(--flip-dy, 0px))
             rotate(var(--fan-angle, 0deg))
             translateY(var(--fan-lift, 0px))
             scale(var(--card-scale, 1));
}
.card-btn.flip-animating {
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  z-index: 100;
}
```

Then the Play step:

```js
el.style.setProperty('--flip-dx', '0px');
el.style.setProperty('--flip-dy', '0px');
```

**Option B is recommended** — it's entirely variable-driven, so any transform change (fan, scale, flip) composes cleanly. Pick Option B if the existing FLIP code is short enough to refactor.

### 2. Update card size breakpoints

Update the four size rules in `games/durak/style.css`:

**Base rule** (in the main `.card-btn` block, around line 356):
```css
.card-btn { width: 68px; height: 95px; }
.card-btn.field-card { width: 64px; height: 90px; }
.card-placeholder { width: 64px; height: 90px; }
```

**≤ 380 px** (around line 479):
```css
.card-btn { width: 58px; height: 82px; }
.card-btn.field-card { width: 56px; height: 78px; }
.card-placeholder { width: 56px; height: 78px; }
.hand-row > * + * { margin-left: calc(58px * -0.60); }     /* ≈ -35 px */
.hand-row { --hand-card-w: 58px; }
```

**≥ 500 px** (around line 495):
```css
.card-btn { width: 78px; height: 109px; }
.card-btn.field-card { width: 72px; height: 101px; }
.card-placeholder { width: 72px; height: 101px; }
.hand-row > * + * { margin-left: calc(78px * -0.55); }     /* ≈ -43 px */
.hand-row { --hand-card-w: 78px; }
```

**≥ 768 px** (around line 503):
```css
.card-btn { width: 88px; height: 123px; border-radius: 8px; }
.card-btn.field-card { width: 82px; height: 115px; }
.card-placeholder { width: 82px; height: 115px; }
.hand-row > * + * { margin-left: calc(88px * -0.55); }     /* ≈ -48 px */
.hand-row { --hand-card-w: 88px; }
```

### 3. Base hand-row overlap

Replace the existing `.hand-row > * + *` rule (around line 349) with:

```css
.hand-row { --hand-card-w: 68px; }
.hand-row > * + * { margin-left: calc(var(--hand-card-w) * -0.55); }
```

This uses the CSS variable so the overlap scales with the breakpoint automatically — and each breakpoint block just overrides `--hand-card-w`.

### 4. Hand-row vertical padding

Because the fan adds up to ~6 px of lift on outer cards (downward because `lift` is negative), the hand row may need a touch more bottom padding so the fanned cards aren't clipped by the action-button row below. Adjust:

```css
.hand-row {
  padding: 20px 8px 12px;          /* was: 16px 8px */
  /* keep the rest: overflow-x: auto, overscroll-behavior-x: contain, touch-action: pan-x, etc */
}
```

### 5. Set the fan in `renderHumanHand()`

Open `games/durak/ui.js`. Find `renderHumanHand()` (around line 222). After the existing loop that appends cards, add the fan loop:

```js
function renderHumanHand() {
  $humanHand.innerHTML = '';
  if (state.phase === 'passDevice') return;
  var viewer = currentViewerSeat();
  var p = state.players[viewer];
  if (!p) return;
  for (var i = 0; i < p.hand.length; i++) {
    var el = createCardEl(p.hand[i], 'hand');
    el.dataset.seat = viewer;
    $humanHand.appendChild(el);
  }

  // NEW — apply the hand fan
  var cards = $humanHand.querySelectorAll('.card-btn');
  var N = cards.length;
  for (var j = 0; j < N; j++) {
    var offset = j - (N - 1) / 2;
    var angle = offset * (6 / Math.max(N, 1));
    var lift = -Math.abs(offset) * (6 / Math.max(N, 1));
    cards[j].style.setProperty('--fan-angle', angle.toFixed(2) + 'deg');
    cards[j].style.setProperty('--fan-lift', lift.toFixed(2) + 'px');
  }
}
```

Important: do NOT set `--fan-angle` / `--fan-lift` anywhere else (field cards, deck cards, seat cards). They default to `0deg` / `0px` per the CSS variable fallback.

### 6. Clear fan variables when cards leave the hand

When a card moves from hand → field (user plays a card), the same pooled element is reused. The new container (the field pair) doesn't reset the fan, so a field card could accidentally render tilted.

**Fix:** in `renderField()` (around line 196), after appending a card element to a field pair, explicitly clear any leftover fan variables:

```js
function renderField() {
  // ...existing field-empty / watermark logic from Phase 1...
  $field.innerHTML = '';
  var attacks = state.field.attacks;
  var defenses = state.field.defenses;
  var n = attacks.length;
  for (var i = 0; i < n; i++) {
    var pair = document.createElement('div');
    pair.className = 'field-pair';
    var atkEl = createCardEl(attacks[i], 'field');
    atkEl.classList.add('field-card');
    atkEl.style.removeProperty('--fan-angle');       // NEW
    atkEl.style.removeProperty('--fan-lift');        // NEW
    pair.appendChild(atkEl);
    if (defenses[i]) {
      var defEl = createCardEl(defenses[i], 'field');
      defEl.classList.add('field-card', 'defense');
      defEl.style.removeProperty('--fan-angle');     // NEW
      defEl.style.removeProperty('--fan-lift');      // NEW
      pair.appendChild(defEl);
    } else {
      var ph = document.createElement('div');
      ph.className = 'card-placeholder';
      pair.appendChild(ph);
    }
    $field.appendChild(pair);
  }
}
```

Also in `renderDeckZone()` (around line 323), clear fan variables on the trump card and each deck back:

```js
if (state.deck.length > 0 && state.trumpCard) {
  var tEl = createCardEl(state.trumpCard, 'trump');
  tEl.style.removeProperty('--fan-angle');
  tEl.style.removeProperty('--fan-lift');
  $trumpSlot.appendChild(tEl);
}
```

### 7. Verify the `:active` still feels responsive

With `--card-scale: 0.95` on `:active`, tapping a hand card should show a subtle press. The rotation is preserved during the press. If the press feels too subtle, bump to `--card-scale: 0.92`.

---

## Verification

1. Run `npx serve .`. Open at 390 × 844 viewport.
2. Start a 4-player vs Computer game.
3. **Confirm:** hand cards are visibly larger than before (68 × 95 at this viewport). The corners show rank + suit clearly.
4. **Confirm:** the hand FANS — outer cards tilt outward, middle cards lifted slightly above the baseline.
5. Tap a card. **Confirm:** it presses (scales to 0.95) without losing the fan rotation. The tap still plays the card (assuming it's a legal play).
6. After the card moves to the field, **confirm:** the field card renders straight (no residual rotation).
7. Resize the viewport to 320 px (smallest Chrome devtools preset). **Confirm:** cards shrink to 58 × 82 and the hand still fits on-screen (with the tighter `-0.60` overlap).
8. Resize to 768 px. **Confirm:** cards scale up to 88 × 123 and look generous.
9. Drag the hand (via pointer-drag on a mouse, or touch-swipe on mobile). **Confirm:** horizontal scroll works. The fan does not interfere with scroll.
10. Start a game with 2 players vs Computer. The single opponent's dealing animation (cards flying from deck to hand) should be smooth — confirm no FLIP regression.
11. Run `node --test tests/`.

---

## What NOT to change in this phase

- Don't touch the tap-vs-drag handler in `main.js` (lines 155–198). The 8 px threshold still applies correctly.
- Don't change the `wireHandScroll` drag logic.
- Don't change game logic.

---

## Common pitfalls

- **Fan visible on field or deck cards:** that means you didn't clear `--fan-angle` / `--fan-lift` in `renderField` or `renderDeckZone`. See step 6.
- **FLIP animations look jittery:** the rotation shifts `getBoundingClientRect()` by a small amount even when the card hasn't moved. Option B (CSS-variable FLIP) is immune to this because FLIP doesn't write to the transform property directly. If you're using Option A, bump the `> 1` threshold in the FLIP Invert step to `> 3`.
- **`:active` press doesn't scale:** the `--card-scale: 0.95` only applies while the pointer is pressed. If the card doesn't scale at all, you probably still have `transform: scale(0.95)` in `.card-btn:active` — delete it.
- **Cards too large on 768 px desktop and they overflow the hand row:** the `.hand-row` uses `overflow-x: auto` so overflow becomes scrollable. That's intentional — users can drag-scroll even on large screens.
- **Fan too subtle:** bump the `6` coefficient in the angle/lift formulas to `9` for a more dramatic fan. But `6` matches the DESIGN.md spec of ±3° max tilt.
- **Fan too aggressive with few cards:** at N=2, the formula gives angles of ±1.5°. That's fine. At N=1, angle is 0°. Good.
