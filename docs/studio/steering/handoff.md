# Shadow Studio — Handoff

*The latest iteration's report. Rewritten by each run; never edited by hand.*

## Iteration 06 — power-ups on the river, and ticket numbers you can click

**E1 · sprint 2 of 3 (+1 reserve, unclaimed).** On track; the epic now waits on your
verdict on the power-ups.

**Summary**

- **River Run's first experiment** ([SHS-060](../iterations/06/tickets/SHS-060-river-run-power-ups.md)). In the fork, one pickup at a time
  floats down the river.
  - A **shield** puts a bubble on the boat that takes the next rock or log.
  - A **spread shot** makes every shot three for about 6 s, with a countdown on screen.
  - Sounds respect mute, the drawer's pause pauses them, Watch Mode picks them up, and
    nothing new is saved.
- **A restart can no longer freeze the fork** ([SHS-061](../iterations/06/tickets/SHS-061-river-run-tone-start-time.md)). The music restart threw and
  aborted the new run before its game loop. The arcade's River Run has the same bug: the
  review reproduced it, and it is queued as arcade 🐞 p0-17 and studio #33.
- **Every studio ticket number in the docs is a link** ([SHS-059](../iterations/06/tickets/SHS-059-ticket-mentions-link-to-tickets.md)), your focus at plan.
  378 mentions in 48 files, and the retro re-runs the script.

**Review: one round.** QA (`opus`) and the Independent Reviewer (`fable`) each approved
with findings. 7 distinct findings: two fixed in the step (the spread shot's shot pool,
the link lib's header), four to the backlog (#33, #35, #36, #37; #36 also follows the
header fix), two declined with a reason.

**Checks**
- **Gate** against `studio-iteration-05`: red on its first run on `docs-current` alone (the
  record ticket was still open), green once the close records landed.
- **Post-deploy** after the tag, green.
- **Close-out 3/3** at this retro: iteration docs, doc cleanliness (148 documents),
  changelog.

**Live:** https://yevrap.github.io/KamekoStudio/studio/games/river-run/ (or the River Run
portal on https://yevrap.github.io/KamekoStudio/3d.html) · **Tag:** `studio-iteration-06`

**Where the docs are**

- **Iteration record:** `docs/studio/iterations/06/`. It has the plan, the log (a
  stand-up per session), the review, the retro, and 4 tickets ([SHS-059](../iterations/06/tickets/SHS-059-ticket-mentions-link-to-tickets.md) to [SHS-062](../iterations/06/tickets/SHS-062-iteration-record.md)).
- **Handbook:** `process.md` (ticket numbers are links), `templates/ticket.md` (a
  regression test's red count, layout at 320), `learning-log.md` (Active rules revised),
  `forking.md`, `CHANGELOG.md`.
- **Skill:** `studio-iteration`'s close step now writes the records before the gate.
- **Arcade docs:** `docs/roadmap.md` (p0-17), two Black Hole in One docs (links).

**Trend.**

| | 03 | 04 | 05 | 06 |
|---|---|---|---|---|
| Tickets (done/committed) | 7/3 | 5/3 | 4/3 | **4/3** |
| Review-opened tickets | 0 | 1 | 0 | **0** |
| Review passes | 4 | 4 | 2 | **2** |
| Fix rounds | 6 | 7 | 0 | **1** |
| Debt (+/−) | +2/−0 | +2/−3 | +1/−0 | **+0/−1** |

[Shadow Studio — Scorecard](scorecard.md) has row 06.

**Changes from the retro**
- The skill's close step writes the records before running the gate, as `process.md`
  already did. The gate had gone red at close two sprints running.
- A regression test shows red on every run against the unfixed code, with the count. Its
  own restart test caught the bug only four runs in six.
- Layout evidence is taken at 320 wide as well as 390.
- Active rules: one converted, one split, one new (*a game's clock is not the player's
  clock*).

**Did the last retro's changes help?** Yes where exercised. The record ticket's criteria
held; the gate's red had a new cause (the skill's order). #21 didn't get sprint 06's
process slot, because your focus took it. There was still no production fix, so the
production-fix review is untested; #33 will test it.

**Needs you**

1. **Keep / Iterate / Kill on the power-ups**, at the end of
   `docs/studio/iterations/06/review.md`. The team says Iterate: the HUD sits over the
   score on narrow phones (#35), and the timers count frames (#38). E1 can't finish
   without your verdict, and sprint 07 is its last granted sprint.

**Say next:** `studio next`, in a new session. [Shadow Studio — Next step](next.md) says
which step is due; [Shadow Studio — Backlog](backlog.md) holds the order of work.
