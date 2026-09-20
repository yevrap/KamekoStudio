# Iteration 00 — retrospective

## Went well

- **The independent roles earned their cost immediately.** Two agents with fresh context,
  reading the same diff, independently found the same two most serious defects — and
  neither was findable by reading the code the way its author reads it. The guard's only
  exception was unenforced in precisely the situation it is used in, and it printed a
  reassuring line while checking nothing. Running them as separate contexts is not
  ceremony; it is the reason this iteration did not ship a guard that does not guard.
- **Automating the guarantees was the right call.** Six real defects surfaced while the
  checks were being built, before any review. A markdown checklist would have caught none
  of them.
- **The survey-before-proposing discipline paid.** SS-005 was expected to be "one link in
  `3d.html`". It turned out to be a two-file production change, blocked on a capacity bug
  that has been silently dropping two shipped games. Had the portal been built on the
  original assumption, the work would have been wasted and the bug would still be hidden.
- **Writing the tickets before the code** made the reviewers' job possible: they had
  explicit claims to test rather than intent to infer.

## Didn't

- **Criteria were ticked before they were true.** SS-009 marked `review.md` and `retro.md`
  complete while neither existed. This is precisely the failure the Definition of Done is
  meant to prevent, committed by the role that owns the Definition of Done, in the first
  iteration. Both reviewers caught it, which is the system working — but it should not have
  needed catching.
- **The unit tests passed while the wiring was broken.** `rules.test.mjs` exercised the
  exception rule against a synthetic diff and was green, while the check feeding that rule
  handed it an empty string. Testing a pure function proves the function; it says nothing
  about whether anything real reaches it.
- **Rules were written against the input they were designed for.** The storage rule checked
  the three methods its author had in mind. `clear()` — the single most destructive call
  available on a shared origin — was not on the list, and the check reported compliance.
- **Nine tickets against a standing cap of two to three.** Defensible for a setup
  iteration whose scope is a fixed brief, and it was recorded rather than hidden, but it is
  not a precedent.
- **The gate certified untracked files.** The document checks read the filesystem, so they
  happily verified nine ticket files that were not in the repository at all.

## Change next time

Each of these is a change already made, not an intention.

1. **Never tick a criterion before the artifact exists.** The Definition of Done gains no
   new words; the discipline is the point. SS-009's fix round records it.
2. **Every check must be exercised end to end against real data, not only through its pure
   function.** Added to `self-checks.md` under "Adding a check", together with:
3. **Test the input that defeats a rule, not the input it was written for.** Every hole the
   reviewers found now has a regression test written from their reproduction.
4. **`tree-clean` runs at the gate** (SS-010), so the paper-trail checks describe what will
   actually be pushed.
5. **A check that cannot run must say so, and must not resemble a failure.** Missing Chrome
   is now "not run" with a reason (SS-010); the gate still refuses to pass on it.
6. **The iteration's base ref is recorded in `plan.md`** when it cannot be defaulted.
7. **From iteration 01 the 2–3 ticket cap applies,** and the reserved share returns to ~20%.

## Reserved capacity

Planned as SS-003, SS-005 and SS-009 — a third of the iteration, deliberately high for a
setup run. Actually spent: considerably more, once SS-010 and SS-011 are counted, since the
entire fix round was debt repayment against work created earlier in the same iteration.
That is the honest reading — the reserve was not so much used as overrun, and it was
overrun on debt the iteration created itself rather than on debt it inherited.

For iteration 01: the register carries five open rows (TD-001 … TD-005), three of them
production-side and blocked on approval. The reserved share should go to TD-003 and TD-004,
which the studio can close on its own.
