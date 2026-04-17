# Phase 4 — Slim Header + Action Prompt Pill

**Goal:** Slim the header down to just the wordmark + settings gear. Move the "what do I do now" status onto the table as a prominent, colour-accented action-prompt pill. Relocate the pile-on banner to the same spot so the player always looks at ONE place to understand game state.

**Prerequisite:** Phases 1, 2, and 3 have landed. Felt table, docked deck, seat tiles.

---

## Files touched

- `games/durak/index.html` — move `#status-display` onto the table; remove `#trump-display` entirely; relocate `#pile-banner`.
- `games/durak/style.css` — strip `#header` width hack; add `.action-prompt` class and state modifiers; restyle `#pile-banner`.
- `games/durak/ui.js` — set `.action-prompt` state modifier class from `getStatusText()` context; remove `#trump-display` handling in `updateHeader()`; ensure `#pile-banner` element still resolves.

---

## Step-by-step changes

### 1. Edit `index.html` — slim header, move status onto table

Replace `#header` and `#table-center` in `games/durak/index.html`:

```html
<!-- BEFORE -->
<div id="header">
  <span id="game-title">DURAK</span>
  <span id="status-display"></span>
  <span id="trump-display"></span>
</div>

<div id="opponents"></div>

<div id="pile-banner" class="hidden">Defender is taking &mdash; pile on or tap Done</div>

<div id="table-center">
  <div id="field-watermark" aria-hidden="true"></div>
  <div id="deck-zone">
    <div id="trump-slot"></div>
    <div id="deck-stack"></div>
  </div>
  <div id="deck-count"></div>
  <div id="field"></div>
</div>

<!-- AFTER -->
<div id="header">
  <span id="game-title">DURAK</span>
</div>

<div id="opponents"></div>

<div id="table-center">
  <div id="field-watermark" aria-hidden="true"></div>
  <div id="deck-zone">
    <div id="trump-slot"></div>
    <div id="deck-stack"></div>
  </div>
  <div id="deck-count"></div>
  <div id="status-display" class="action-prompt"></div>
  <div id="pile-banner" class="action-prompt is-pile-on hidden">Defender is taking &mdash; pile on or tap Done</div>
  <div id="field"></div>
</div>
```

Key changes:
- `#trump-display` is removed entirely. The trump card docked on the table is the trump indicator.
- `#status-display` is changed from `<span>` to `<div>`, moved inside `#table-center`, and given the class `action-prompt`.
- `#pile-banner` moves inside `#table-center` and shares the `action-prompt` class. When it's visible, it replaces the normal status prompt.

### 2. Slim the header CSS

In `games/durak/style.css`, update `#header` (around line 87):

```css
#header {
  display: flex;
  align-items: center;
  justify-content: flex-start;   /* was: space-between */
  gap: 8px;
  height: 40px;                  /* was: 44px */
  padding: 0 12px;
  padding-right: 58px;           /* keep — still clears the settings gear */
  background: var(--header-bg);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--card-border);
  flex-shrink: 0;
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}
```

Delete the old `#status-display`, `#deck-count`, `#trump-display`, `#trump-display.suit-red`, `#trump-display.suit-black` rules that target elements inside the header. (The `#deck-count` element is now inside `#table-center` from Phase 2; its rules in the Phase 2 file supersede these.)

Keep `#game-title { color: var(--text); font-size: 0.9rem; }`.

### 3. Add the `.action-prompt` styles

Append to `games/durak/style.css`:

