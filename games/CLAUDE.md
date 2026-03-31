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
| `waterfall/` | 3D Auto-Aim Endless Shooter | Three.js r128 | Stable (not in gallery) |

## Conventions Shared Across Games

- **Pointer events** (`pointerdown`/`pointermove`/`pointerup`) rather than mouse or touch events
- **`touch-action: none`** on interactive elements to prevent scroll hijacking
- **`position: fixed`** for full-screen overlays (start, game over, win screens)
- **Light/dark theme** via `body.dark-mode` class + CSS custom properties, persisted in localStorage
- **No back-navigation** — games have internal menu screens; users use the browser back button or Settings → Back to Gallery
- **All scores** stored in localStorage; no server communication

## Token Gate (required in every game)

Each game costs 1 token to start. Always call `KamekoTokens.spend()` before starting, and write `lastPlayed_*` immediately after a successful spend:

```js
startButton.addEventListener('click', () => {
    if (!window.KamekoTokens || !window.KamekoTokens.spend()) {
        if (window.KamekoTokens) window.KamekoTokens.toast();
        return;
    }
    localStorage.setItem('lastPlayed_myGame', Date.now());
    startGame();
});
```

The `lastPlayed_*` key feeds the "Recently Played" section on the arcade dashboard.

## Settings Panel Integration (required in every game)

Include `settings.js` before `</body>`:
```html
<script src="../../shared/settings.js" data-gallery-depth="2"></script>
```

Listen to `settingsOpened` / `settingsClosed` to pause and resume the game:
```js
window.addEventListener('settingsOpened', () => { /* pause */ });
window.addEventListener('settingsClosed', () => { /* resume */ });
```

**Per-game settings rows:** Inject custom toggle rows into `#settings-panel` lazily on first `settingsOpened` — the panel doesn't exist before `settings.js` runs. See `river-run/index.html` for a full example (auto-shoot, auto-avoid, invert drag, with pill toggle UI).

## Three.js Obstacle Arrays

In Three.js games, obstacle arrays store objects of shape `{ mesh, boundingBox }`. Always access position as `obs.mesh.position`, **never** `obs.position` — that is undefined and will throw at runtime.

## Adding a New Game

1. Create `games/<game-name>/index.html`
2. Add all CSS and JS inline in that file
3. Add a card to root `index.html` (sets `lastPlayed_*` key for the dashboard)
4. Add a portal link to root `3d.html`
5. Include `shared/settings.js` with `data-gallery-depth="2"`
6. Add token gate + `lastPlayed_<gameName>` write at session start
7. Add `settingsOpened` / `settingsClosed` pause/resume listeners
8. Add a `lastPlayed_<gameName>` entry to the localStorage keys table in `CLAUDE.md` (root)
