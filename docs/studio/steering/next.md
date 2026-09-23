# Shadow Studio — Next step

**Next:** `close` — sprint 06's gate and publish
**Say:** `studio next` (in a new session)

| | |
|---|---|
| Epic | E1 · The Studio Wing opens · sprint 2 of 3 (+1 reserve, unclaimed) |
| Sprint | 06 · power-ups on the river, and ticket numbers you can click |
| Steps | plan ✓ · build ✓ ([SHS-059](../iterations/06/tickets/SHS-059-ticket-mentions-link-to-tickets.md) ✓ → [SHS-060](../iterations/06/tickets/SHS-060-river-run-power-ups.md) ✓ → [SHS-061](../iterations/06/tickets/SHS-061-river-run-tone-start-time.md) ✓) · review ✓ · **close ▶** · retro |
| Waiting on you | Nothing blocks. The fork is live to play: https://yevrap.github.io/KamekoStudio/studio/games/river-run/ |

## Notes for the next session

- Both reviewers approved with findings; no second round. [review.md](../iterations/06/review.md) has the
  verdicts and findings. Close still has to write its **In plain words**, **Demo** and
  **Keep / Iterate / Kill** sections, which are placeholders now.
- Gate: `--stage=gate --base=studio-iteration-05`. The review added `8a7a604` (spread
  shot's shot pool, live), `c361b17` (link lib header) and the arcade `docs:` `6911474`
  (🐞 p0-17).
- For Keep / Iterate / Kill on the power-ups: the HUD's seconds are frames ÷ 60 (QA F5,
  declined for now), and the HUD covers the score on narrow phones (#35).
- Production River Run freezes on restart until reload (IR 1): backlog #33 goes first in
  sprint 07's plan unless the arcade has shipped 🐞 p0-17. #37 is its deterministic test.
- The next new backlog item is #38, the next ticket SHS-063.

*Rewritten by every session (the studio-iteration skill). Loaded into every new Claude Code
session by the SessionStart hook in `.claude/settings.json`.*
