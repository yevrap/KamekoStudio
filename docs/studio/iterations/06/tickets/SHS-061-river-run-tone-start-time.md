# SHS-061 — River Run fork: the music never schedules a Tone.js start below `Tone.now()`

- **Status:** Ready
- **Size:** S
- **Iteration:** 06
- **Role lead:** Audio / Juice
- **Depends on:** SHS-060 (it retires the equality test this exemption rests on)
- **Branch:** none — trunk-based, commits to `main` (ADR-0007)

## Motivation

The fork restarts a Tone.js sequence on every new run, and now and then Tone rejects a
start time a hair below zero (`RangeError … got: -1e-12`, uncaught in promise). It was
inherited from production, found at SHS-056's build and carried as a named exemption in the
fork's browser test and as TD-014 (backlog #22).

## Acceptance criteria

- [ ] The fork never schedules a Tone start time below `Tone.now()`.
- [ ] The named exemption in `tests/studio/river-run-fork.test.mjs` is gone, and TD-014 is
      closed in `tech-debt.md`.
- [ ] A browser test starts 20 new runs in the fork and sees no uncaught rejection.

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

- **What changed:**
- **Tested by:**
- **Deferred:** (each item also filed as a ticket or a debt row)
- **Fix rounds used:** 0 / 2
