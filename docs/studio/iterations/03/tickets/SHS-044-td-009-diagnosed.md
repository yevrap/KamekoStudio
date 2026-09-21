# SHS-044 — TD-009 diagnosed: root cause, a deterministic reproduction, the production fix specified

- **Status:** Ready
- **Size:** S
- **Iteration:** 03
- **Role lead:** QA Engineer
- **Depends on:** none
- **Branch:** `shs-044-td-009-diagnosed`

## Motivation

TD-009: a Black Hole in One end-to-end test fails about one run in three, which makes the
studio's guarantee that "the whole suite is green before merging" weaker than it reads and
would hide a real regression in that path. It is production code, so the studio may not fix
it; the executive asked instead for what a fix would take. That needs the cause, not the
symptom.

## Acceptance criteria

- [ ] The root cause is stated in the debt register with the file and line that throw, why
      it is intermittent, and whether a player can reach it — each from a measurement, not
      from reading alone.
- [ ] A reproduction lives in the repository, under the studio's own paths, that produces
      the failure on every run rather than one in three, and reports plainly whether the
      defect is present — so the row can be closed later by running it.
- [ ] The reproduction is not collected by `npm test`, and so cannot turn the repository
      suite red.
- [ ] The production fix is specified — files, size, and the regression test it needs — as
      a proposal, not a change.
- [ ] No file outside the path guard changes.

## Evidence plan

Run the reproduction several times against the current tree; every run reproduces. Run it
with the precondition removed; no run reproduces. The path guard at the ticket stage.

## Out of scope

- The fix itself. Production-side; the executive decides.
- Any retry or exemption in the studio's own gate.

---

## Result

- **What changed:**
- **Tested by:**
- **Deferred:**
- **Fix rounds used:** 0 / 2
