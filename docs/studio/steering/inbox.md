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
- (2026-09-22, executive direction) **Epic E1, the Studio Wing, starts with sprint 05**, and the team now runs one step per session (ADR-0009). The goal, budget (3 sprints + 1 reserve the team may claim), done-when and rules are in [Shadow Studio — Direction](direction.md). The ordered work is in [Shadow Studio — Backlog](backlog.md), which already holds every 2026-09-22 line above, the blocker at #1. Log these lines in the ledger and clear them.
- (2026-09-22, executive direction) The team should run like a scrum team: steerable when the executive gives direction, and moving on its own momentum from the backlog when not, in small steps that never take on anything too big. Tests, docs and tech debt for the games are welcome work. The studio's work on its own checks and paperwork is what stays capped. Keep the record readable, and lighter.
- (2026-09-22) Q11 is new in the [Questionnaire](questionnaire.md): which game is forked first. If it's still blank at `plan`, take the ⭐ (Maze Warden, rethink the shooting).
