# SS-016 — The production-file exception cannot be used to smuggle code

- **Status:** Done
- **Size:** M
- **Iteration:** 01
- **Role lead:** Tech Lead / Architect
- **Depends on:** SS-014
- **Branch:** `ss-016-harden-exception`

## Motivation

The independent review of this iteration's diff rejected it. The path exception guarding
`shared/3d/gameplay.js` accepted arbitrary executable JavaScript placed inside the approved
block, demonstrated end to end with the guard reporting the exception as *used* — while
`guardrails.md`, ADR-0005 and SS-014 all recorded that hole as already closed. The review
also found that `hygiene` fails at the gate on code this iteration added.

## Acceptance criteria

- [x] A permitted array element is defined by what it may contain, not by what it may not:
      exactly three `Vector3` calls, each with exactly three arguments drawn from numbers,
      identifiers, property paths and the four arithmetic operators.
- [x] Each of the four demonstrated bypasses is a regression test that fails against the
      old rule and passes against the new one.
- [x] The approved edit itself still passes, and the guard still reports it as *used*.
- [x] `hygiene` passes at the gate over the whole diff.
- [x] The reader for the base revision is tested against the repository, not only through
      the pure rule it feeds.
- [x] `portal-capacity` reports position and rotation tables listed in different orders.
- [x] `guardrails.md` and ADR-0005 state what the exception permits and what it still
      permits, rather than claiming a closed hole.

## Evidence plan

`tests/studio/rules.test.mjs` for the payloads, `tests/studio/path-guard.test.mjs` against
the real repository, and `npm run studio:check` at both the ticket and gate stages.

## Out of scope

Widening or re-approving the exception. Its scope is unchanged; only its enforcement is.

---

## Result

- **What changed:** In `tests/studio/lib/rules.mjs`, the exception's element pattern became
  a whitelist — `ARG` is `[-+*/\s\w.]+`, a `VECTOR` is exactly three of them, and the row
  is exactly three vectors — replacing "arguments containing no parentheses". Leading
  comment lines are bounded at twelve. `portalCapacity` now compares the position and
  rotation tables as ordered sequences. `textAt` in `checks/path-guard.mjs` is exported so
  it can be tested; `gitRaw` in `lib/shell.mjs` pipes stderr instead of letting git print to
  the console before the error is caught. The regex line that tripped the wikilink pattern
  carries the file's existing `studio-check:allow` pragma. `guardrails.md` and ADR-0005
  replace the claim that the hole was closed with what closed it and what remains permitted.
  The clearance comment in `shared/3d/gameplay.js` is corrected — see below.

- **The comment in the production file was wrong, and so was the review's correction of
  it.** Recomputed from the measured bounding boxes, at the proposed `roomDepth/2 - 1.2`:
  the two built portals were **clear** of every trophy, missing the nearest by 0.01 in z —
  so the original claim that nothing intersected was true for what shipped. But the
  **reserved twelfth slot**, the centre of the front wall, overlapped the tallest trophy in
  all three axes. The review asserted the built portals intersected, which they did not;
  the ticket asserted the margin was against the tallest trophy, which it was not. At the
  shipped `- 2.0` all three slots, including the reserved one, clear every trophy by 0.55 in
  z, and trophy depth is fixed at the shelf regardless of how many spawn. The comment now
  says that.

- **Tested by:**
  - The four demonstrated bypasses, each reproduced against the old rule before the fix
    (tagged template, assignment expression, a fourth element, a multi-line argument list)
    and each now rejected. Kept as tests, together with a two-element row, a call, a
    ternary, an index, a statement separator, and wrong argument counts.
  - The approved edit still passes and is still reported as *used*.
  - `tests/studio/path-guard.test.mjs` reads the repository: re-introducing the trim fails
    two of its three tests with *"the file lost its final newline on the way out of git"*;
    restoring it makes them pass.
  - `portal-capacity` reports tables listed in a different order.
  - 69 studio unit tests green. `hygiene` at the gate: 82 files clean.

- **Deferred, and stated rather than closed:** up to twelve leading comment lines inside the
  approved block may change without failing the guard. A comment cannot execute and
  `hygiene` scans this file as an exception path, so smuggled text is caught there. Recorded
  as an accepted residual in `guardrails.md`, not as a fixed hole.

- **Fix rounds used:** 1 / 2 — the whitelist's first form rejected `roomDepth / 2 - 2.0`
  with spaces around the operator, which the real edit does not use but a future one would.
