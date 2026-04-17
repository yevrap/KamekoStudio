# Phase 6 — Polish, Stress Tests, and Safe-Area Audit

**Goal:** Close out the redesign. Reconcile the FLIP animation with rotated hand cards, stress-test the 6-player hot-seat edge case, audit light mode, verify iOS PWA safe-area handling, and delete any dead CSS left behind by earlier phases.

**Prerequisite:** Phases 1–5 have all landed. The redesign is visually complete; this phase polishes the rough edges.

---

## Files touched

- `games/durak/ui.js` — FLIP threshold / composition adjustment (if not already done in Phase 5).
- `games/durak/style.css` — delete dead rules, verify safe-area insets, audit light-mode contrast.
- `games/durak/index.html` — verify meta tags are intact.

---

## Step-by-step changes

### 1. FLIP reconciliation with rotated cards

If Phase 5 used **Option B** (CSS-variable FLIP), this section is a no-op — the fan rotation composes with `--flip-dx` / `--flip-dy` naturally. Verify by dealing cards and watching for jitter. Done.

If Phase 5 used **Option A** (inline `transform` FLIP with fan composition baked in), verify on a long game session that:
- Cards dealt from deck → hand arrive in the correct fan position.
- Cards moved hand → field fly straight (no residual rotation).
- Cards moved field → defender's hand (on Take) animate smoothly.

**Known issue:** with Option A, `getBoundingClientRect()` reports the axis-aligned bbox of a rotated card, which can register a 1–2 px delta even when the card didn't move. Bump the FLIP threshold from `Math.abs(dx) > 1 || Math.abs(dy) > 1` to `Math.abs(dx) > 3 || Math.abs(dy) > 3`:

```js
if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
  // ...apply inverted transform, add .flip-animating...
}
```

The threshold bump prevents micro-jitter on cards that only changed rotation, not position.

If you observe lingering jitter under Option A, refactor to Option B. It's ~15 lines of code and solves the whole class of problems.

### 2. 6-player hot-seat stress pass

Start a 6-player hot-seat game at 390 × 844 viewport (iPhone 13 mini).

**Checklist:**
- [ ] 5 opponent seat tiles fit on a single row (no wrap).
- [ ] Each tile shows name, count badge, and role pill (even if abbreviated to DEF / ATK / THR).
- [ ] Pass-device overlay covers the whole screen and the next-player name is centered and readable.
- [ ] On the first attack/defense exchange, the action-prompt pill and docked deck do not collide with any seat tile.
- [ ] The hand renders 6 cards cleanly (initial hand at game start) with fan visible.

If any item fails:
- Wrapping seat tiles: tighten `.seat-tile` gap to 3 px at `@media (max-width: 420px)`; reduce seat card to 42 × 58 at the edge case; apply the abbreviated role-pill text from Phase 3 step 5.
- Prompt colliding with deck: reduce `.action-prompt max-width` to `calc(100% - 160px)`.

### 3. Light-mode audit

Toggle light mode via the settings gear and play one full bout:

