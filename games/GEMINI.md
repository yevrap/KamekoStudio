# games/ — Kameko Studio Games

Each game lives in its own subdirectory with an `index.html` as the entry point. Every game is a fully self-contained single HTML file with all CSS and JS inline — no external assets, no imports from sibling directories.

## Games

| Directory | Title | Renderer | Status |
|-----------|-------|----------|--------|
| `blob-zapper/` | Blob Zapper (internally: Lava Plasma Flow) | Canvas 2D | Stable |
| `hidden-object/` | Hidden Object Game | DOM | Stable |
| `materials-run/` | Grid Step Game — Pin Movement | DOM/CSS grid | Active development |
| `memory-tower/` | Tower Defense Rogue-like | Canvas 2D | Stable |
| `river-run/` | River Runner 3D | Three.js r128 | Stable |
| `waterfall/` | 3D Auto-Aim Endless Shooter | Three.js r128 | Stable |

## Conventions Shared Across Games

- **Pointer events** (`pointerdown`/`pointermove`/`pointerup`) rather than mouse or touch events
- **`touch-action: none`** on interactive elements to prevent scroll hijacking
- **`position: fixed`** for full-screen overlays (start, game over, win screens)
- **Light/dark theme** via `body.dark-mode` class + CSS custom properties, persisted in localStorage
- **No back-navigation** — games have internal menu screens; users use the browser back button to return to the arcade home
- **All scores** stored in localStorage; no server communication

## Adding a New Game

1. Create a new directory: `games/<game-name>/`
2. Create `games/<game-name>/index.html` as the single entry point
3. Add a card to `index.html` (root) and a portal link to `3d.html`
4. Keep all CSS and JS inline in the HTML file unless the game grows to need separate assets
