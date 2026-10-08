# In-Game Rule Checks: Plan

*Planned 2026-10-08. Rows: p1-58 → p1-59 → p1-60 → p1-61 (P1), then p2-51, p2-52, p2-53 (P2). Decisions: [In-Game Rule Checks questionnaire](../questionnaires/in-game-checks.md).*

**Related:** [Roadmap](../roadmap.md) · [Durak](../games/durak/README.md) · [Durak AI Studio prompt](../games/durak/plans/ai-studio-v1-prompt.md) (where the `?test` pattern came from)

## The ask

Yev, 2026-10-08, on the AI Studio prompts that have Gemini build a hidden `?test` page into each app: "i like this pattern that testing is part of the game. add this to the backlog for later ship workflows." Later the same day: "i want to add tests that are visible and runnable from the ui. there should be a priority item for it. make a plan for this feature. it should help in development, regression testing, and look nice and be accessible from the ui to the user. the tests should be relevent and runnable as if part of the game."

The second message changes the first version of p1-58, which had the page "linked from nowhere in the UI". The checks now get a door in the game: a **🧪 Checks** button in the ☰ drawer, next to Rules and Log. Earlier, in the [hand-zone prompt](../games/durak/plans/ai-studio-hand-zone-prompt.md), Yev took a Tests button *off the game screen*, so the drawer is the door and the table stays clean.

## What the player sees

Open ☰ → **🧪 Checks** in Durak. A panel slides up in the game's own look: felt green, Durak's real card faces, the game's language (EN/RU). It runs straight away.

```
┌──────────────────────────────────────┐
│ 🧪 Rule Checks                    ✕  │
│ All 52 rules hold · 1.8 s            │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 52/52     │
│                                      │
│ Beating                        8 ✓   │
│  ✓ Any trump beats any plain card    │
│      [6♠] beaten by [6♥]  trump ♥    │
│  ✓ A higher card of the same suit…   │
│ Throwing in                    9 ✓   │
│  ✓ Only the defender's neighbours    │
│    may pile on       guards p1-56    │
│ Who goes first                 4 ✓   │
│ Simulated games                5 ✓   │
│  ✓ 500 games at 2–6 seats, none      │
│    stuck · longest 212 moves         │
│                                      │
│ [ Run again ]        [ Deep run ×10 ]│
└──────────────────────────────────────┘
```

- **Phrased as table rules.** Each check is a sentence a player would agree with ("Only the defender's neighbours may pile on"), not a function name. Where a card example helps, the row shows mini cards drawn by the game's own card code.
- **Grouped the way the rules are taught:** Beating, Attacking, Throwing in, Taking, Transfer, Drawing, Who goes first, Endings, The log, Simulated games.
- **Regression chips.** A check written for a bug shows the bug's ID (`guards p1-53`), linking the bug history to the rule that now holds.
- **A failing row opens by itself.** It shows what should have happened, what did, and the seed. **Copy repro** copies a deep link (`?test=<check-id>&seed=<n>`) and the matching `node --test --test-name-pattern "…"` command. **▶ Watch** comes with p1-60.
- **Simulated games** show live counters while they run (games dealt, moves, stuck = 0, longest game). The quick run fits in a few seconds on a phone. **Deep run** runs ten times as many seeds.
- **Accessible:** dialog semantics with a focus trap and Esc to close, a live region that announces the summary, ✓/✗ always with a word (never colour alone), 44 px targets, `prefers-reduced-motion` respected, light and dark themes.

`?test` on the URL opens the same panel and runs it, for agents, e2e and the deploy check. `?test=<check-id>` runs one check, and `&seed=<n>` pins its seed.

## What makes a check relevant

A check earns a place in the panel only if it is one of these:

1. **A rule a player could state.** Who beats what, who may throw in, draw order, who leads.
2. **A promise the game makes.** Never stuck, no card vanishes or duplicates, the game ends, the log shows every move, a test run leaves your saves alone.
3. **A bug that shipped once.** p1-53 (stuck with no legal card), p1-56 (pile-on neighbours), p1-57 (lowest trump leads), p2-50 (a pass missing from the log).

Implementation details stay in the Node suite and out of the panel: layout maths, AI pacing milliseconds, i18n key coverage. Nobody at the table cares whether `aiThinkMs` returns 400.

## How it works

One list of checks, three runners, so a check can't drift between them.