- **Felt panel:** should read as a lighter sage-green "card table". Check that the `--felt` gradient has enough variation (center → edge) to not look flat.
- **Docked deck:** card backs visible against the lighter felt. The trump card's gold border + glow should still "pop".
- **Seat tiles:** card backs with the striped pattern should be legible. The `--surface` token used as seat-card background (`#ffffff` in light mode) may look too stark; if so, swap the seat-card background in Phase 3's CSS to a muted hue like `#e8e8f0` (already specified in Phase 3).
- **Action prompt pill:** `--prompt-bg: rgba(255, 255, 255, 0.9)` with `--prompt-text: #1a2a20` — text should be crisp.
- **Accent borders on prompt:** orange (#e07a1a), blue (#1976d2), purple (#6a3fb5) variants should all feel intentional on light felt.
- **Watermark:** 18% opacity may be too strong in light mode — if the watermark competes with field cards, drop to `rgba(255, 255, 255, 0.12)`.
- **Action buttons (Take / Pass / Done):** these already have light-mode overrides (around style.css line 324–326). Verify no regressions.
- **Count badge on seat tiles:** red with white text — should remain high-contrast in both modes.
- **Role pills:** light-mode overrides added in Phase 3 (`#e07a1a`, `#1976d2`, `#6a3fb5`) should have ≥ 4.5:1 contrast against `rgba(0,0,0,0.06)` background.

### 4. iOS PWA safe-area verification

If possible, install the game as a PWA ("Add to Home Screen" on iOS) and open it in standalone mode. Otherwise, simulate with Chrome devtools: in the Rendering panel, enable "Emulate CSS media feature display-mode: standalone" and emulate the iPhone 13 mini viewport (390 × 844) with device frame on.

**Checklist:**
- [ ] The notch / status-bar area is painted with the themed `html` background (emerald in dark, sage in light). Not white.
- [ ] The home-indicator strip is painted with the themed `html` background. Not white.
- [ ] The gear button sits below the notch (uses `env(safe-area-inset-top) + 6px`).
- [ ] The `.table-surface` panel does NOT extend edge-to-edge on a notched iPhone (it has `margin: 2px 8px` — the rounded corners render correctly within the safe area).
- [ ] The hand row sits above the home indicator (the `#app` has `padding-bottom: env(safe-area-inset-bottom)`).

If the notch or home indicator is white in PWA mode, check:
- `index.html` has the four PWA meta tags (Apple + generic web-app-capable, status-bar-style, theme-color). Phase 4 didn't touch these; Phase 1 didn't either — they should be intact from before.
- The `html` CSS rule paints the background:
  ```css
  html { background: #070b08; }
  html:has(body:not(.dark-mode)) { background: #8ba994; }
  ```
  These were already present pre-redesign. Confirm they're still in `style.css` (around line 53–58).

### 5. Settings gear alignment post-redesign

The gear is injected by `shared/settings.js`, positioned via the CSS override in `games/durak/style.css` (around line 113):

```css
#settings-gear-btn {
  position: fixed !important;
  top: calc(env(safe-area-inset-top) + 6px) !important;
  right: calc(env(safe-area-inset-right) + 8px) !important;
  width: 42px !important; height: 42px !important;
  border-radius: 10px !important;
}
```

Confirm the gear still aligns with the 40 px header (down from 44 px). The gear is 42 px tall with a 6 px top offset, placing its vertical center around the header's vertical center — close enough, no adjustment needed.

### 6. Dev mode / settings panel integration

Open the settings panel in-game. Confirm:
- Theme toggle (light/dark) still works and updates the felt in real time.
- Token count displays.
- Durak's custom sections (Current Match, AI Difficulty, End Round) still render at the top of the panel, above the Developer Mode section.
- Opening the panel pauses the game (phase → `paused`, status text shows "Paused"). The action-prompt pill updates accordingly.
- Closing the panel resumes play.

No code change needed — this behaviour lives in `main.js` lines 240–343, which we didn't touch.

### 7. Delete dead CSS

Search `games/durak/style.css` for selectors that no longer match any DOM element after Phases 1–5:

- `#header #status-display` / `#status-display` (targeting the old header child) — either delete or verify the new `.action-prompt` rules fully replace them.
- `#trump-display`, `#trump-display.suit-red`, `#trump-display.suit-black` — the element is deleted; delete the rules.
- `.opponent-tile`, `.opp-backs`, `.mini-back`, `.opp-count`, `.opp-role`, `.opp-role.role-*` — replaced by `.seat-tile` / `.seat-card` / `.seat-count` / `.seat-name` / `.seat-role`. Delete the old rules.
- `#field { border-radius: 8px }` — redundant after Phase 1 made the field transparent.
- `--field-bg`, `--opp-bg`, `--opp-border`, `--active-glow` custom properties — unused after Phase 1 / 3. Delete from both theme blocks.

Verify the test suite still passes after cleanup:

```bash
node --test tests/
```

### 8. Update project docs

Per the Kameko Studio convention (CLAUDE.md's "Update docs before commit" feedback), update the following files:

- [CLAUDE.md](../CLAUDE.md) — add a short note under `games/durak/` in the "Games" table that the UI was redesigned with a unified felt table + seated-opponent tiles + fanned hand. No changes to localStorage keys, no new settings — the redesign is purely visual.
- [GEMINI.md](../GEMINI.md) — mirror the same update (the two docs stay in sync).

### 9. Final end-to-end verification

Run through the following sequence at 390 × 844 viewport:

1. Reload `http://localhost:3000/games/durak/`. Confirm clean first paint — no flash of old layout.
2. Start a 4-player vs Computer game.
3. Confirm: felt table, docked deck top-left, 3 opponent seat tiles centered above, action prompt centered at top of table ("Your attack — play a card" with orange accent), fanned hand at bottom.
4. Play an attack. Watch FLIP animation from hand → field. No jitter.
5. Wait for CPU defender. Confirm prompt updates with pulse animation.
6. After one full bout, confirm: pile cleared, new bout starts, all animations smooth.
7. Trigger a pile-on (defender takes). Confirm: purple pile-on banner replaces the action prompt. Done button appears. Tap Done. Pile clears.
8. Play until game over. Confirm: game-over overlay displays correctly.
9. Return to menu, start a 6-player hot-seat game. Confirm: 5 opponent tiles fit, pass-device overlay works, no layout collapse.
10. Toggle light mode mid-game. Confirm: smooth transition, everything still legible, `html` background still tracks theme (no white notch).
11. Test drag-to-scroll hand on trackpad and on touch (if possible). Tap a card — should play, not scroll.
12. Run final `node --test tests/` — green.

---

## Verification checklist (summary)

- [ ] FLIP animations smooth — no jitter on fanned cards.
- [ ] 6-player hot-seat fits cleanly at 390 px width.
- [ ] Light mode as polished as dark mode.
- [ ] iOS PWA safe-area: notch + home indicator painted with theme background.
- [ ] Settings gear aligns with 40 px header.
- [ ] Dead CSS removed.
- [ ] CLAUDE.md + GEMINI.md updated with a redesign note.
- [ ] `node --test tests/` passes.
- [ ] End-to-end playthrough completes without regressions.

---

## What NOT to do in this phase

- Don't introduce new features.
- Don't change game logic.
- Don't add external dependencies.
- Don't restructure ES modules.
- Don't modify `shared/settings.js`.

---

## Known follow-ups (out of scope, don't do here)

- **Card art polish:** the procedural SVG card faces in `cards.js` are good but could use softer rank fonts / better court-card art. Consider as a separate initiative.
- **Sound effects:** no audio in Durak currently. Could add card-flip and play-success sounds later.
- **Animation polish:** deeper card-flip animation when a defender beats an attack. The current FLIP translate is fine but a 3D rotate could feel more satisfying.
- **Desktop layout pass:** at ≥ 1024 px, the game is capped at 700 px max-width and centered. That's intentional for now, but a desktop-specific layout (wider felt, larger cards, opponent seats around the edges) could be a future project.
