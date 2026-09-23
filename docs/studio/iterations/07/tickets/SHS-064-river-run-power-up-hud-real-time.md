# SHS-064 — River Run fork: the score and the power-up timer stay readable at phone width and count real seconds

- **Status:** Done
- **Size:** M
- **Iteration:** 07
- **Role lead:** Game Designer
- **Depends on:** none
- **Branch:** none — trunk-based, commits to `main` (ADR-0007)

## Motivation

The Playtester's verdict on the power-ups ([SHS-060](../../06/tickets/SHS-060-river-run-power-ups.md))
is Iterate: while one is active the player can't read their score at 320–390 wide, because
"← Studio", Mute, the wrapping score and the power-up label overlap, and the label's seconds
are frames, so "6.0s" lasts 3 s on a 120 Hz phone. This is backlog #35 and #38 together,
the one pass the verdict asks for ([06 review](../../06/review.md), Keep / Iterate / Kill).

## Acceptance criteria

- [x] At 390×780 and 320×640, with a power-up active and a four-digit score, the score
      reads on one line, and the score, the power-up label, "← Studio" and Mute are each
      fully on screen with no two of their boxes overlapping.
- [x] "← Studio" and Mute keep tap targets of at least 44×44 px.
- [x] The spread shot lasts 6 ± 0.3 s of wall time at 60 fps and with the frame rate
      doubled (two `update` steps per animation frame, or a 120 Hz clock stub), and the
      label's countdown matches the time left to within 0.3 s.
- [x] The first pickup's delay and the gap between pickups are in seconds too, and come
      out the same at 60 and 120 fps (within 0.3 s).
- [x] With the settings drawer open, the spread timer and the pickup spawn clock don't
      move; they resume where they stopped when it closes.
- [x] The existing power-up, restart, Watch Mode and storage-write subtests in
      `tests/studio/river-run-fork.test.mjs` stay green.

## Evidence plan

`tests/studio/river-run-fork.test.mjs`: a layout subtest that reads the four elements'
bounding boxes at 390×780 and 320×640 with a power-up active and a large score, shown red
against today's layout first; a timing subtest that doubles the frame rate and times the
spread shot and the next spawn, shown red against the frame-counted timers (red count in
the Result); a drawer-pause case. Screenshots at 390 and 320 with a power-up active, for
the review. `npm run studio:check -- --stage=ticket`, then `--stage=push`.

## Out of scope

- A bigger or glowing far-off pickup (backlog #42) and Watch Mode steering for pickups.
- Moving the rest of the game (boat speed, obstacle spawning, scoring) off frames: only the
  power-up timers and their spawn clock change here. The rest stays frame-counted and is
  the module split's business (#5).
- Tuning the power-ups' strength or frequency; the executive's play decides a later pass.
- Production River Run.
- If one session can't hold both: the layout (#35) lands first, and real-time timers go
  back to the backlog as #38 (build step 4).

---

## Result

- **What changed:** `studio/games/river-run/index.html` only (`fee743d`). *Layout:* the
  score and the power-up label sit in a column of their own (`#hud-stack`, 42px into the
  game area, so it starts below the top row that ends at 64px on screen with the settings
  button), and the score has `white-space: nowrap`, so it no longer wraps onto two lines
  and nothing overlaps "← Studio", Mute or the settings button. At 390×780 the score's box
  is 74–316 × 70–99 and the label's 62–328 × 105–133; at 320×640, 39–281 × 70–99 and 27–293
  × 105–133, against "← Studio" 44 px tall ending at y 54. *Time:* the spread shot (6 s),
  the first pickup (5 s) and the gap between pickups (10 s) count wall-clock seconds from
  `performance.now()`, one step capped at 0.1 s; the clock stops (the next update counts
  nothing) on a new run, when the drawer opens and when the tab is hidden. The label shows
  the seconds left. The rest of the game still counts frames, as scoped.
- **Tested by:** `tests/studio/river-run-fork.test.mjs` section 5. (1) Layout at 390×780 and
  320×640 with a shield and a spread shot active and "Score: 1234": the score is one line,
  and the score, the label, "← Studio", Mute and the settings button (added to the four the
  criterion names, since the score now passes under it) are each whole on screen with no
  two boxes overlapping; "← Studio" and Mute are ≥ 44×44. (2) Timing, measured inside the
  page from the run's first update, at one and at two updates per animation frame: first
  pickup 5 ± 0.3 s, spread 6 ± 0.3 s, label within 0.3 s of the time left, next pickup
  10 ± 0.3 s. (3) Drawer: with the drawer open 1.5 s both clocks and the label are
  unchanged; in the second after closing each runs 0.7–1.3 s. **Red first** against the
  frame-counted code: 4 of 6 subtests — both layouts ("Score: 1234" wraps onto 2 lines),
  the doubled rate (first pickup 2.50 s, spread 2.98 s, label 3.03 s off, next pickup
  5.00 s), and the drawer case (it names the new clock variables, so that red is a weak
  one; on the old code the drawer already paused the frame counters). The 60 fps case was
  green on the old code, as it should be. The existing power-up, restart, Watch Mode and
  write-log subtests stay green; they now name `rapidFireLeft` and `powerUpSpawnClock`.
  Whole file 25/25. `--stage=ticket` 5/5; `--stage=push` in the stand-up log. Screenshots
  at 390 and 320 with both power-ups active were taken and checked by eye (score on one
  line, clear of the buttons); not committed, as the studio ships no binary assets.
- **Deferred:** nothing new. The rest of the game counting frames stays with the module
  split (#5); a bigger far-off pickup is #42.
- **Fix rounds used:** 0 / 2
