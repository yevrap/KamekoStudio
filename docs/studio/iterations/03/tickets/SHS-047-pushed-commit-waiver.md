# SHS-047 — A pushed commit that fails the lint is waived by its hash, visibly

- **Status:** Done
- **Size:** S
- **Iteration:** 03
- **Role lead:** Tech Lead / Architect
- **Depends on:** [SHS-043](SHS-043-ticket-prefix.md)
- **Branch:** `shs-047-pushed-commit-waiver`

## Motivation

Opened during the build, by [SHS-043](SHS-043-ticket-prefix.md)'s own verification. SS-042's commit subject is 81
characters against `commit-lint`'s limit of 80. It reached the remote's `main` after the
iteration-02 gate had run, and it is inside this iteration's range, so this iteration's
gate fails on it whatever else is true. It cannot be fixed without rewriting published
history.

## Acceptance criteria

- [x] `commit-lint` passes a failing commit only when its **full** hash is listed in
      `LINT_WAIVERS`, with a reason that names the ticket explaining it.
- [x] The same subject on any other commit fails, as does an abbreviated, upper-cased or
      missing hash: a waiver cannot be claimed by copying.
- [x] Every waiver applied is printed in the check's output; none is silent.
- [x] The list holds exactly the one commit that needs it.
- [x] `self-checks.md` says the waiver exists, how it is keyed, and why that is not the
      kind of exemption the studio has learned to distrust.

## Evidence plan

Unit tests in `tests/studio/rules.test.mjs`. The gate stage's `commit-lint` against the
real range, before and after.

## Out of scope

- Amending, reverting or force-pushing anything. Rewriting published history is a stop
  and ask, and a one-character overrun does not justify one.
- Waiving any other rule or any other commit.

---

## Result

- **What changed:** `tests/studio/lib/rules.mjs` — `LINT_WAIVERS`, a map from full hash to
  reason with one entry, and `lintCommit`, which returns `ok`, `waived` or `fail` for one
  commit and consults the map only when the subject fails. `tests/studio/checks/commit-lint.mjs`
  reads the full hash (`%H`, previously `%h`) and prints each waiver it applies, on a pass
  as well as a failure. `self-checks.md`'s `commit-lint` row describes the waiver.

- **Tested by:** four new tests in `tests/studio/rules.test.mjs`: the waived commit's
  subject fails without the waiver and passes with it, reason attached; the same subject
  under a different hash, a seven-character prefix of the hash, the hash upper-cased, and
  no hash, all fail; a conforming commit and a merge are `ok`; every entry is a
  40-character lower-case hash with a reason naming a ticket. `tests/studio/rules.test.mjs`
  69/69. `commit-lint` against the real range, `studio-iteration-02..HEAD`, at two points
  that were **uncommitted working trees**, not commits: before the waiver, run during
  [SHS-043](SHS-043-ticket-prefix.md) before its own commit, *"1 of 5 commit(s): 5416876 subject is 81 characters"*;
  after, run on this ticket's branch before its commit, *"6 non-merge commit(s)
  conventional, 1 waived by hash: 5416876 waived — SS-042: subject is 81 characters…"*.
  Re-measured at commits by the QA review — the parent of this ticket's merge gives "1 of
  6", this ticket's commit "7 … 1 waived" — the same result one commit later each time,
  because each count includes the commit that had not yet been made when it was taken.
  `--stage=gate --skip-slow` on this branch: `path-guard`, `storage-keys`,
  `portal-capacity`, `studio-boot`, `hygiene` and `commit-lint` pass.

- **Deferred:** nothing.

- **Fix rounds used:** 1 / 2 — the record only: two counts, above, that did not say where they were taken
