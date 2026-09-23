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
