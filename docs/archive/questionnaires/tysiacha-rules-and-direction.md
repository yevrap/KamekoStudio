# Tysiacha Questionnaire — Rules and Direction

> **Archived July 12, 2026 — fully answered and consumed.** The keep verdict promoted the draft (2026-07-09); every answer shipped (coach-off default, 500 target, classic rules toggles, Russian, difficulty setting, log design Q8–Q11). Successor for new decisions: [Tysiacha Questionnaire — Open Decisions (July 2026)](tysiacha-open-decisions-july-2026.md).

> Fill this in after playing a few deals of https://yevrap.github.io/KamekoStudio/drafts/tysiacha/ (~5 min). The next Kameko session reads it together with your [Kameko Playtest Log](../../playtest-log.md) verdict and turns the answers into the next iteration (or the promotion). Overview of what was built: [Tysiacha (1000)](../../games/tysiacha/README.md).

## Q1 — Verdict

- [x] **keep** — promote it to the arcade (module split, tests, tokens, arcade card)
- [ ] **meh** — one more draft iteration first; what to change: 
- [ ] **kill** — not my game; the lesson for future jams: 

## Q2 — Did the game teach you the rules?

After 2–3 deals with the Coach on:

- [ ] Yes — I get bidding, tricks, and marriages now
- [ ] Mostly — but this rule is still confusing: 
- [ ] No — I was lost; I'd rather have a **scripted tutorial first deal** than tips
- [ ] The Coach is too chatty — same info, fewer words
- [x] i don't have time now but i want the game to default to coach off and if you know how to play, you just play. when turning on coach mode i don't want it to restart the game but he like a hint toggle for when you don't know what is going on. I want the rules clearly available somehow in the game as well

## Q3 — Session shape

A match to 1000 takes ~8–12 deals (~15–25 min).

- [ ] 1000 is right — it's the name of the game
- [x] Default to 500 (quick match), 1000 as an option
- [ ] Best-of-N-deals mode (no point target) — N: 
- [ ] Single-deal mode too (one deal, done — good for a quick session)

## Q4 — Rules authenticity (check any to add next)

- [ ] Barrel at 880 (classic endgame tension)
- [ ] Bolts — penalty for zero-trick deals
- [ ] Classic score rounding (nearest 5/10)
- [ ] Declarer may re-raise after seeing the talon
- [ ] Hide opponents' running points (classic; maybe as a toggle)
- [ ] Keep it simplified — the draft's ruleset is the game
- [x] I don't know the rules but i want all of the game features to be implemented, documented in game and in the docs, and to have an option to toggle settings and rules that make sense.

## Q5 — Language

- [ ] English as-is
- [x] Russian toggle (Тысяча, масти, хвалюсь…) - yes and i want the rules and help in russian too
- [ ] Bilingual labels while learning (Russian terms with English hints)

## Q6 — The AI opponents

- [ ] About right for learning
- [ ] Too easy — I want to be punished for bad bids
- [ ] Too hard / feels unfair (say where): 
- [ ] Give them personalities (one cautious, one aggressive)
- [x] Make their ability a setting

## Q7 — Free space

Anything about the feel, layout, cards, colors, or a memory of how the game "should" play?

- 

---

# Game log & clarity (added 2026-07-09)

> From the game-log planning session — design in [Tysiacha — Game Log & Clarity Design](../plans/tysiacha-game-log-and-clarity-design.md). Slice 1 (led marker, trick-result reasons, event stream) is unambiguous and doesn't wait on these. Defaults marked *(default)* are what ships if you leave a question blank.

## Q8 — Led-suit display

The plan marks the led card in the trick area. Should the status bar *also* name the led suit persistently?

- [ ] Led marker on the card is enough *(default — least clutter)*
- [x] Also extend the chip: `♣ led · no trump` next to the trump chip
- [ ] Other: 

## Q9 — Log scope

How far back should the 📜 log reach?

- [ ] Current deal only *(default — matches how the game resets)*
- [x] Whole match, grouped by deal
- [ ] Other: 

## Q10 — Hints in the log

Should coach hints appear in the log?

- [ ] Only when the hint bar is on *(default — coach off means coach silent)*
- [x] Always log them, so after a confusing moment you can check what coach *would have said*
- [ ] Never — log is for game events only

## Q11 — Trick pacing

Tricks sweep away 1.25s after the third card. Beyond the winner pulse:

- [x] Keep the current pace *(default — the log makes review possible without slowing play)*
- [ ] When the hint bar is on, wait for a tap before sweeping the trick
- [ ] Slow the sweep a bit for everyone (~2s)

---
*When done, leave it here — the next Kameko session reads it. Or kick one off with "I filled the tysiacha questionnaire."*
