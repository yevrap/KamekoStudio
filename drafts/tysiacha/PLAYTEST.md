# Tysiacha (1000) — Playtest Note

3-player trick-taking card game (you + 2 AI): bid on how many points you'll win, take tricks, declare K+Q marriages to set trump and score bonuses, race to 1000. **Built for a player learning the rules from zero** — a 5-card how-to overlay on load, plus an always-on Coach bar that explains every decision (what's legal, what a marriage is worth, when a bid is risky). Tap a card once to raise it, twice to play.

## What to evaluate

- **Do the rules land?** After 2–3 deals with the Coach on, do bidding / following suit / marriages make sense — or is a specific rule still confusing? (Note which one — that's the next iteration.)
- **Is the Coach the right teaching tool?** Too chatty, too terse, or about right? Would you rather have a scripted first deal (forced tutorial hand) instead of contextual tips?
- **Session shape:** a match to 1000 takes ~8–12 deals. Right target, or should the draft default to 500 / best-of-5-deals? Are the AI opponents challenging enough to keep playing?

Simplifications in this draft (fine to judge without them): no barrel-at-880, no bid re-raise after the talon, no bolts/penalties, exact scores (no rounding), talon revealed to all.

## Verdict line (append to vault → Kameko Playtest Log)

```
YYYY-MM-DD — tysiacha (draft) — keep|meh|kill — <why>
```
