# Shadow Studio — Next step

**Next:** `review` — sprint 09's one round: QA, the Independent Reviewer and the Playtester
**Say:** "run the studio" (the whole sprint, watched), or `studio next` (this one step, in a new session)

| | |
|---|---|
| Epic | E2 · The studio's first original game worth playing · sprint 2 of 3 (+1 reserve, unclaimed) |
| Sprint | 09 · Samovar, second pour: glasses of their own and a forgiving brim ([plan.md](../iterations/09/plan.md)) |
| Steps | plan ✓ · build [SHS-072](../iterations/09/tickets/SHS-072-samovar-cup-shapes.md) ✓ · build [SHS-073](../iterations/09/tickets/SHS-073-samovar-forgiving-brim.md) ✓ · build [SHS-074](../iterations/09/tickets/SHS-074-skill-describes-pull-requests.md) ✓ · review · close · retro |
| Waiting on you | Nothing blocks. Q15 took its ⭐ (shapes) and Q17 its ⭐ (a pull request merges at the end of its build; ADR-0011 §5 is yours to align, see the note under Q17); tick either in the [questionnaire](questionnaire.md) to overturn it. Q16 waits for your tick and blocks nothing |

## Notes for the next session

- Sprint 09 was built on trunk, so its review has no pull request to post on; the skill's
  new flow starts at plan 10, and #50 rides on sprint 10's first games ticket.
- Samovar at review: the brim is 250 ms free, 200 ms at a star (a drip, `data-overflow`
  on `#cup`), then a spill; the Playtester is asked whether a first evening still scores
  near 0 and whether players watch the glass or count seconds ([SHS-072](../iterations/09/tickets/SHS-072-samovar-cup-shapes.md)).
- [SHS-074](../iterations/09/tickets/SHS-074-skill-describes-pull-requests.md) changed one criterion at build (ADR-0011 is executive-only) and found
  that a production fix can't take a pull request until backlog #56; both are in its Result.
- Screenshots: save to disk, compose into one image, look once (retro 08); retro 09 checks
  review's writes ($3.43 in 08) and the Playtester's writes and reads ($1.97).
- The next new backlog item is #57, the next ticket SHS-076.

*Rewritten by every session (the studio-iteration skill). Loaded into every new Claude Code
session by the SessionStart hook in `.claude/settings.json`.*