```css
/* --- Action Prompt (on the table) --- */
.action-prompt {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  max-width: calc(100% - 140px);           /* clearance from the docked deck on the left */
  padding: 8px 18px;
  border-radius: 999px;
  background: var(--prompt-bg);
  color: var(--prompt-text);
  font-size: 0.95rem;
  font-weight: 700;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
  border: 1px solid transparent;
  z-index: 3;
  transition: background 0.2s ease, border-color 0.2s ease, opacity 0.2s ease;
}

.action-prompt.hidden { display: none; }

/* State accents — a border on the left side of the pill matching the action colour */
.action-prompt.is-attack   { border-left: 3px solid #ffb347; padding-left: 15px; }
.action-prompt.is-defend   { border-left: 3px solid #88ccff; padding-left: 15px; }
.action-prompt.is-pile-on  { border-left: 3px solid #c2a0ff; padding-left: 15px; }
.action-prompt.is-wait     { opacity: 0.8; }

body:not(.dark-mode) .action-prompt.is-attack  { border-left-color: #e07a1a; }
body:not(.dark-mode) .action-prompt.is-defend  { border-left-color: #1976d2; }
body:not(.dark-mode) .action-prompt.is-pile-on { border-left-color: #6a3fb5; }

/* Pulse when a non-human has priority — inherits the existing status-thinking animation */
.action-prompt.status-thinking { animation: pulse 1s ease-in-out infinite; }

@media (min-width: 500px) {
  .action-prompt { font-size: 1.1rem; padding: 10px 22px; top: 14px; }
}
@media (max-width: 380px) {
  .action-prompt { font-size: 0.82rem; padding: 6px 12px; top: 8px; max-width: calc(100% - 100px); }
}
```

### 4. Remove the old pile-banner styles

Find `#pile-banner` (around line 210–221). Since `#pile-banner` now shares the `.action-prompt` class, the old block-style pile-banner CSS is redundant. Replace it with a state override:

```css
#pile-banner {
  color: #ffb347;
  background: rgba(255, 179, 71, 0.18);
}
body:not(.dark-mode) #pile-banner {
  color: #e07a1a;
  background: rgba(224, 122, 26, 0.15);
}
```

The pile banner now inherits all the action-prompt positioning, padding, and box-shadow — only the colour/background differs.

### 5. Wire the state-modifier class in `ui.js`

Open `games/durak/ui.js`. Find `updateHeader()` (around line 293). Current code sets `#status-display.textContent` and a `status-thinking` class, plus handles `#trump-display` and `#deck-count`. Refactor as follows:

```js
function updateHeader() {
  var statusText = getStatusText();
  $statusDisplay.textContent = statusText;

  var thinking = state.phase === 'playing' || state.phase === 'pileOn';
  var priorityPlayer = state.players[state.prioritySeat];
  $statusDisplay.classList.toggle(
    'status-thinking',
    thinking && priorityPlayer && !priorityPlayer.isHuman
  );

  // NEW — action accent class
  var viewer = currentViewerSeat();
  $statusDisplay.classList.remove('is-attack', 'is-defend', 'is-pile-on', 'is-wait');
  if (state.phase === 'pileOn') {
    $statusDisplay.classList.add('is-pile-on');
  } else if (state.phase === 'playing' && state.prioritySeat === viewer) {
    if (viewer === state.defenderSeat) {
      $statusDisplay.classList.add('is-defend');
    } else {
      $statusDisplay.classList.add('is-attack');
    }
  } else if (state.phase === 'playing') {
    $statusDisplay.classList.add('is-wait');
  }

  // #trump-display is removed from the DOM. If the reference $trumpDisplay still
  // exists from module-load, guard against null.
  // Deck count is now in #table-center.
  if ($deckCount) {
    $deckCount.textContent = state.deck.length > 0 ? 'Deck: ' + state.deck.length : '';
  }
}
```

**Important:** find where `$trumpDisplay` is assigned in `ui.js` (near the top, in the DOM-ref caching block). Either:
- Remove the `$trumpDisplay = document.getElementById('trump-display')` line entirely, OR
- Keep it but check for null before using it: the current `updateHeader()` writes to it unconditionally; since we just deleted that element from the HTML, unconditional writes will throw a `Cannot set properties of null` error. **Delete the assignment and all references to `$trumpDisplay`.**

### 6. Make the pile banner and action prompt mutually exclusive

Both elements share `.action-prompt` positioning, so they'd overlap if both were visible. In `updatePileBanner()` (around line 318), also hide `#status-display` when the pile banner is visible:

