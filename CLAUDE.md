# Kameko Studio — Claude Context

## What This Project Is

Kameko Studio is a one-person web game studio. All games are mobile-first progressive web apps built with vanilla HTML, CSS, and JavaScript — no frameworks, no backend, no build step. Everything is static files deployed on GitHub Pages at https://yevrap.github.io/KamekoStudio/.

The studio is a solo creative project with serious engineering habits: version control, clean code, documented decisions. Pace is roughly one hour per day.

See `docs/mission.md` for the full studio philosophy.

## Stack Constraints

- **Vanilla JS only** — no React, Vue, or other frameworks unless complexity demands it
- **No backend, no database** — all data lives in the browser (localStorage, IndexedDB)
- **No build step** — source files are served directly; no bundlers or transpilers
- **Three.js (CDN)** is acceptable for 3D games; currently loaded from cdnjs r128
- **Tailwind (CDN)** is used on `index.html` only
- **GitHub Pages hosting** — everything must work as static files

## Project Structure

```
index.html          — Main arcade home (Tailwind CSS, card grid linking to all games)
3d.html             — 3D interactive landing page (Three.js), also links to all games
CLAUDE.md           — This file
README.md           — GitHub Pages URL
docs/               — Design docs and studio notes (see docs/CLAUDE.md)
  mission.md        — Studio philosophy and principles
  memory-game-design.md — Full design spec for the upcoming T9 memory game
drafts/             — WIP files not yet in production (see drafts/CLAUDE.md)
  arcadeHome.html   — Alternate arcade home, not yet linked
games/              — One subdirectory per game, each with index.html (see games/CLAUDE.md)
  blob-zapper/
  hidden-object/
  materials-run/    ← active development
  memory-tower/
  river-run/
  waterfall/
```

## Games

Each game is a single self-contained `index.html` with all CSS and JS inline.

| Directory | Title | Renderer | Notes |
|-----------|-------|----------|-------|
| `games/materials-run/` | Grid Step Game — Pin Movement | DOM/CSS grid | Tap to place movement pins; physics with material types (grass, water, ice, sand). Score attack and survival modes. Light/dark theme. **Active development.** |
| `games/hidden-object/` | Hidden Object Game | DOM | Emoji-finding challenge. Mobile-vertical layout. |
| `games/memory-tower/` | Tower Defense Rogue-like | Canvas 2D | Wave-based tower defense with upgrade system. |
| `games/river-run/` | River Runner 3D | Three.js | 3D obstacle-dodging river runner. |
| `games/waterfall/` | 3D Auto-Aim Endless Shooter | Three.js | 3D shooter, mobile-friendly. |
| `games/blob-zapper/` | Blob Zapper (internally: Lava Plasma Flow) | Canvas 2D | Push blobs with electricity. |

## Mobile-First Patterns

All games must work on phone, tablet, and desktop. Key patterns used across the codebase:

- **Pointer events** (`pointerdown`, `pointermove`, `pointerup`) not mouse/touch events — handles both input types uniformly
- **`touch-action: none`** on game canvases/grids to prevent scroll hijacking
- **CSS custom properties** with `@media` breakpoints for responsive sizing (e.g. `--cell-size` in materials-run)
- **`position: fixed`** for full-screen overlays (game over, start screen) so they stay anchored on mobile scroll
- **44px minimum tap targets** for buttons
- Light/dark theme via `body.dark-mode` class + CSS custom properties, saved to localStorage

## Upcoming Project: T9 Memory Game

The next game is a flashcard memory game where all input happens via a T9 phone keypad. Key design decisions:

- Input is T9 only: Scroll-Select mode (tap to cycle letters) and Predictive mode (scoped to deck values, not a general dictionary)
- Decks are user-created key-value pairs stored in IndexedDB
- Import/export via file (JSON/CSV), possibly a `.kameko` file extension
- Spaced repetition lite for surfacing weak pairs
- PWA with offline support and optional home-screen install
- Haptic feedback via Vibration API on mobile

Full design spec: `docs/memory-game-design.md`

## Development Notes

- Each game is self-contained in its own directory — editing one never affects others
- When adding a new game: create `games/<name>/index.html`, add a card to `index.html`, add a portal link to `3d.html`
- Inline `//` comments inside single-line JS functions comment out everything after them including closing braces — avoid this pattern; it causes silent syntax errors
- Game state in materials-run uses a `gameState` string: `'menu'`, `'playing'`, `'gameover'`, `'won'`
- All scores stored in localStorage; no server-side persistence anywhere
