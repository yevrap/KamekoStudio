# Shadow Studio — Questionnaire

Open decisions only. Everything else is decided in [Shadow Studio](design.md). Tick or write inline,
or just tell me in chat. Anything you leave blank takes the default (⭐). Answered questions
are folded into the design and removed from here.

*Answered: Q11 (first fork → River Run, in chat 2026-09-22; recorded in [Direction](direction.md)). Answered and built: Q2 (identity → Backstage), Q3 (portal-limit fix → approved), Q6 (what
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
- [ ] A. ⭐ Keep both. "Shadow Studio", `studio/`.
- [ ] B. Keep the folder, change the label shown to people: ______
- [ ] C. Change both. Name: ______  Folder: ______

**Q12. Which River Run experiment goes first?** *(new, sprint 05)*
River Run is the first fork (your call in chat, 2026-09-22, answering Q11). Its own
modernization questionnaire (`docs/archive/questionnaires/river-run-modernization.md`) is answered
but none of it is built, so the fork starts with a queue. Sprint 06 builds one of these and
you give it a Keep / Iterate / Kill.
- [ ] A. ⭐ **Power-ups:** a shield (one extra hit) and rapid-fire / spread shot, floating
  on the river. Both of your answers on the hit model and on pickups point here.
- [ ] B. **A near-miss streak:** tight dodges build a streak on the HUD; a hit or a wide
  pass resets it.
- [ ] C. **Biomes that change play:** the river's stretches handle differently (friction)
  and carry their own hazards, and you can tell when one starts.
- [ ] D. Something else: ______

**Q10. Should a production fix also need your approval before it goes live?** *(new, iteration 04)*
Iteration 04 made the studio's first production fix, TD-009 in Black Hole in One. Its
review then showed that the studio's own checks can't tell a real fix from a made-up one:
the studio writes everything they read, including the checks themselves. So from now on a
production fix waits for an independent review before it's pushed, and the push is refused
until that review covers the exact commit (SHS-054). That makes the review impossible to
*forget*. It can't make it impossible to *fake*, because the studio also writes the review
record. Only something outside the repo can do that, such as a GitHub pull request that you
merge.
- [ ] A. ⭐ Keep the standing permission. Production fixes go live after an independent
  review the studio records. No extra step for you; you see each fix in the Handoff.
- [ ] B. Production fixes go through a pull request that you merge on GitHub. The studio
  opens it after its own review and stops; nothing reaches the arcade until you click
  merge. Slower, but the only option the studio can't route around.
- [ ] C. Something else: ______

**Q5. Anything else** about how you want to run this company, what a good review looks
like, or things it must never do?

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

Q5 stays open for additions.

---

*Related: [Shadow Studio Index](README.md) · [Shadow Studio — Board](board.md) · [Shadow Studio — Handoff](handoff.md)*
