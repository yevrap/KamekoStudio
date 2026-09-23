# SHS-060 — River Run fork: a shield and rapid-fire / spread shot float on the river

- **Status:** Ready
- **Size:** M
- **Iteration:** 06
- **Role lead:** Game Designer
- **Depends on:** none
- **Branch:** none — trunk-based, commits to `main` (ADR-0007)

## Motivation

E1 needs a gameplay change in the fork that the executive can play and judge; its sprint
06 is the first experiment. Q12 was blank at plan, so its ⭐ picks power-ups, which is what
River Run's own modernization answers point at (Q1 "other: power-ups", Q2 = A; arcade rows
p2-40, p2-41; backlog #4).

## Acceptance criteria

- [ ] Power-ups float down the river in the fork, one at a time, and the boat picks one up
      by touching it.
- [ ] **Shield:** absorbs the next hit instead of ending the run, and shows on the boat
      while it lasts; the hit that uses it removes it.
- [ ] **Rapid-fire / spread shot:** for a few seconds, shooting fires faster or in a spread,
      and a timer on screen shows the time left; shooting returns to normal after.
- [ ] Both pickups' sounds respect the fork's mute (`studio_riverRun_muted`).
- [ ] The fork still reads and writes only `studio_` keys: the browser write-log test
      passes unchanged.
- [ ] The byte-for-byte equality test is retired with a note saying it stopped at SHS-060;
      `EDITS` and the source commit stay as the record of the copy, and the fork's README
      entry says the game now differs from production.
- [ ] Watch Mode still plays: the auto boat neither crashes on nor is confused by a
      power-up.

## Evidence plan

`tests/studio/river-run-fork.test.mjs`: a browser test per power-up that spawns it in the
boat's path and checks its effect (a hit survived with the shield; the shot rate or spread
changed, then back to normal after the timer); the write-log test; `npm run studio:check --
--stage=ticket`, then `--stage=push` and `--stage=postdeploy` with a marker only the new
build has. A phone-size screenshot of each effect for the review.

## Out of scope

- Other River Run experiments (streak, biomes, ghost run, impact feel).
- Tuning beyond "noticeable and fair" — the executive's verdict decides the next pass.
- Production River Run: it gets bug fixes only (direction rule 5).
- If one session can't hold both power-ups: the shield lands, and rapid-fire / spread shot
  goes back to the backlog as its own row (build step 4).

---

## Result

*Filled in as the ticket is worked. Empty until then.*

- **What changed:**
- **Tested by:**
- **Deferred:** (each item also filed as a ticket or a debt row)
- **Fix rounds used:** 0 / 2
