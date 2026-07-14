# Pachinko Bazaar — Playtest Notes

**Concept:** Peglin-style pachinko roguelike (roadmap p3-07 / vault concept C3) — drag to aim, release to drop an orb through a peg field; pegs score, the landing bucket multiplies the drop, escalating round quotas, and a coin-funded modifier shop ("the bazaar") between rounds. Balatro formula: familiar base mechanic + quotas + rule-breaking modifiers at the scoring layer.

**How it pauses:** pause-proof by construction between drops (nothing moves while aiming); mid-drop, losing tab/app focus freezes the orb and shows a Resume overlay. A dropped run costs at most one orb's flight (~5s).

**What this playtest should evaluate:**

- **Does the drop feel worth watching?** The physics + trails + particles are the core spectacle — if watching the orb rattle down is boring or reads as pure chance, the concept fails regardless of the meta layer.
- **Does aiming feel like a real decision?** You can aim at gold/mult clusters, but bounces dominate after the first rows. Is there enough agency, or does it need aim assists (trajectory preview, slower first bounce, flipper-style nudge)?
- **Is the quota/shop pacing right?** Quotas roughly follow ×1.45 per round (800 → 1,160 → 1,680 …); a run should die around round 5–8 in 5–10 minutes. Too fast, too slow, or too flat? Do the 7 bazaar items change how you aim, or just inflate numbers?

**Verdict line for the vault log:**
```
YYYY-MM-DD — pachinko-bazaar (draft) — keep|meh|kill — <why>
```
