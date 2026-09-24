# Shadow Studio — Questionnaire

Open decisions only. Everything else is decided in [Shadow Studio](design.md). Tick or write inline,
or just tell me in chat. Anything you leave blank takes the default (⭐), and since
[ADR-0011](../decisions/ADR-0011-the-studio-runs-itself.md) the team proceeds on the ⭐ at
once rather than waiting; answering later overturns it. Answered questions
are folded into the design and removed from here.

*Answered: Q14 (E2's first game → ⭐ Samovar, blank at plans 08 and 09; built as [SHS-068](../iterations/08/tickets/SHS-068-samovar-core.md) and iterated in sprint 09), Q1 (name → keep "Shadow Studio" and `studio/`, ticked 2026-09-24; folded into [the design](design.md)), Q13 (a studio production fix bumps `version.json` → yes, ticked 2026-09-24; backlog #43 is Ready on it), Q10 (production fixes → the studio merges them itself after its own review, through a pull request once backlog #40 lands; the executive, in chat 2026-09-23, recorded in [ADR-0011](../decisions/ADR-0011-the-studio-runs-itself.md)), Q12 (first River Run experiment → ⭐ power-ups, blank at sprint 06's plan; built as [SHS-060](../iterations/06/tickets/SHS-060-river-run-power-ups.md)), Q11 (first fork → River Run, in chat 2026-09-22; recorded in [Direction](direction.md)). Answered and built: Q2 (identity → Backstage), Q3 (portal-limit fix → approved), Q6 (what
02 builds → the first experiment), Q7 (Overtighten → left on the shelf as an honest
prototype, ⭐ by silence), Q8 (process → keep the gate and break ties yourself, keep
`docs-current`, cap planned work only — all ⭐ by silence), Q4 (3D zone → the studio's
window: new workflow and results, no prod fixes — decided 2026-09-21), Q9 (studio rolls
out fixes under full sprint process — standing permission, decided 2026-09-21), and the
round-2 tie-break of iteration 03 (handed back to the team — decided 2026-09-21). All four
are now in [Shadow Studio](design.md) under *How the work is chosen*. The ticket
prefix → `SHS-`, your decision in [Shadow Studio — Naming Conventions](naming-conventions.md). See
[Shadow Studio — Input Ledger](input-ledger.md).*

**Q15. What makes Samovar's cups different?** (review 08, IR08-1; backlog #53). As built,
every cup has the same shape, so a three-star brew stops at the same share of each cup's
height and the cup's size changes only how long the pour takes. The Playtester's Iterate
also asks for the same fill time on every cup (#52), which on its own would make the cups
identical. Blank at plan 09, so the ⭐ is built in sprint 09 as [SHS-072](../iterations/09/tickets/SHS-072-samovar-cup-shapes.md), with #52;
ticking B or C before sprint 09's review turns it around.
- [ ] A. ⭐ **Shapes.** Cups of different shapes: a straight tea glass in its holder, a
  tulip glass that narrows at the waist, a wide bowl. The level no longer climbs evenly, so
  the right stop sits at a different height in each, and the shape is what you learn.
- [ ] B. **Hide the brew.** The metal glass-holder covers the lower part of every glass,
  so the brew can't be judged by its level, only by how long you poured; the colour shows
  once the water rises above the holder.
- [ ] C. **Keep one shape.** Accept a stop-at-a-line game and make the colour the whole
  skill (for example, strengths closer together).
- [ ] D. Something else: ______

**Q16. Trim the root `CLAUDE.md`?** (retro 08, issue #4). Every agent loads it, and in
sprint 08 that was 13 agents and about 365 API requests. It is 46 KB. Most of it is arcade
reference a studio step never uses. It sits outside the studio's paths, so this is yours
to decide, and the studio won't edit it. Measured sizes: the localStorage table 8.0 KB,
the games table 7.6 KB, Keypad Quest's architecture notes 3.2 KB, the settings drawer API
3.9 KB, the mobile patterns 3.7 KB. **What it would save:** moving the first and third (11
KB, about 3k tokens) saves about $0.40 a sprint at list price, about 2% of a sprint's
$18–19. Moving all five (26 KB) saves about $1, about 5%. Arcade sessions would read them from
`games/CLAUDE.md`, which loads when an agent works under `games/`.
- [ ] A. ⭐ **Move the two arcade-only reference blocks** (the localStorage table and the
  Keypad Quest notes) into `games/CLAUDE.md`, and leave a one-line pointer. It is small but
  free, and it's where the arcade's agents already look for game detail.
- [ ] B. **Move all five**, keeping a short summary of each in the root file.
- [ ] C. **Leave it.** 2–5% isn't worth reshaping the arcade's context.
- [ ] D. Something else: ______

The ⭐ is a production doc change, so it waits for your tick rather than being taken; an
arcade session makes it. Nothing in the studio depends on it.

**Q17. When does a studio pull request merge?** (plan 09, backlog #49,
[SHS-074](../iterations/09/tickets/SHS-074-skill-describes-pull-requests.md)). [ADR-0011](../decisions/ADR-0011-the-studio-runs-itself.md) §5 says a ticket's pull request merges when CI is green and
"the review approves", but the sprint's review runs once, after every build, and a later
ticket often builds on an earlier one. The ⭐ is written into the skill in sprint 09 and
used from sprint 10.
- [ ] A. ⭐ **At the end of its build.** It squash-merges when CI and the local `push` stage
  are green, which is when trunk pushes today, also before review. The sprint's review
  posts the Independent Reviewer's verdict on each pull request and fixes forward. A
  production fix is the exception: its pull request stays open until its review record
  exists (ADR-0008).
- [ ] B. **After its own review.** The Independent Reviewer reviews each pull request before
  it merges: one more Opus agent per ticket, about $1 each, so about $3 (about 17 %) a sprint.
- [ ] C. **All at the sprint's review.** Pull requests stay open and stack on each other
  until review, then merge together. A later ticket branches from an earlier one's branch.
- [ ] D. Something else: ______

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
