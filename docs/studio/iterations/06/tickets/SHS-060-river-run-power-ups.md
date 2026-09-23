# SHS-060 — River Run fork: a shield and rapid-fire / spread shot float on the river

- **Status:** Done
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

- [x] Power-ups float down the river in the fork, one at a time, and the boat picks one up
      by touching it.
- [x] **Shield:** absorbs the next hit instead of ending the run, and shows on the boat
      while it lasts; the hit that uses it removes it.
- [x] **Rapid-fire / spread shot:** for a few seconds, shooting fires faster or in a spread,
      and a timer on screen shows the time left; shooting returns to normal after.
- [x] Both pickups' sounds respect the fork's mute (`studio_riverRun_muted`).
- [x] The fork still reads and writes only `studio_` keys: the browser write-log test
      passes unchanged.
- [x] The byte-for-byte equality test is retired with a note saying it stopped at SHS-060;
      `EDITS` and the source commit stay as the record of the copy, and the fork's README
      entry says the game now differs from production.
- [x] Watch Mode still plays: the auto boat neither crashes on nor is confused by a
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

- **What changed:** `studio/games/river-run/index.html` (commit `bb9d7c4`). One pickup at a
  time floats down the river: the first about 5 s (300 frames) into a run, the next about
  10 s after one leaves the river. The boat takes it by touching it (`boatBox` against the
  pickup's box). **Shield**, a cyan octahedron: a wireframe bubble follows the boat. It is
  kept out of the boat's children, because `setFromObject` would have widened the hit box.
  The next rock or log bursts on it and the bubble goes. **Spread shot**, a pink
  icosahedron: for 360 frames (~6 s) every shot is three, one straight and one 12° to each
  side. Watch Mode's shot cooldown drops from 20 to 8 frames. A HUD under the score reads
  `🛡 SHIELD` and `✦ SPREAD 4.7s`, counting down. Pickup and shield-break sounds come from
  a second Tone synth, scheduled from `Tone.now()`. `playSfx` returns early while muted.
  Power-ups are frame-counted like the rest of the game, so the drawer's pause pauses them.
  A new run and game over both clear them. Nothing new is saved: `FORK_KEYS` is unchanged.
  **Equality retired:** the byte-for-byte test and its "unlisted change" companion are
  gone. A note at the top of `river-run-fork.test.mjs` says why and when. A new test checks
  that the recorded edits still apply to the source at `082943a`. The fork's provenance
  comment, `studio/README.md` (the fork section now says it differs on purpose and
  describes both power-ups), `forking.md`, the lib's header and TD-014 say the same.
  TD-014's exemption stays for one more ticket, and its reason now rests on the music lines
  being unchanged, read from the diff. [SHS-061](SHS-061-river-run-tone-start-time.md) removes it.
- **Tested by:** four browser subtests in `river-run-fork.test.mjs` on a 390×780 phone
  viewport. (1) Shield: a pickup placed in the boat's path is taken, the bubble shows and
  the HUD reads SHIELD; a rock moved onto the boat bursts, the run goes on, the bubble and
  HUD go; a second rock ends the run. (2) Spread: one shot straight, then three after the
  pickup (directions left, straight, right); the HUD timer reads `✦ SPREAD n.ns` and falls
  over 400 ms; after it runs out the HUD hides and a shot is one again. (3) Mute: fresh
  store (muted), two pickups make 0 notes; unmute (saved as `studio_riverRun_muted=false`),
  one pickup makes 2. (4) Watch Mode: a pickup 8 units ahead is taken without the auto boat
  swerving or shooting at it, and with rocks turned back on the run is still going 3 s
  later. **Red first:** three mutations each turned their subtest red: a shield that doesn't
  save, a spread that never fans, and sounds that ignore mute. Four repeat runs of the
  power-up tests were green. The write-log test is unchanged and green. `--stage=ticket` 5/5,
  `--stage=push` 11/11 (`npm test`, smoke, e2e green), `--stage=postdeploy` 3/3
  (`POWERUP_SPAWN_INTERVAL` served at `/studio/games/river-run/`, absent from
  `studio-iteration-05`). Phone screenshots of the floating pickup and of shield + spread
  active were taken and checked by eye. They aren't committed, because the studio ships no
  binary assets. The review can regenerate them with the same test helpers.
- **Deferred:** the fork's top controls (← Studio, Mute) cover the score readout on a
  390px phone. It's visible in both screenshots and dates from [SHS-056](../../05/tickets/SHS-056-river-run-fork.md), not from this ticket:
  backlog #35. The review found that the power-up HUD also covers the score at 320 and
  375 wide, so #35 now covers that too.
- **Review fix** (iteration 06 review, QA F1; `8a7a604`): fast taps with the spread shot
  ran the 30-shot pool dry. The pool is 90, and a shot past the river bank goes back to
  it. The spread subtest fires a 25-volley burst (red at 30, green at 90) and follows a
  side shot off the river.
- **Fix rounds used:** 1 / 2
