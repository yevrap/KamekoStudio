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
- [x] The explicit `--base` this iteration's checks require is written down, since iteration 00 has no previous tag to default to.

## Evidence plan

`npm run studio:check --stage=closeout` — `iteration-docs`, `doc-cleanliness` and
`changelog` all green — and `--stage=gate` for `docs-current` and `reviewer-verdict`.

## Out of scope

Nothing.

---

## Result

- **What changed:** `docs/studio/iterations/00/` — plan, log, eleven tickets, review, retro.
  The base ref for this iteration's checks is `697385f`, recorded in `plan.md` and
  `review.md`; from iteration 01 the `studio-iteration-00` tag makes it the default.
- **Tested by:** the closeout and gate stages of `studio:check`, which verify exactly these
  documents and would fail on a ticket left Ready, an unticked criterion, a missing evidence
  line or an absent reviewer verdict.
- **Deferred:** nothing.
- **Fix rounds used:** 1 / 2 — the first version of this ticket ticked the `review.md` and
  `retro.md` criteria before either document existed. Both reviewers caught it. The
  criteria are ticked now because the documents exist now; the lesson is in the retro.
