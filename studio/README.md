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
| `index.html` | The realm's home page: the chrome, the pulse line, the shelf and the handbook link. |
| `style.css` | The Backstage identity: tokens, layout, light/dark. Warm ground, one amber worklight for status, one teal reserved for interactive elements. |
| `shelf-data.js` | The only place a shelf entry, the pulse line or the retro line is declared. Adding a game is one entry here. |
| `shelf.js` | Pure functions from that data to markup. No DOM, so every rendered state is unit-tested without a browser. |
| `main.js` | The only file that touches the document, plus the visit logbook that exercises the storage rule. |
| `games/overtighten/` | *Overtighten* — the studio's first experiment. See below. |

### The status tags

| Tag | What it means |
|---|---|
| `PROTOTYPE` | A first build. It may be unfinished, and that is the point of the realm. |
| `ITERATING` | Being worked on across iterations. |
| `KILLED` | Stopped. It stays on the shelf, recessed and unplayable — visible as history, absent as an offer. |
| `PROMOTED` | Graduated into the production arcade. See [`promotion.md`](../docs/studio/promotion.md). |

Any other value is rendered as written, outlined in the worklight colour, rather than
dropped: a mistake in the data belongs on the page where it can be seen.

## The games

Games live in `studio/games/<name>/`, one directory each, following the same convention as
the production arcade: native ES modules split by concern (`constants.js`, `state.js`,
`gameplay.js`, `ui.js`, `main.js`).

### `games/overtighten/` — PROTOTYPE

A plate of bolts. Holding a bolt turns it and its torque climbs; every bolt it is coupled
to loosens while you hold. Each bolt has a tolerance band and all of them must end inside
their bands at once. Torque only goes onto a bolt directly and only comes off it by
turning a neighbour. Past the strip point a thread is ruined and the plate is lost.

It was built to test whether that coupling would make each plate an **ordering puzzle**. It
does not — see below — so what is here is a tactile convergence toy, and the experiment's
value is the answer rather than the game.

| File | What it is |
|---|---|
| `constants.js` | Tuning and the plates. Adding a plate is one entry; `x`/`y` are fractions of the field, so nothing here is in pixels. |
| `gameplay.js` | The torque rules. Pure, no DOM, no time — `main.js` converts held milliseconds into an amount and calls `turn`. |
| `state.js` | Progress and unlocking, pure. Every stored value is treated as something a person may have edited. |
| `ui.js` | Markup from model state. No DOM, so every rendered state is unit-tested. |
| `main.js` | The only file that touches the document: input, the turn loop, storage. |
| `sfx.js` | Synthesized audio. No context exists until a user gesture creates one. |

Every shipped plate is proved reachable from zero without stripping a thread. The tests
also record what the plates turned out to be, which is not what they were designed to be:
each one falls to a single hold per bolt in almost any order, and to blind round-robin
topping-up. The hypothesis that the coupling makes a plate an ordering puzzle is **false**
for this build, and the tests assert that rather than the intention. See
[`../docs/studio/iterations/02/review.md`](../docs/studio/iterations/02/review.md).

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
| `studio_overtighten_progress` | `games/overtighten/main.js` | integer string | How many plates have been cleared. Clamped to the number of plates that exist; anything unreadable counts as none |
| `studio_overtighten_muted` | `games/overtighten/main.js` | `'1'` or `'0'` | Whether the game's synthesized audio is muted |

Clearing all game data from the settings drawer does **not** clear these: the drawer's key
list lives in `shared/settings.js`, a production file the studio changes only as a reviewed
fix (ADR-0008 in the handbook), and this one has not been made. The drawer
is reachable from this page, because this page loads that script — so clearing from here
clears the *arcade's* saves and leaves the studio's behind.

## Running it locally

`type="module"` needs HTTP, not `file://`:

```
npx serve .          # from the repository root
open http://localhost:3000/studio/
```
