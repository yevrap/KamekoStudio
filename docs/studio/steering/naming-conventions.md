# Shadow Studio — Naming Conventions

*Decision from Yev, September 21, 2026.*

## The SS prefix is retired

All 37 tickets across iterations 00–02 used `SS-NNN-slug`. "SS" is out — the
Schutzstaffel connotation rules it out on its own, and it's lazy besides:
screenshot? single sign-on? An agent took the initials of "Shadow Studio" and
nobody checked what else those initials mean. That's the real lesson, and it's
now a rule (below).

## The new convention

- Tickets: `SHS-NNN-slug`
- Branches: `shs-NNN-short-slug`
- Commits: `feat(studio): SHS-043 short description`
- The 37 existing `SS-*` tickets keep their names. Renaming history would break
  references in the changelog, retros, and learning log — grandfathered, not
  renamed.
- `docs/studio/process.md` and `docs/studio/templates/ticket.md` in the repo
  were updated to the new convention on Sept 21, 2026, so future runs pick it
  up automatically.

## The naming rule — applies to everything the studio names

Names are user-facing even when they're internal: they end up in commits, URLs,
and the public repo. Before adopting any abbreviation, codename, or label:

1. Read it as a stranger would. Check for unintended meanings — especially
   loaded or offensive ones.
2. Prefer clarity over brevity. A plain word beats a clever two-letter tag.
3. If unsure, search it. Ten seconds.
4. When in doubt, spell it out.

Ticket prefixes, branch names, feature codenames, CSS classes people will read
— all of it.

---

*Related: [Shadow Studio Index](README.md) · [Shadow Studio](design.md)*
