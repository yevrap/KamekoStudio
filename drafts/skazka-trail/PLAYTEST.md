# Skazka Trail (Vasilisa the Beautiful) — Playtest Notes

**Concept:** pilot tale for a turn-based, choice-driven anthology of Slavic/Soviet-origin folk tales ([[Skazka Trail — Concept & Directions]], picks locked in [[Skazka Trail Questionnaire — Design Decisions]]). A "turn" is one narrated scene plus a 2–3 option choice — no timers, no reflexes, pausable by construction. Vasilisa's own trials drive a flag-based hybrid branch: Baba Yaga's three impossible chores (alone vs. leaning on the magic doll), the Three Riders on the road (pause to watch vs. hurry past — this accumulates a curiosity flag that later *gates* whether a forbidden question is even offered), and a closing honest-or-evasive answer to Baba Yaga's "how did you do this?" Three distinct endings, kept faithfully dark where the source is dark (Q6).

**Architecture note (deliberate, not an accident):** this draft is `index.html` + `engine.js` (reusable) + `tales/vasilisa.js` (content pack), not the usual single inline-everything file — Q10 locked in a shared engine so future tales can plug in as a new `tales/<name>.js` with zero engine changes.

**Q12 build — seeing the branches:**
- `?debug=1` opens a plain dev view of the full story graph: every node, its choices, flag deltas, gating conditions, and a structural lint (unreachable nodes, dead ends, broken links).
- `📜 Story so far`, visible in the toolbar throughout play, opens an in-fiction recap of every choice made this run — the same recap also appears automatically on the ending screen.

## What this playtest should evaluate

1. **Does a real choice actually feel like it mattered?** The three chores (alone vs. doll) change Baba Yaga's closing question; the three Riders (watch vs. hurry) silently decide whether the dangerous "ask about the hands" option even appears later. Does that gating read as earned once you notice it, or is it too invisible to register on a first play?
2. **Do the three endings feel genuinely distinct, not just relabeled?** "Blessing's Fire" (honest + didn't pry), "The Bargain Kept" (lied but kept the bargain — the doll goes silent after), "The Price of Prying" (asked the forbidden question — the dark one, unsoftened per Q6). Worth playing to at least two different endings to compare.
3. **Bare text, phone-comfortable — does it read well with zero visual theming (Q7)?** Tap targets, line length, restart flow.
4. **Are the debug view and story-so-far page actually useful, or overbuilt/underbuilt for what you wanted?** You asked for "a way to see the branches" for testing and as in-fiction context — flag anything that's the wrong shape.

## Verdict line for the vault log

```
YYYY-MM-DD — skazka-trail (draft) — keep|meh|kill — <why>
```

A **keep** unblocks the promotion checklist (`docs/promotion-checklist.md`) and picking the anthology's next tale (deliberately left open per Q9).
