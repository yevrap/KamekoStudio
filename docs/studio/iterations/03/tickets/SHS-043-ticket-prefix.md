# SHS-043 — New tickets are named SHS-NNN; the SS- series closes at 042

- **Status:** Ready
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

- [ ] `commit-lint` accepts `type(studio): SHS-NNN description` for `NNN` of 043 and above.
- [ ] `commit-lint` accepts `SS-NNN` only for `NNN` of 042 and below, so every existing
      commit still passes and no new ticket can be issued under the retired prefix.
- [ ] `commit-lint` rejects `SHS-NNN` for `NNN` of 042 and below: those numbers belong to
      `SS-` tickets, and one number naming two tickets is the ambiguity being removed.
- [ ] Each rejection says which of the three rules it broke.
- [ ] `process.md` and `templates/ticket.md` carry the executive's convention, and
      `process.md` states the naming rule that produced it, for every name the studio
      coins.
- [ ] ADR-0006 records the decision, why, and what was deliberately not done (no renames).
- [ ] No studio document other than decision records and history still presents `SS-NNN`
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

- **What changed:**
- **Tested by:**
- **Deferred:**
- **Fix rounds used:** 0 / 2
