# SHS-056 — River Run is forked into `studio/games/river-run/` with only `studio_` saves

- **Status:** Ready
- **Size:** M
- **Iteration:** 05
- **Role lead:** Front-end / Gameplay Dev
- **Depends on:** SHS-055 (so the push can pass the guard)
- **Branch:** none — trunk-based, commits to `main` (ADR-0007)

## Motivation

Epic E1 opens the Studio Wing with a forked game, and direction rule 5 forks a game the
first time the studio works on it. The executive chose River Run as the first (chat,
2026-09-22, answering Q11 with C). Source: direction E1, backlog #2.

## Acceptance criteria

- [ ] `studio/games/river-run/index.html` is a copy of `games/river-run/index.html` at a
      named production commit. Its differences from that commit are only the ones listed
      below, and a test asserts it.
- [ ] Every storage key the fork reads or writes starts with `studio_`:
      `studio_riverRun_highScore`, `studio_riverRun_muted`, `studio_riverRun_invertControls`,
      `studio_riverRun_lastPlayed`, and the Watch Mode keys under the prefix
      `studio_riverRun`. The fork no longer reads `theme`; it takes the theme from
      `body.dark-mode`, which `shared/settings.js` sets. `storage-keys` passes with no
      exemption, and every key is listed in `studio/README.md`.
- [ ] Shared paths are re-pointed (`../../../shared/settings.js`, `data-gallery-depth="3"`).
- [ ] In a headless browser, loading the fork, playing until game over, toggling mute and
      starting and stopping Watch Mode leaves every non-`studio_` key in `localStorage`
      exactly as it was.
- [ ] The fork loads without uncaught errors in the studio's boot coverage.
- [ ] The realm's shelf lists the fork with its status and a link.
- [ ] `docs/studio/forking.md` records the procedure: what is copied, what is renamed, the
      provenance line (source path and commit), and the rule that the production game now
      takes bug fixes only.
- [ ] The production game is byte-for-byte unchanged.

## Evidence plan

A new `tests/studio/river-run-fork.test.mjs`: the diff against the source commit contains
only the listed changes. A browser test through `lib/browser.mjs` for the storage and boot
criteria. `storage-keys`, `path-guard` and `production-unchanged` at the ticket stage.
Postdeploy with a marker from the fork's page.

## Out of scope

Any gameplay change; the ES module split (backlog); a fork script (the procedure is written
down, and a tool comes only if the second fork needs one); the 3D portal (SHS-057).

---

## Result

*Filled in as the ticket is worked. Empty until then.*

- **What changed:**
- **Tested by:**
- **Deferred:**
- **Fix rounds used:** 0 / 2
