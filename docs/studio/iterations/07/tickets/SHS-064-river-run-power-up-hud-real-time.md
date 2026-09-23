# SHS-064 — River Run fork: the score and the power-up timer stay readable at phone width and count real seconds

- **Status:** Ready
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

- [ ] At 390×780 and 320×640, with a power-up active and a four-digit score, the score
      reads on one line, and the score, the power-up label, "← Studio" and Mute are each
      fully on screen with no two of their boxes overlapping.
- [ ] "← Studio" and Mute keep tap targets of at least 44×44 px.
- [ ] The spread shot lasts 6 ± 0.3 s of wall time at 60 fps and with the frame rate
      doubled (two `update` steps per animation frame, or a 120 Hz clock stub), and the
      label's countdown matches the time left to within 0.3 s.
- [ ] The first pickup's delay and the gap between pickups are in seconds too, and come
      out the same at 60 and 120 fps (within 0.3 s).
- [ ] With the settings drawer open, the spread timer and the pickup spawn clock don't
      move; they resume where they stopped when it closes.
- [ ] The existing power-up, restart, Watch Mode and storage-write subtests in
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

*Filled in as the ticket is worked. Empty until then.*

- **What changed:**
- **Tested by:**
- **Deferred:** (each item also filed as a ticket or a debt row)
- **Fix rounds used:** 0 / 2
