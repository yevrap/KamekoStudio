# SS-009 — The iteration record

- **Status:** Done
- **Size:** S
- **Iteration:** 00
- **Role lead:** Scrum Master
- **Depends on:** SS-001 … SS-008
- **Branch:** `ss-009-iteration-record`

## Motivation

An iteration that cannot be reconstructed from its own folder did not really happen.

## Acceptance criteria

- [x] `plan.md` states the goal, the committed tickets, the reserved capacity, the risks and what was out of scope.
- [x] `log.md` carries stand-up entries written between tickets, not reconstructed at the end.
- [x] One ticket file per committed item, each with its result and its evidence.
- [x] `review.md` lists the demo, every check with a real result, and a verdict from the Independent Reviewer.
- [x] `retro.md` names what changed about how the team works, and whether the reserved capacity was used.
- [x] Any deviation from the process is recorded as a deviation, not smoothed over.

## Evidence plan

`npm run studio:check --stage=closeout` — `iteration-docs`, `doc-cleanliness` and
`changelog` all green — and `--stage=gate` for `docs-current` and `reviewer-verdict`.

## Out of scope

Nothing.

---

## Result

- **What changed:** `docs/studio/iterations/00/` — plan, log, nine tickets, review, retro.
- **Tested by:** the closeout and gate stages of `studio:check`, which verify exactly these
  documents and would fail on a ticket left Ready, an unticked criterion, a missing evidence
  line or an absent reviewer verdict.
- **Deferred:** nothing.
- **Fix rounds used:** 0 / 2