```js
function updatePileBanner() {
  if (!$pileBanner) return;
  var pileActive = state.phase === 'pileOn';
  $pileBanner.classList.toggle('hidden', !pileActive);
  // Hide the normal status prompt while pile banner is up
  if ($statusDisplay) $statusDisplay.classList.toggle('hidden', pileActive);
}
```

### 7. Adjust `#field` top padding to clear the prompt

The action prompt sits at `top: 12px`. The field is a flex child of `#table-center` that's aligned center; field pairs could overlap the prompt. Add:

```css
#field {
  /* ...existing rules from Phases 1–2... */
  padding-top: 48px;              /* reserve clearance for the action prompt */
}
```

Adjust per breakpoint (≤ 380 px: 40 px, ≥ 500 px: 54 px, ≥ 768 px: 60 px).

### 8. Settings gear alignment

The settings gear is injected by `shared/settings.js` and is positioned `fixed top` (currently using `env(safe-area-inset-top) + 6px`). Since the header shrank from 44 px to 40 px, the gear should still clear it. Verify by reloading — no CSS change needed unless the gear overlaps the `DURAK` wordmark.

If the wordmark and gear overlap, move the wordmark slightly left or shrink the gear override's top margin.

---

## Verification

1. Run `npx serve .`. Open `http://localhost:3000/games/durak/` at 390 × 844 viewport.
2. **Confirm:** the header is now slim (40 px) with just `DURAK` on the left and the gear on the right. No status text, no trump emoji, no deck count in the header.
3. Start a 4-player vs Computer game.
4. **Confirm:** the "Your attack — play a card" prompt appears as a prominent pill at the top-center of the felt table, with an orange left-accent line.
5. Play an attack. When it's the CPU defender's turn, **confirm:** the prompt text changes to "CPU 1 defending…" and the accent disappears (is-wait), with a gentle pulse animation.
6. When it's your turn to defend, **confirm:** the prompt shows "Defend — play a higher card or Take" with a blue left-accent line.
7. Take a pile. **Confirm:** the pile-on phase replaces the prompt with the purple-accented "Defender is taking — pile on or tap Done" pill (pile banner).
8. Toggle light mode. **Confirm:** the prompt pill is legible against the lighter felt; accent colours use the light-mode variants.
9. Run `node --test tests/` — should pass.

---

## What NOT to change in this phase

- Don't change hand card sizes yet (Phase 5).
- Don't touch `wireHandScroll` or tap-vs-drag (Phase 6 if at all).

---

## Common pitfalls

- **`$trumpDisplay` null-ref error:** if you leave the old `$trumpDisplay = document.getElementById('trump-display')` in place but delete the element, the caching call returns `null` and any unconditional `$trumpDisplay.textContent = ...` or `$trumpDisplay.className = ...` will crash. Delete the element reference entirely.
- **Prompt pill overlaps the docked deck:** the docked deck is at `top: 10px, left: 10px` with a width ~50 px. The prompt pill has `max-width: calc(100% - 140px)` to leave a gap for the deck + trump flare. If the prompt still touches the deck, reduce `max-width` further or nudge `left: calc(50% + 20px); transform: translateX(-50%);` to push the pill slightly right.
- **Pile banner and status prompt both visible:** ensure `updatePileBanner()` hides `#status-display` when `pileOn`.
- **Prompt pill clipped by `#table-center { overflow: hidden }`:** the pill sits at `top: 12px` — well inside the table — so `overflow: hidden` shouldn't clip it. If somehow it does, reduce `top` or temporarily remove `overflow: hidden` to confirm.
- **Trump indicator lost:** deleting `#trump-display` removes the suit emoji from the header. The trump is now indicated by the actual trump card on the table. If the trump card is not immediately visible (e.g. for some reason the deck renders empty early), consider keeping a small trump-suit glyph in the prompt pill or in the deck count label. In practice, this is a rare edge case — the trump card is visible for the entire game until the last card is drawn.
