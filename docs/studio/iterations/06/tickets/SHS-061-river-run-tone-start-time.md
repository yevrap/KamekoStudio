# SHS-061 — River Run fork: the music never schedules a Tone.js start below `Tone.now()`

- **Status:** Done
- **Size:** S
- **Iteration:** 06
- **Role lead:** Audio / Juice
- **Depends on:** [SHS-060](SHS-060-river-run-power-ups.md) (it retires the equality test this exemption rests on)
- **Branch:** none — trunk-based, commits to `main` (ADR-0007)

## Motivation

The fork restarts a Tone.js sequence on every new run, and now and then Tone rejects a
start time a hair below zero (`RangeError … got: -1e-12`, uncaught in promise). It was
inherited from production, found at [SHS-056](../../05/tickets/SHS-056-river-run-fork.md)'s build and carried as a named exemption in the
fork's browser test and as TD-014 (backlog #22).

## Acceptance criteria

- [x] The fork never schedules a Tone start time below `Tone.now()`.
- [x] The named exemption in `tests/studio/river-run-fork.test.mjs` is gone, and TD-014 is
      closed in `tech-debt.md`.
- [x] A browser test starts 20 new runs in the fork and sees no uncaught rejection.

## Evidence plan

The 20-run browser test, shown red before the fix (or, if the race won't reproduce on
demand, the exemption removed first and the test shown catching an injected negative
start); `--stage=ticket`, `--stage=push`, `--stage=postdeploy`.

## Out of scope

- Production River Run's identical bug: backlog #33, a production fix under ADR-0008.
- Any other audio change.

---

## Result

*Filled in as the ticket is worked. Empty until then.*

- **What changed:** Reproduced first, with a stack: 38 of 40 fast restarts threw, and the
  throw came from `musicSequence.stop()` in `initGame`, not from a start. With no time
  given, `stop()` turns "now" into Transport ticks; `gameOver` has stopped the Transport, so
  that comes out a hair below zero (`-3e-14`) and Tone's range check throws. It was also
  worse than a stray rejection: `initGame` is async, so the throw aborted it before the game
  loop and the music started, and the "restarted" run sat frozen (no loop, Transport
  stopped, not game over). The fork now disposes the old sequence without stopping it
  (dispose cancels its Transport events), and the music restart sits in a `try` that logs a
  failure with `console.error`, so audio can never keep a run from starting. The test still
  sees a logged failure: `collectErrors` collects `console.error`.
- **Tested by:** a new browser test in `tests/studio/river-run-fork.test.mjs` starts 20 runs
  in a row (uneven run lengths, `gameOver()` then Restart) and asserts, per run, that the
  game loop and the Transport are running and nothing was thrown; then that the music
  plays after the twentieth restart and no more than one sequence's worth of notes (at
  most 4 in 1.5 s, so leftover sequences would show). Red before the fix: *"run 2 did not
  start its game loop and music: RangeError … got: -7.99e-15"*. Green three full-file runs
  in a row (18/18). `INHERITED_TONE_RANGE` is deleted and the other browser tests now
  accept no error at all. `--stage=ticket`, `--stage=push`, `--stage=postdeploy`: see the
  build log.
- **Deferred:** production's identical code (backlog #33), now written up with the freeze and
  the dispose fix. The criterion's wording ("start time") named the wrong call; it is met
  in substance, since the fork makes no Tone call that converts a stopped Transport's
  "now".
- **Fix rounds used:** 0 / 2
