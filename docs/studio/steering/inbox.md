# Shadow Studio — Feedback Inbox

Drop lines here whenever. One thought per line, no format required, no need to be fair or
finished. Every run reads this before planning, logs each line in
[Shadow Studio — Input Ledger](input-ledger.md), and turns it into a ticket, a deferral, or a reasoned
"won't do" — then tells you which.

Lines are cleared once they've been triaged; the record of what happened to them lives in
the Input Ledger.

---

- (2026-09-22, executive direction, carried out outside an iteration) The repo is now the studio's single home. The steering views (this inbox, the ledger, board, scorecard, handoff, questionnaire, design and realm brief) moved into `docs/studio/steering/`, and the three studio skills into `.claude/skills/`. Nothing about the studio is kept anywhere else any more.
- (2026-09-22, **blocks the next gate**) `path-guard` and `production-unchanged` judge every commit since `studio-iteration-04`, so the non-studio commits that landed after it — this migration (`CLAUDE.md`, `docs/`, `.claude/`, `tests/repo-hygiene.test.mjs`) and any arcade ship — will read as studio violations, and `commit-lint` will reject their subjects, since it expects `type(studio): SHS-NNN` on every commit in that range. The arcade and the studio now share `main`. The checks need to tell studio work from arcade work (for example, by commit scope) rather than by range alone. Expect preflight or the gate to go red until this is fixed.
- (2026-09-22) Ratify the move with a decision record, and bring the handbook in line: `public-repo-hygiene.md` says verbatim direction "is kept privately, outside the repository" — there is no longer anywhere else; inputs are restated in the ledger. Close-out no longer needs `--docs-root`: the steering views are inside `docs/studio/`.
- (2026-09-22) The repo hygiene scan now also runs over all markdown in `npm test` (`tests/repo-hygiene.test.mjs`, reusing `scanHygiene`). Decide whether `studio:check`'s own `hygiene` should stay studio-scoped or defer to it.
