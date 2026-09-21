# SHS-050 — Every push is checked by one stage before it and one after, and the after-stage cannot pass on a stale build or a vacuous baseline

- **Status:** In progress
- **Size:** M
- **Iteration:** 04
- **Role lead:** QA Engineer
- **Depends on:** none
- **Branch:** none — trunk-based, commits to `main` (ADR-0007)

## Motivation

Under trunk-based work every finished ticket is pushed and deploy-checked, and two gaps
registered at the end of iteration 03 make that check wrong on a correct deploy (TD-010:
`studio-live` looks for the new build once and never waits for it) or right for no reason
(TD-011: after tagging, `production-unchanged` compares the release with itself).
ADR-0007 also committed this iteration to a `push` stage, so that "safe to push" is one
command rather than three.

## Acceptance criteria

- [ ] `studio-live` fetches the page, and the files it loads, again on every attempt until
      the marker is found or the attempts run out. A build that arrives after the first
      attempt passes with no re-run by hand, and the report says which attempt found it.
      (TD-010)
- [ ] `studio-live` takes `--marker-at=<site path>`, defaulting to `/studio/`, so a push
      that changes only a file outside the realm can still prove its build is being served.
- [ ] Without `--previous-tag`, `production-unchanged` compares with the newest
      `studio-iteration-*` tag that does not point at `HEAD`. Run straight after tagging,
      it compares with the previous iteration. The same default applies to `--base`.
      (TD-011)
- [ ] A comparison that covers no commits at all — the baseline *is* `HEAD` — reports
      `not run` with the reason, never `pass`.
- [ ] A `push` stage runs the gate's checks except `docs-current` and `reviewer-verdict`,
      the two that only make sense once the iteration is reviewed, and, like the gate,
      treats `not run` as a failure.
- [ ] `self-checks.md` documents the stage, `--marker-at` and the new defaults;
      `process.md` names the stage where it says what runs before a push; TD-010 and
      TD-011 are closed in `tech-debt.md` with this ticket's ID.

## Evidence plan

- Unit tests with an injected fetch and wait: the marker found on a later attempt, never
  found (fails, naming the attempt count), and a page that stops returning 200.
- Unit tests over a throwaway git repository for the default baseline: the newest tag on
  `HEAD`, the newest tag behind `HEAD`, two tags on `HEAD`, no tags at all.
- A test that the `push` stage's membership is the gate's minus exactly those two checks.
- This ticket's own push: `--stage=push` before it, then `--stage=postdeploy` straight
  after it, without waiting by hand.

## Out of scope

- Comparing every deployed file with the committed one. The marker is enough to show the
  new build is being served; a byte-for-byte comparison is a larger change with its own
  failure modes (caching, encodings) and is not needed to close either row.
- Any change to what the gate itself runs.

---

## Result

*Filled in as the ticket is worked. Empty until then.*

- **What changed:**
- **Tested by:**
- **Deferred:**
- **Fix rounds used:** 0 / 2
