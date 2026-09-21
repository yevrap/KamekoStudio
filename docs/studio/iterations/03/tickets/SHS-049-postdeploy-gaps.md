# SHS-049 — The two post-deploy gaps found by publishing are registered

- **Status:** Done
- **Size:** S
- **Iteration:** 03
- **Role lead:** QA Engineer
- **Depends on:** none
- **Branch:** `shs-049-postdeploy-gaps`

## Motivation

Found by this iteration's publish step, after the `studio-iteration-03` tag: `studio-live`
reported the correct deploy as a failure because it never waits for the new build, and
`production-unchanged` passed by comparing the release with itself. Both are recorded here
rather than only in the handoff, because a gap written down outside the repository
schedules nothing.

## Acceptance criteria

- [x] Each gap has a debt row stating what it does, how it was found, and the cost of
      leaving it.
- [x] Until the second is fixed, `self-checks.md` tells whoever runs the stage how to avoid
      it.

## Evidence plan

The two post-deploy runs, before and after the explicit baseline.

## Out of scope

- Fixing either check. Both are the next iteration's first work, where a post-deploy check
  runs on every ticket's push.

---

## Result

- **What changed:** `tech-debt.md` — TD-010 and TD-011. `self-checks.md` — `--previous-tag`
  in the usage block, and a warning where the defaults are described.
- **Tested by:** the publish step's own runs. First, straight after pushing:
  `studio-live` *fail — "marker … not found … after 1 attempt(s)"*, `production-unchanged`
  *pass — "since studio-iteration-03 (0 path(s) inside the guard)"*. Then, with the new
  build on the wire and `--previous-tag=studio-iteration-02`: all three pass —
  `studio-live` found the marker in `shelf-data.js`, `production-unchanged` compared 36
  paths with iteration 02 and found nothing outside the guard. This ticket lands after the
  iteration's tag and was not reviewed.
- **Deferred:** both fixes, to the next iteration.
- **Fix rounds used:** 0 / 2
