# SHS-056 — River Run is forked into `studio/games/river-run/` with only `studio_` saves

- **Status:** Done
- **Size:** M
- **Iteration:** 05
- **Role lead:** Front-end / Gameplay Dev
- **Depends on:** [SHS-055](SHS-055-checks-tell-studio-from-arcade.md) (so the push can pass the guard)
- **Branch:** none — trunk-based, commits to `main` (ADR-0007)

## Motivation

Epic E1 opens the Studio Wing with a forked game, and direction rule 5 forks a game the
first time the studio works on it. The executive chose River Run as the first (chat,
2026-09-22, answering Q11 with C). Source: direction E1, backlog #2.

## Acceptance criteria

- [x] `studio/games/river-run/index.html` is a copy of `games/river-run/index.html` at a
      named production commit. Its differences from that commit are only the ones listed
      below, and a test asserts it.
- [x] Every storage key the fork reads or writes starts with `studio_`:
      `studio_riverRun_highScore`, `studio_riverRun_muted`, `studio_riverRun_invertControls`,
      `studio_riverRun_lastPlayed`, and the Watch Mode keys under the prefix
      `studio_riverRun`. The fork no longer reads `theme`; it takes the theme from
      `body.dark-mode`, which `shared/settings.js` sets. `storage-keys` passes with no
      exemption, and every key is listed in `studio/README.md`.
- [x] Shared paths are re-pointed (`../../../shared/settings.js`, `data-gallery-depth="3"`).
- [x] In a headless browser, loading the fork, playing until game over, toggling mute and
      starting and stopping Watch Mode leaves every non-`studio_` key in `localStorage`
      exactly as it was.
- [x] The fork loads without uncaught errors in the studio's boot coverage.
- [x] The realm's shelf lists the fork with its status and a link.
- [x] `docs/studio/forking.md` records the procedure: what is copied, what is renamed, the
      provenance line (source path and commit), and the rule that the production game now
      takes bug fixes only.
- [x] The production game is byte-for-byte unchanged.

## Evidence plan

A new `tests/studio/river-run-fork.test.mjs`: the diff against the source commit contains
only the listed changes. A browser test through `lib/browser.mjs` for the storage and boot
criteria. `storage-keys`, `path-guard` and `production-unchanged` at the ticket stage.
Postdeploy with a marker from the fork's page.

## Out of scope

Any gameplay change; the ES module split (backlog); a fork script (the procedure is written
down, and a tool comes only if the second fork needs one); the 3D portal ([SHS-057](SHS-057-portal-opens-fork.md)).

---

## Result

- **What changed:**
  - `studio/games/river-run/index.html` — production's `games/river-run/index.html` at
    `082943a6a874c1a3d9200fbf17087c62261e14ac`, with a provenance comment naming both.
  - Saves: `studio_riverRun_highScore`, `_muted`, `_invertControls`, `_lastPlayed`, and
    Watch Mode registered under the prefix `studio_riverRun` so `shared/settings.js`
    writes `studio_riverRun_autoPlay`. The `theme` reads became
    `document.body.classList.contains('dark-mode')`. Production's computed-key write for
    Invert Drag (`setItem(opt.key, …)`) became a literal in the option's setter.
    `storage-keys` passes with no exemption.
  - Shared path `../../../shared/settings.js`, `data-gallery-depth="3"`.
  - **Beyond the ticket's list, and why:** four edits for the studio page contract that
    `studio-boot` holds every page under `studio/` to. The first boot of the faithful copy
    failed it in four places, all inherited from production: no back link, a 21px mute
    button, no `<noscript>`, and an uncaught `SecurityError` with site data blocked. The
    fork now has a `← Studio` back link, a 44px mute floor, a no-script message, and every
    storage call guarded (`readStored(() => localStorage.getItem('…'))` for reads,
    `try { setItem } catch` for writes, keys still literal). None of it touches gameplay.
    The equality test covers these edits like the others.
  - `tests/studio/lib/river-run-fork.mjs` — the closed edit list as data, with each edit's
    occurrence count. `studio/README.md` — a section and five key rows. `studio/shelf-data.js`
    — the fork on the shelf as `ITERATING`. `docs/studio/forking.md` — the procedure,
    linked from the handbook index.
- **Tested by:**
  - `tests/studio/river-run-fork.test.mjs`, 13 tests. The edit list applied to the source
    at the commit equals the fork byte for byte; a moved edit throws; a nudged constant
    breaks the equality; no storage violations; the keys used are exactly the five
    declared; every key has a README row; no production key, `Item('muted'` or
    `Item('theme'` remains; the settings path resolves; the shelf links to the fork.
  - The same file drives headless Chrome. It seeds production saves (light theme, a
    high score, `muted`, `riverRun_*`, a Maze Warden key), plays a run to a natural game
    over, toggles mute, starts Watch Mode from the start screen, stops, restarts and stops
    it from the drawer, and flips Invert Drag. Every non-`studio_` key is unchanged. All
    five studio keys are written. The light theme reached the fork through the body class.
    Passed four runs in a row.
  - Ticket stage: 5 of 5, and `studio-boot` boots three pages, the fork included. Push
    stage: 11 of 11, with `npm test`, smoke and e2e green. Postdeploy: 3 of 3, with the
    marker `registerWatchSection('studio_riverRun'` served from the live fork on attempt 3,
    and `production-unchanged` green.
  - Production byte-for-byte: `git diff 082943a HEAD -- games/river-run/` is empty.
- **Deferred:**
  - Backlog #22: River Run's music restarts a Tone.js sequence every run, and now and then
    Tone rejects a start time a hair below zero (uncaught `RangeError … got: -1e-12`). It
    was seen once in the browser test and not reproduced in six later runs of either page.
    The audio code is untouched by the fork, so the error is inherited. The browser test
    exempts that exact signature and nothing else. Fixing it removes the exemption.
  - Production River Run has the same four page-contract gaps, the 21px mute button among
    them. They are the arcade's to judge, and none is logged in the arcade's files, which
    are outside the path guard.
  - The ES module split stays backlog #5. The executive owns the arcade roadmap's River
    Run feature rows (p1-05, p1-48…p1-51, p2-10, p2-29, p2-40…p2-44, b-01); under
    direction rule 5 that work now belongs to the fork.
- **Fix rounds used:** 0 / 2 (one commit subject reworded before push for `commit-lint`'s
  80-character cap)
