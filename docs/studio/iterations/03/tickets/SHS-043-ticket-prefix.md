# SHS-043 — New tickets are named SHS-NNN; the SS- series closes at 042

- **Status:** Done
- **Size:** S
- **Iteration:** 03
- **Role lead:** Tech Lead / Architect
- **Depends on:** none
- **Branch:** `shs-043-ticket-prefix`

## Motivation

The ticket prefix `SS-` was made by abbreviating the realm's name, and nobody read the
result as a stranger would: the initials are those of the Nazi *Schutzstaffel*, and are
ambiguous besides. The executive retired the prefix. New tickets are `SHS-NNN`, numbering
continues from 043, and existing `SS-` tickets keep their names. The handbook's two
convention lines were changed by the executive directly; `commit-lint` still accepts only
`SS-NNN`, so the convention cannot yet be followed without failing the gate.

## Acceptance criteria

- [x] `commit-lint` accepts `type(studio): SHS-NNN description` for `NNN` of 043 and above.
- [x] `commit-lint` accepts `SS-NNN` only for `NNN` of 042 and below, so every existing
      commit still passes the prefix rule and no new ticket can be issued under the retired
      prefix.
- [x] `commit-lint` rejects `SHS-NNN` for `NNN` of 042 and below: those numbers belong to
      `SS-` tickets, and one number naming two tickets is the ambiguity being removed.
- [x] Each rejection says which of the three rules it broke.
- [x] `process.md` and `templates/ticket.md` carry the executive's convention, and
      `process.md` states the naming rule that produced it, for every name the studio
      coins.
- [x] ADR-0006 records the decision, why, and what was deliberately not done (no renames).
- [x] No studio document other than decision records and history still presents `SS-NNN`
      as the convention.

## Evidence plan

Unit tests in `tests/studio/rules.test.mjs`, one per rule, each with the input that sits on
the boundary (042 and 043 for both prefixes). `git grep` for the old convention across
`docs/studio/` outside `iterations/` and `decisions/`.

## Out of scope

- Renaming `SS-001`…`SS-042`, their files or their branches.
- Branch names: nothing checks them, and this ticket does not start to.

---

## Result

- **What changed:** `tests/studio/lib/rules.mjs` — `COMMIT_RE` accepts `SHS` or `SS`;
  `ticketIdProblem` decides the sequence (an `SS-` number above `LAST_SS_TICKET`, 42, is
  retired; an `SHS-` number at or below it collides); `commitTicketId` returns the ID a
  conforming subject names, for [SHS-045](SHS-045-every-ticket-has-a-file.md). `lintCommitSubject` reports which rule failed.
  `docs/studio/process.md` carries the executive's two convention lines, a line on the
  single sequence, and a new *Naming* section. `templates/ticket.md` carries the
  executive's edit unchanged. New `decisions/ADR-0006-ticket-prefix.md`, indexed.
  `self-checks.md`'s `commit-lint` row, `public-repo-hygiene.md`'s example and one message
  in `checks/docs.mjs` updated to the new prefix. **Fix round 1**, from the QA review: the
  handbook's own example commit, `feat(studio): SHS-003 add the path-guard check`, was
  rejected by the rule this ticket introduced — it came in with the executive's edit, and
  the check for leftovers searched only for the *old* prefix. The example is now
  `SHS-043`, and a new test reads the example commit subjects in the handbook and lints
  them. **Fix round 2**, from the QA review's second round: that test matched only
  inline-code examples using one of the nine allowed types, in top-level files — so a
  fenced example, `feat(studio)!: …`, `ci(studio): …`, or an example in `decisions/` or
  `team/` passed unchecked, and the claim that *an example cannot contradict the rule
  again* was larger than the test. It now matches anything shaped like a studio commit
  subject with a ticket number, any type, inline or fenced, in every handbook document at
  any depth, excluding only the records — `iterations/`, the changelog and the learning
  log — which quote rejected subjects because that is what happened. This round was not
  reviewed: review is capped at two.

- **Tested by:** seven new tests in `tests/studio/rules.test.mjs`, each on a boundary —
  `SS-042` and `SHS-043` pass; `SS-043`, `SS-100`, `SHS-042`, `SHS-001`, `SHS-000` fail
  with the message for their rule; seven near-miss spellings (case, `SH-`, `SSH-`, two and
  four digits, no hyphen) fail as malformed; the four failure messages are distinct.
  `npm test` 681/681, `tests/studio/` 215/215. Every studio commit subject in the whole
  history, 49 of them, read with the studio's own git helper and linted under the new
  rule: **all pass the prefix rule**; one, SS-042's, fails the *length* rule at 81
  characters — it was failing before this change, and is [SHS-047](SHS-047-pushed-commit-waiver.md). `git grep` for the old
  convention outside `iterations/` and `decisions/` finds only the `commit-lint` row, which
  names it as the retired range. `--stage=ticket` green; `--stage=gate --skip-slow`:
  `path-guard`, `storage-keys`, `portal-capacity`, `studio-boot` and `hygiene` pass, the
  rest fail for the expected reasons (uncommitted work, slow suites skipped, SS-042's
  length, tickets not yet closed, no review yet). Fix round 1: the example-subject test
  fails on the old `SHS-003` line with *"process.md: feat(studio): SHS-003 add the
  path-guard check"* and passes on the corrected one; `tests/studio/rules.test.mjs` 78/78.
  Fix round 2: each of the QA review's five defeating inputs, added alone and reverted —
  a fenced `SHS-003` example and inline `feat(studio)!: SS-060 …` and `ci(studio): SHS-050
  …` in `process.md`, `feat(studio): SHS-003 …` in ADR-0006, `fix(studio): SS-060 …` in
  `team/qa-engineer.md` — now fails the test; the handbook as committed passes, 82/82.

- **Deferred:** SS-042's over-length subject, opened as [SHS-047](SHS-047-pushed-commit-waiver.md). Branch names remain
  unchecked, as ADR-0006 says.

- **Fix rounds used:** 2 / 2
