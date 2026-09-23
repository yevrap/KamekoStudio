# SHS-066 — Production River Run: Restart Game never freezes the river

- **Status:** Ready
- **Size:** S
- **Iteration:** 07
- **Role lead:** Tech Lead
- **Depends on:** none (built last: its commits stay local until review, ADR-0008)
- **Branch:** none — trunk-based, commits to `main` (ADR-0007)

## Motivation

In the arcade's River Run, `musicSequence.stop()` (`games/river-run/index.html` ~L614)
can throw against a stopped Tone Transport, which aborts `initGame` before the game loop;
the sequence is never disposed, so every later restart freezes too, until reload (06
review, IR 1: first at restart 13, then 28 of 39). The fork's fix is proven
([SHS-061](../../06/tickets/SHS-061-river-run-tone-start-time.md), the Playtester's Keep);
this is backlog #33 and the arcade's 🐞 p0-17, still open.

**A fix, not a feature (ADR-0008):** it restores restarts that the page already offers,
and changes nothing a player chooses or sees on a working restart.
**Production files:** `games/river-run/index.html` (the fix), `scripts/e2e.mjs` (the
regression test), plus the arcade roadmap row p0-17 marked done in an arcade `docs:`
commit.

## Acceptance criteria

- [ ] `games/river-run/index.html` restarts its music without `Sequence.stop()` (it
      disposes the old sequence, as the fork does), and a failure in the music restart
      can't stop the run from starting.
- [ ] A browser test in `scripts/e2e.mjs` restarts the game 20 times and sees every
      restart's game loop and music running, with no uncaught error or rejection.
- [ ] A deterministic case: with `Tone.Sequence.prototype.stop` made to throw whenever the
      Transport is stopped, every restart still runs. Shown red against the unfixed file
      in 5 runs of 5.
- [ ] `PRODUCTION_FIXES` in `tests/studio/lib/rules.mjs` has an entry for each production
      file, naming this ticket.
- [ ] The commits stay local until `iterations/07/reviews/SHS-066.md` records the
      reviewed hash and verdict; `production-fix-reviewed` passes at the push.
- [ ] Arcade 🐞 p0-17 is marked ✅ with the date and this ticket, and backlog #33 is done.

## Evidence plan

`npm run e2e` (the new River Run restart cases), run against the unfixed file first with
the red count in the Result; `npm run smoke`; `npm run studio:check -- --stage=ticket`.
The review step writes `reviews/SHS-066.md` and pushes through `--stage=push`.

## Out of scope

- Any other change to production River Run (it gets bug fixes only, direction rule 5).
- The fork's own deterministic test (#37), which reuses this case's shape.

---

## Result

*Filled in as the ticket is worked. Empty until then.*

- **What changed:**
- **Tested by:**
- **Deferred:** (each item also filed as a ticket or a debt row)
- **Fix rounds used:** 0 / 2
