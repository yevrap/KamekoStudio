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
      commit still passes and no new ticket can be issued under the retired prefix.
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
  conforming subject names, for SHS-045. `lintCommitSubject` reports which rule failed.
  `docs/studio/process.md` carries the executive's two convention lines, a line on the
  single sequence, and a new *Naming* section. `templates/ticket.md` carries the
  executive's edit unchanged. New `decisions/ADR-0006-ticket-prefix.md`, indexed.
  `self-checks.md`'s `commit-lint` row, `public-repo-hygiene.md`'s example and one message
  in `checks/docs.mjs` updated to the new prefix.

- **Tested by:** seven new tests in `tests/studio/rules.test.mjs`, each on a boundary —
  `SS-042` and `SHS-043` pass; `SS-043`, `SS-100`, `SHS-042`, `SHS-001`, `SHS-000` fail
  with the message for their rule; seven near-miss spellings (case, `SH-`, `SSH-`, two and
  four digits, no hyphen) fail as malformed; the four failure messages are distinct.
  `npm test` 681/681, `tests/studio/` 215/215. Every studio commit subject in the whole
  history, 49 of them, read with the studio's own git helper and linted under the new
  rule: **all pass the prefix rule**; one, SS-042's, fails the *length* rule at 81
  characters — it was failing before this change, and is SHS-047. `git grep` for the old
  convention outside `iterations/` and `decisions/` finds only the `commit-lint` row, which
  names it as the retired range. `--stage=ticket` green; `--stage=gate --skip-slow`:
  `path-guard`, `storage-keys`, `portal-capacity`, `studio-boot` and `hygiene` pass, the
  rest fail for the expected reasons (uncommitted work, slow suites skipped, SS-042's
  length, tickets not yet closed, no review yet).

- **Deferred:** SS-042's over-length subject, opened as SHS-047. Branch names remain
  unchecked, as ADR-0006 says.

- **Fix rounds used:** 0 / 2
