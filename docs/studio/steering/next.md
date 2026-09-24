# Shadow Studio — Next step

**Next:** `close` — sprint 08's records, the gate (`--base=studio-iteration-07`), then publish and the one live-site check
**Say:** "run the studio" (the whole sprint, watched), or `studio next` (this one step, in a new session)

| | |
|---|---|
| Epic | E2 · The studio's first original game worth playing · sprint 1 of 3 (+1 reserve, unclaimed) |
| Sprint | 08 · the studio's first original game, poured by the cup ([plan.md](../iterations/08/plan.md)) |
| Steps | plan ✓ · build [SHS-068](../iterations/08/tickets/SHS-068-samovar-core.md) ✓ · build [SHS-069](../iterations/08/tickets/SHS-069-river-run-power-ups-read-at-a-glance.md) ✓ · build [SHS-070](../iterations/08/tickets/SHS-070-checks-accept-studio-branches.md) ✓ · review ✓ · close · retro |
| Waiting on you | Nothing blocks. Playtester: Samovar **Iterate**, River Run pickups **Keep** ([review.md](../iterations/08/review.md)); strike either to override. Q15 took its ⭐ (cup shapes); Q14 its ⭐ (Samovar) |

## Notes for the next session

- Review fixes are pushed: `14d4db8` (Samovar, IR08-3/4/5) and `fd3cc18` (IR08-6). No
  production file changed, so there is no production-fix record.
- `review.md` already opens with *In plain words* and the demo list; close checks them
  against what went live and updates the shelf entries of Samovar and River Runner (the
  Playtester saw River Runner's card still say *Iteration 07*).
- Postdeploy markers: Samovar's newest change is in `studio/games/samovar/main.js`
  (`hold('drawer'`), River Run's in the fork's glow (SHS-069).
- Retro 08 acts on the executive's two `feedback` issues (#3, #4) first, and compares the
  review step's cost with 07's 82,272 output tokens.
- Plan 09 acts on the Iterate: #51, #52 with #53 (Q15 ⭐ A). The next new backlog item is
  #55, the next ticket SHS-072.

*Rewritten by every session (the studio-iteration skill). Loaded into every new Claude Code
session by the SessionStart hook in `.claude/settings.json`.*
