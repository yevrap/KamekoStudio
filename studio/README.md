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
| `games/river-run/` | *River Runner 3D* — the studio's fork of the arcade's River Run. See below. |
| `games/samovar/` | *Samovar* — the studio's first original game: pour tea by the ratio. See below. |

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

### `games/river-run/` — ITERATING

The studio's own copy of the arcade's River Runner 3D, forked in iteration 05 ([SHS-056](../docs/studio/iterations/05/tickets/SHS-056-river-run-fork.md)) so
that River Run's experiments happen here rather than in production. It started as a faithful
copy: production's `games/river-run/index.html` at commit `082943a`, with its saves renamed
into the `studio_` namespace and the four edits every studio page needs (a back link, a 44px
mute button, a no-script message, and surviving blocked site data). Those edits are
recorded in `tests/studio/lib/river-run-fork.mjs`, and until the first experiment a test
proved the fork equal to them byte for byte.

**It now differs from production on purpose.** The first experiment, power-ups
([SHS-060](../docs/studio/iterations/06/tickets/SHS-060-river-run-power-ups.md), iteration 06), retired the equality test. One pickup at a time floats
down the river (the first about 5 s into a run, then about 10 s after each one leaves the
river), and the boat takes it by touching it:

- **Shield** (cyan octahedron): a wireframe bubble around the boat. The next rock or log
  bursts on it instead of ending the run, and the bubble goes.
- **Spread shot** (pink icosahedron): for about 6 s every shot is three, one straight and
  one 12° to each side, and Watch Mode fires faster. The HUD under the score counts down.

Far up the river a pickup wears a glow of its colour about 26 px across on screen, so it can
be spotted in time to steer for; the glow fades as the pickup comes near, and the pickup box
is the pickup alone, so taking one needs the same contact as before. The label under the
score keeps one height whichever power-ups it shows
([SHS-069](../docs/studio/iterations/08/tickets/SHS-069-river-run-power-ups-read-at-a-glance.md), iteration 08).

Pickup sounds are silent while the fork is muted. The power-ups save nothing.

It is one inline-script file, as production's is; the ES module split is fork debt on the
backlog. From the fork onward, production River Run takes bug fixes only. See
[`../docs/studio/forking.md`](../docs/studio/forking.md).

### `games/samovar/` — PROTOTYPE

The studio's first original game, built in iteration 08 ([SHS-068](../docs/studio/iterations/08/tickets/SHS-068-samovar-core.md)) as its core
mechanic alone. An evening is ten guests, one at a time; each brings a small cup, a teacup
or a tall glass and wants their tea at a strength shown as a colour swatch. One button:
hold to pour the dark brew, let go; hold again to top up with hot water, let go to serve.
Strength is the brew's share of the cup, so the decision is how long to pour the brew for
*this* cup before the water fixes it. Over the brim is a spill (0 stars); otherwise 0–3
stars from the strength, minus one if the cup is short of the dashed fill line.

| File | What it is |
|---|---|
| `constants.js` | Cups, strengths, the colour ramp, the pour rate and the star bands. |
| `gameplay.js` | The rules of a cup, pure: pour amounts from milliseconds, colour by ratio, judging. |
| `state.js` | An evening's guests (seeded generator) and reading the saved best, pure. |
| `main.js` | The only file that touches the document: the hold, the loop, the cards, storage. |

Pours are timed from `performance.now()` at press and release, so a 120 Hz screen pours at
the same rate as a 60 Hz one. The page stops a pour and holds the result timer while it
is hidden or the settings drawer is open. The design note is
[`docs/studio/games/samovar.md`](../docs/studio/games/samovar.md).

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
| `studio_samovar_best` | `games/samovar/main.js` | integer string (0–30) | The best evening's stars. Anything unreadable counts as none |
| `studio_riverRun_highScore` | `games/river-run/index.html` | integer string | Best run score in the fork. Production's is `riverRunHighScore`, never read |
| `studio_riverRun_muted` | `games/river-run/index.html` | `'true'` or `'false'` | Music muted; unset means muted. Production's is the unnamespaced `muted`, never read |
| `studio_riverRun_invertControls` | `games/river-run/index.html` | `'true'` or `'false'` | The drawer's Invert Drag toggle |
| `studio_riverRun_lastPlayed` | `games/river-run/index.html` | timestamp (ms) | Set when a run or Watch Mode starts |
| `studio_riverRun_autoPlay` | `games/river-run/index.html`, and `shared/settings.js` from the prefix the fork registers | `'true'` or `'false'` | Watch Mode on/off. The drawer writes it because the fork registers its Watch section under the prefix `studio_riverRun` |

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