| Piece | Where | What it does |
|---|---|---|
| Check list | `games/<slug>/checks.js` | ES module, no DOM. Exports `checks`: `{ id, group, title, guards?, run(ctx) }`. Titles are i18n keys in the game's string table. Exports `invariants(state)`, the per-move promises the simulation and the live guard share. |
| Harness | `shared/checks/harness.js` | `ctx.equal / ok / fail` (no `node:assert` in the browser), `ctx.seed(n)`, which swaps `Math.random` for a seeded PRNG during the check and restores it after, `ctx.cards(...)` for the mini-card detail, `ctx.progress(...)` for live counters. Runs in Node, in a worker and on the main thread. |
| Browser runner | `shared/checks/worker.js` + `shared/checks/panel.js` / `panel.css` | The panel starts a **module Web Worker**, which imports the game's `checks.js` in its own realm and streams results back. The live match's `state` singleton is never touched: the worker has its own copy of every module. The worker has no `localStorage`, so the harness installs an in-memory stub. Durak's game-over writes to the stub, never to `durak_wins/losses/draws`. The page stays smooth while hundreds of games simulate. |
| Node runner | `tests/checks.test.mjs` | Finds every `games/*/checks.js` and registers each check as a `node:test`, so `npm test` and CI run exactly what the panel runs. A new game's checks are picked up with no wiring. |
| e2e | `scripts/e2e.mjs` | Loads `games/durak/?test` at phone size, waits for the summary, fails on any ✗, and asserts `localStorage` is byte-for-byte the same before and after. |

**Seeds without touching game code.** Durak's randomness is `Math.random` (the deck shuffle in `constants.js` and the AI's choices in `ai.js`). The harness swaps it during a check. In the worker that can't reach the live game; in Node it is restored in a `finally`. The games need no RNG plumbing.

**Why Durak first.** Its rules modules (`constants`, `state`, `gameplay`, `ai`, `log`, `cards`, `i18n`) import nothing from the screen, so they load in a worker as they are. Of the other games, Tysiacha's `gameplay.js` imports `ui.js` and `sfx.js`, so its full-game simulation needs the rules separated from the screen first (p2-51). Maze Warden's `computeDistField` / `wouldSeal` live beside canvas code in `gameplay.js` (p2-52).

## Slices, in ship order

| Row | Slice | Size | Stands alone because |
|---|---|---|---|
| **p1-58** | Shared harness + Durak 🧪 Checks panel (drawer + `?test`), the rule checks moved over from `tests/durak.test.mjs`, the seeded simulation sweep, the Node runner, the e2e | M | You can open it in the game and read every Durak rule passing. `npm test` runs the same list. |
| **p1-59** | Checks become part of `ship` and `new-game`: a rules change adds or updates checks, and the deploy check loads the live `?test` | S | Every later ship keeps the panel honest. |
| **p1-60** | **▶ Watch a check on the real table.** A scenario check, or a failing simulated game from its seed, plays out on Durak's table move by move, narrated by the line above the hand, then shows a ✓/✗ banner and returns you to your game. Saves are suppressed while it plays. | M | The test runs *as part of the game*: the same table, cards and animations as a real match. |
| **p1-61** | **Live rule guard.** `invariants(state)` runs after every move of a real match. A broken promise shows a 🐞 banner with **Copy bug report** (the state, the log and the version), feeding the `fix` lane. | S | A playtest catches what the sweep missed, with the evidence attached. |
| **p2-51** | Tysiacha checks: rules split from the screen enough to simulate, then bidding, marriages, tricks and the race to 1000 | M | The second card game, and it proves the harness isn't Durak-shaped. |
| **p2-52** | Maze Warden checks: the path is never sealed, waves escalate, meta upgrades apply, simulated waves end | S | The first non-card game in the panel. |
| **p2-53** | **Check Room.** One page that runs every game's checks, a card per game, opened from the gallery's ☰ drawer | S | Arcade-wide regression at a glance, once at least three games have checks. |

The rows in `roadmap.md` carry each slice's *Done when*.

## Decided here (agent defaults, not asked)

- **The door is the ☰ drawer,** in Durak's quick-actions row beside Rules and Log, not on the game screen (Yev took a Tests button off the screen once already). It's there for everyone, not hidden behind Developer Mode: Yev asked for it to be accessible from the UI.
- **Nothing is saved.** No "last run" key in the pilot, so a check run can't change anything a player keeps.
- **Localised.** Durak is bilingual, so check titles live in `i18n.js` and follow the game's language. The existing i18n test then covers them.
- **The Node suite stays.** `tests/durak.test.mjs` keeps the implementation-detail tests (layout, pacing, i18n). A rule test moves to `checks.js` only once the Node runner runs it, and the total number of Durak tests run by `npm test` doesn't go down.
- **The quick run's budget** is a few seconds on a phone. The ship agent measures it and picks the seed count, and Deep run takes the rest.

## Waiting on Yev

[In-Game Rule Checks questionnaire](../questionnaires/in-game-checks.md): what ▶ Watch does to a match in progress (p1-60), who sees the live guard (p1-61), whether jam prototypes get a minimal check list (p1-59), and whether there's a Check Room (p2-53). p1-58 needs none of them.

## Not in scope

- Pixel or screenshot assertions. The panel checks rules; `scripts/e2e.mjs` (p1-36) checks that the UI flows work. They complement each other.
- Checks for Lab or studio games before they're touched for another reason.
- A test-authoring UI. Checks are written in code by the agent that changes the rules.
