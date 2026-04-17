# Durak UI Redesign — Implementation Guide

This directory contains the specification and phased implementation plan for a visual redesign of `games/durak/`. The goal is to transform the current "boxy widgets floating on black" layout into a single, unified **felt-green card table** that feels intentional in both dark and light modes, at 2–6 players, in both vs-Computer and hot-seat modes.

## Why this redesign

The current UI has several usability problems on mobile (iOS PWA in particular):

- A large empty grey rectangle dominates the middle of the screen when no cards are on the table.
- The deck and trump card float off to the left of the play area, disconnected.
- Opponent tiles read as UI chrome, not seated players.
- The header strip crams four different typographic styles side-by-side.
- Hand cards overlap aggressively (−24 px) at 50–60 px wide — hard to read.

The redesign addresses all of these while **preserving** the existing game mechanics, FLIP card animations, drag-to-scroll hand, tap-vs-drag disambiguation, and iOS PWA safe-area handling.

## How to use this directory

1. **Start with [DESIGN.md](DESIGN.md)** — the north-star visual spec. Every phase refers back to it.
2. **Work the phases in order** — `PHASE_1` through `PHASE_6`. Each phase leaves the game **playable** (no half-broken intermediate states), so you can ship or pause after any phase.
3. **One phase per agent session is recommended.** Each phase doc is self-contained: goal, files to touch (with absolute repo paths), step-by-step changes, and a verification section.
4. **Reload the game after each phase.** ES modules require HTTP, so run `npx serve .` from the repo root and open `http://localhost:3000/games/durak/`. Test on a phone-sized Chrome devtools viewport (iPhone 13 mini, 390 × 844) before declaring a phase done.

Either **Claude** or **Gemini** agents can pick up any phase. The docs are plain Markdown with no agent-specific syntax.

## Phase list

| # | Status | File | Goal |
|---|--------|------|------|
| 1 | ✅ | [PHASE_1_table_surface.md](PHASE_1_table_surface.md) | Add felt table surface + new theme tokens. The center stops looking like a grey box. |
| 2 | ✅ | [PHASE_2_dock_deck.md](PHASE_2_dock_deck.md) | Dock the deck + trump card into the top-left corner of the felt. |
| 3 | ⬜ | [PHASE_3_seat_tiles.md](PHASE_3_seat_tiles.md) | Turn opponent badges into seated-player tiles (one card back + count badge + name + role). |
| 4 | ⬜ | [PHASE_4_action_prompt.md](PHASE_4_action_prompt.md) | Slim the header. Add a large, clear action-prompt pill above the field. |
| 5 | ⬜ | [PHASE_5_bigger_cards.md](PHASE_5_bigger_cards.md) | Increase card sizes across breakpoints. Add the hand fan. Refactor the transform composition. |
| 6 | ⬜ | [PHASE_6_polish.md](PHASE_6_polish.md) | Reconcile FLIP with rotated cards. Stress-test 6-player. Audit light mode. Verify iOS safe-area. |

## Stack constraints (DO NOT violate)

From the repo [CLAUDE.md](../CLAUDE.md):

- **Vanilla JS only.** No React, Vue, or framework. No bundler, no build step.
- **No backend, no database.** Everything is static files on GitHub Pages.
- **ES modules** via `<script type="module">`. Local testing requires HTTP, not `file://`.
- **Dark/light theming** via `body.dark-mode` class + CSS custom properties. Both modes must stay polished.
- **Mobile-first.** `touch-action: none` on the body, pointer events, 44 px minimum tap targets, `height: 100dvh`, `viewport-fit=cover` with `env(safe-area-inset-*)` padding.
- **iOS PWA standalone mode** uses `html { background }` tracking the theme via `:has()`. Preserve this.

## What NOT to change

- `games/durak/gameplay.js`, `ai.js`, `state.js`, `constants.js` — pure game logic, untouched.
- `games/durak/cards.js` — card-face SVG art is good; the redesign is container-level, not card-art.
- Sound, start-screen copy, pass-device overlay copy, game-over overlay copy.
- The `shared/settings.js` infrastructure. Durak's settings-panel injection (`main.js` lines 240–343) stays as-is.

## Running tests after a phase

Logic tests should keep passing throughout (no logic changes):

```bash
node --test tests/
```

## Verification at the end of all phases

After PHASE_6 lands, do an end-to-end pass:

1. Serve locally (`npx serve .` from repo root).
2. Play a 4-player vs Computer game through at least one full bout, confirming felt table, docked deck, seat tiles, action prompt, fanned hand, smooth FLIP animations.
3. Toggle light mode. Confirm everything is legible and the table stays convincingly "green felt".
4. Start a 6-player hot-seat game. Confirm the opponent row fits without wrapping and the pass-device overlay still covers correctly.
5. If possible, test in iOS PWA standalone mode (Add to Home Screen). Confirm safe-area padding and `html` background tracking still work.
6. Run `node --test tests/` — should still pass.
