# Iteration 07 — stand-up log

Done / next / blocked, per role that acted. One entry per session (ADR-0009), pushed when it
is committed.

## Session 1 — plan (2026-09-23)

- **Scrum Master** — *Done:* preflight green (tree clean, on `main` in sync, no `STOP`,
  baseline suites green in 111 s). E1 has one granted sprint left: this is sprint 3 of 3
  (+1 reserve, unclaimed). Three planned tickets plus the record; one is studio machinery
  ([SHS-065](tickets/SHS-065-studio-edits-its-own-workflow.md)). The production fix is ordered last so nothing pushes it before review.
  *Next:* build [SHS-064](tickets/SHS-064-river-run-power-up-hud-real-time.md). *Blocked:* nothing.
- **Product Owner** — *Done:* logged the four inbox lines (ADR-0011; local verification and
  Opus as the largest model; rule 8; the Playtester's verdict) and the Playtester's
  verdicts in the input ledger, and cleared the inbox. No open `studio` issues. Recorded
  the Playtester's Iterate on the power-ups and Keep on the fork's restart fix in 06's
  review; #35 + #38 became [SHS-064](tickets/SHS-064-river-run-power-up-hud-real-time.md), and the optional bigger pickup is new #42. No new
  questionnaire item. *Next:* nothing until review. *Blocked:* nothing.
- **Tech Lead** — *Done:* checked that the arcade's p0-17 is still open (so #33 is pulled)
  and that production still calls `musicSequence.stop()` at `games/river-run/index.html`
  L614. Merged #35 and #38 into one M, with the layout as the fallback if it grows.
  *Next:* build [SHS-064](tickets/SHS-064-river-run-power-up-hud-real-time.md). *Blocked:* nothing.

## Session 2 — build SHS-064 (2026-09-23)

- **Game Designer / Developer** — *Done:* [SHS-064](tickets/SHS-064-river-run-power-up-hud-real-time.md) whole, both halves (`fee743d`): the
  score and the power-up label stack below the top row and the score stays on one line at
  320 and 390; the spread shot, the first pickup and the pickup gap count wall-clock
  seconds and stop for the drawer. Tests red first (4 of 6 subtests), then the fork's file
  25/25; `--stage=ticket` 5/5; `--stage=push` 11/11 after one commit subject was shortened
  (commit-lint, 95 > 80 characters, fixed before the push). *Next:* build
  [SHS-065](tickets/SHS-065-studio-edits-its-own-workflow.md). *Blocked:* nothing.

## Session 3 — build SHS-065 (2026-09-23)

- **Tech Lead** — *Done:* [SHS-065](tickets/SHS-065-studio-edits-its-own-workflow.md) (`1209d09`): the path guard admits
  `.claude/skills/studio-*/**` and `.claude/workflows/studio-sprint.js` in ticketed studio
  commits and names the exception (ADR-0011 §6); unticketed `(studio)` commits are refused;
  arcade commits keep the arcade's rules; ADR-0011 is executive-only; hygiene scans the
  studio's skills. Tests red first (6 of 18 in `path-guard`, the new `rules` cases on missing
  exports), then green; `--stage=ticket` 5/5. *Next:* build
  [SHS-066](tickets/SHS-066-production-river-run-restart.md). *Blocked:* nothing.

## Session 4 — build SHS-066 (2026-09-23)

- **Tech Lead** — *Done:* [SHS-066](tickets/SHS-066-production-river-run-restart.md) (`1414dab`, production fix under
  ADR-0008): the arcade's River Run disposes the old music sequence without `stop()` and
  guards the music restart, as the fork does. Three new `scripts/e2e.mjs` cases, run five
  times each way: the always-throwing `Sequence.stop` and the Transport that won't start
  were red 5 of 5 before the fix, the twenty restarts red 2 of 5; all green 5 of 5 after
  (29/29 each run). `npm run smoke` green, `npm test` 840/840, `--stage=ticket` 5/5. Arcade
  p0-17 marked ✅ in the arcade commit `61e69c6`. Nothing pushed: the review step reviews
  `1414dab`, writes `reviews/SHS-066.md`, then pushes. *Next:* review. *Blocked:* nothing.

## Session 5 — review (2026-09-23)

- **Scrum Master** — *Done:* recorded the round run by the `studio-sprint` workflow: the
  Independent Reviewer (`opus`) and QA (`sonnet`) both approve with findings, the
  Playtester (`opus`) keeps [SHS-064](tickets/SHS-064-river-run-power-up-hud-real-time.md) and [SHS-066](tickets/SHS-066-production-river-run-restart.md). No rejection, so no second round.
  Wrote [reviews/SHS-066.md](reviews/SHS-066.md) (`1414dab`, approved) and pushed the
  production fix through `--stage=push`. *Next:* close. *Blocked:* nothing.
- **Tech Lead** — *Done:* fixed the S findings now: [SHS-066](tickets/SHS-066-production-river-run-restart.md)'s criteria ticked (IR-1 ·
  QA F1), the reviewer's role file matches ADR-0011 on models (IR-2), [SHS-064](tickets/SHS-064-river-run-power-up-hud-real-time.md)'s Result
  states the 10 fps limit (IR-4), dead `z-index` removed from the fork (`0d1f540`, IR-5).
  *Next:* nothing until close. *Blocked:* nothing.
- **Product Owner** — *Done:* backlog #43 (`version.json` for production fixes, IR-3) with
  Q13 in the questionnaire (⭐ yes, but it waits for a tick: it touches releases), and
  #44–#46 from the Playtester's notes and questions. The next new item is #47.
  *Next:* nothing until close. *Blocked:* nothing.
