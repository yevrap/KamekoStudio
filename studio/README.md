# `studio/` — the Shadow Studio realm

This folder is the deployed surface of Shadow Studio: an experimental realm inside Kameko
Studio, built and run by a simulated engineering team. It is served at
<https://yevrap.github.io/KamekoStudio/studio/>.

The team's process, roles, decisions and self-checks are documented in
[`../docs/studio/`](../docs/studio/). Start there if you want to know *how* this is made.
This file covers what is in this folder and the rules that apply to its code.

## Contents

| Path | What it is |
|---|---|
| `index.html` | The realm's landing page. Currently a placeholder — iteration 00 built the team, not a game. |
| `style.css` | The Backstage identity: tokens, layout, light/dark. Warm ground, one amber worklight for status, one teal reserved for interactive elements. |
| `main.js` | Placeholder behavior, and the first real exercise of the storage rule. |

Games will live in `studio/games/<name>/`, one directory each, following the same
convention as the production arcade: native ES modules split by concern
(`constants.js`, `state.js`, `gameplay.js`, `ui.js`, `main.js`).

## Rules for code in this folder

- **Same stack as production:** vanilla JS, native ES modules, no framework, no build step,
  no backend. Three.js from a CDN is acceptable for 3D.
- **Mobile-first.** Pointer events, 44px minimum tap targets, `100dvh` with a `100vh`
  fallback, safe-area insets.
- **The theme belongs to the arcade.** `shared/settings.js` owns the light/dark toggle via
  `body.dark-mode`; pages here follow that class rather than declaring their own toggle.
- **Every storage key written by code in this folder starts with `studio_`.** This folder
  shares an origin, and therefore a `localStorage`, with the production arcade, so the
  namespace is what keeps the two apart. Studio code never reads or writes an unprefixed
  key, never uses `localStorage.clear()`, and never builds a key the checker cannot read.
  The one exception is not studio code: pages here load the arcade's shared
  `settings.js` for the light/dark toggle, and that script owns `theme` and `devMode` and
  provides the "Clear All Game Data" control. That is production's code, inherited on
  purpose. See [ADR-0003](../docs/studio/decisions/ADR-0003-storage-namespace.md).
- **No binary assets.** Audio is synthesized with the Web Audio API; art is drawn.

## Storage keys

Documented before use, and checked by `npm run studio:check`.

| Key | Written by | Type | Notes |
|---|---|---|---|
| `studio_firstVisit` | `main.js` | timestamp (ms) | When this browser first opened the realm |
| `studio_visitCount` | `main.js` | integer string | How many times it has been opened |

Clearing all game data from the settings drawer does **not** clear these: the drawer's key
list lives in `shared/settings.js`, a production file the studio may not edit. The drawer
is reachable from this page, because this page loads that script — so clearing from here
clears the *arcade's* saves and leaves the studio's behind.

## Running it locally

`type="module"` needs HTTP, not `file://`:

```
npx serve .          # from the repository root
open http://localhost:3000/studio/
```
