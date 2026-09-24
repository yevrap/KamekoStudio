# Shadow Studio — Questionnaire

Open decisions only. Everything else is decided in [Shadow Studio](design.md). Tick or write inline,
or just tell me in chat. Anything you leave blank takes the default (⭐), and since
[ADR-0011](../decisions/ADR-0011-the-studio-runs-itself.md) the team proceeds on the ⭐ at
once rather than waiting; answering later overturns it. Answered questions
are folded into the design and removed from here.

*Answered: Q10 (production fixes → the studio merges them itself after its own review, through a pull request once backlog #40 lands; the executive, in chat 2026-09-23, recorded in [ADR-0011](../decisions/ADR-0011-the-studio-runs-itself.md)), Q12 (first River Run experiment → ⭐ power-ups, blank at sprint 06's plan; built as [SHS-060](../iterations/06/tickets/SHS-060-river-run-power-ups.md)), Q11 (first fork → River Run, in chat 2026-09-22; recorded in [Direction](direction.md)). Answered and built: Q2 (identity → Backstage), Q3 (portal-limit fix → approved), Q6 (what
02 builds → the first experiment), Q7 (Overtighten → left on the shelf as an honest
prototype, ⭐ by silence), Q8 (process → keep the gate and break ties yourself, keep
`docs-current`, cap planned work only — all ⭐ by silence), Q4 (3D zone → the studio's
window: new workflow and results, no prod fixes — decided 2026-09-21), Q9 (studio rolls
out fixes under full sprint process — standing permission, decided 2026-09-21), and the
round-2 tie-break of iteration 03 (handed back to the team — decided 2026-09-21). All four
are now in [Shadow Studio](design.md) under *How the work is chosen*. The ticket
prefix → `SHS-`, your decision in [Shadow Studio — Naming Conventions](naming-conventions.md). See
[Shadow Studio — Input Ledger](input-ledger.md).*

**Q1. Name.** "Shadow Studio" and the folder `studio/` are working names. Renaming the
folder means changing a live URL, so it gets cheaper the sooner it's decided.
- [x] A. ⭐ Keep both. "Shadow Studio", `studio/`.
- [ ] B. Keep the folder, change the label shown to people: ______
- [ ] C. Change both. Name: ______  Folder: ______

**Q13. Should a studio production fix bump `version.json`?** (Sprint 07 review, IR-3;
backlog #43.) The arcade offers "New version available" to a player who already has it
open only when `version.json` changes. The studio's production fixes ([SHS-052](../iterations/04/tickets/SHS-052-td-009-fixed.md), [SHS-066](../iterations/07/tickets/SHS-066-production-river-run-restart.md))
never bumped it, because the path guard doesn't allow it, so a player with the arcade open
keeps the unfixed page until a reload. It touches the arcade's release marker, so, unlike
the other questions here, the team waits for a tick before building it.
- [x] A. ⭐ Yes: a production-fix ticket may list `version.json`, and its fix commit bumps
  it with the fix (reviewed with it, like any other production file).
- [ ] B. No: the arcade bumps `version.json` the next time it ships, which carries the fix.
- [ ] C. Leave it; a reload is enough.

**Q5. Anything else** about how you want to run this company, what a good review looks
like, or things it must never do?
i want it to run like a scrum team, following ceremonies and getting better

*Standing answer, 2026-09-21 — the quality bar:* keep everything professional and good
practice across all three surfaces. **GitHub:** clean history, conventional commits with
ticket IDs, no junk or secrets in the public repo, docs a stranger could follow, CI
green. **Planning docs:** steering views regenerated, indexes current, naming conventions followed, no
stale contradictions — repo is source of truth. **Skills/agent files:** `studio-iteration`,
`studio-standup`, `studio-promote` and `CLAUDE.md` — all kept current with `process.md`. And keep improving the workflow itself: every retro
keeps asking whether the last retro's fixes held, and that habit now extends to GitHub,
planning-doc and skills hygiene, not just iteration mechanics. (First audit under this bar:
see [Shadow Studio — Feedback Inbox](inbox.md) 2026-09-21.)

*Standing addition, 2026-09-21 — commit and push often:* Yev wants progress saved and live on GitHub continuously, visible while it's in flight. The studio commits and pushes frequently throughout an iteration — code, docs, and every scrum-ceremony artifact (planning, standups, review, retro) — not one big push at the end. Work may live on a branch (per the `shs-NNN-short-slug` convention, merged to main after testing and the gate), but the branch must be pushed regularly so the new work is watchable as it happens.

*Team note, iteration 06 retro:* the branch part predates [ADR-0007](../decisions/ADR-0007-trunk-based-development.md), which made the studio
trunk-based in iteration 04. Commits go to `main` and are pushed as each one lands, which
keeps the rest of this answer.

Q5 stays open for additions.

---

*Related: [Shadow Studio Index](README.md) · [Shadow Studio — Board](board.md) · [Shadow Studio — Handoff](handoff.md)*
