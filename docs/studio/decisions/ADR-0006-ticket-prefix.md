# ADR-0006 — Tickets are numbered `SHS-NNN`; the `SS-` prefix is retired at 042

- **Status:** Accepted
- **Date:** 2026-09-21
- **Iteration:** 03

## Context

From iteration 00 the studio numbered its tickets `SS-NNN`, the initials of "Shadow
Studio". The prefix was made by abbreviating the name, and nobody read the result as a
stranger would. `SS` is the abbreviation of the Nazi *Schutzstaffel*. It is also ambiguous
in ordinary use — a screenshot, single sign-on — which is a lesser problem of the same
kind: a name that does not say what it names.

The prefix appears in every studio commit subject, every branch name, every ticket file
name and throughout the handbook, and this repository is public.

Tickets `SS-001` to `SS-042` were issued before the decision. They are referred to by
number throughout the changelog, the retros and the learning log.

## Decision

The executive retired the prefix. From ticket 043 onward, tickets are **`SHS-NNN`**,
branches `shs-NNN-short-slug`, commits `type(studio): SHS-NNN description`.

**The numbering is one sequence, not two.** It continues from 043, so a number identifies
exactly one ticket whichever prefix it carries.

**Existing tickets keep their names.** Renaming them would break every reference to them in
the record, and a history that has been rewritten to look better is worth less than one that
shows what happened.

`commit-lint` enforces both halves: an `SS-` number above 042 is a new ticket under the
retired prefix, and an `SHS-` number at or below 042 would give one number to two tickets.
Both fail the gate with a message naming the rule.

The naming rule that should have caught this is in [`process.md`](../process.md#naming),
and applies to every name the studio coins.

## Consequences

- Anyone reading the history sees both prefixes, with the switch at 043 and this record
  explaining it.
- The lint rule carries a constant, `LAST_SS_TICKET`, that will never change again. It is
  a fact about history, not configuration.
- Branch names are not checked by anything, before or after this decision. A branch named
  under the old prefix would not be caught.

## Alternatives considered

| Option | Why not |
|---|---|
| Rename every `SS-` ticket, file and reference | Rewrites the record; breaks links from the changelog, retros and learning log; and old branch names and merge subjects in git cannot be renamed at all, so the result would be inconsistent anyway |
| Restart numbering at `SHS-001` | `SHS-001` and `SS-001` would both be "ticket 1", and every reference by number alone would become ambiguous |
| Accept either prefix for any number | The retired prefix would stay usable for new work, which is the thing being retired |
