# Pachinko Bazaar

> **Status: Arcade game — promoted July 14, 2026.**
> **Play it:** https://yevrap.github.io/KamekoStudio/games/pachinko-bazaar/
> Repo: `games/pachinko-bazaar/` · roadmap **p3-07 ✅** · promoted in v22
> Verdict + judgment calls: [Pachinko Bazaar Questionnaire — Verdict & Direction](../../archive/questionnaires/pachinko-bazaar-verdict-and-direction.md) · ideas: [Improvements](ideas.md)

## What it is

The **C3 pick** from [Kameko Studio — New Game Directions (July 2026)](../../planning/new-game-directions.md): a Peglin-style **pachinko roguelike** — the one concept that double-counts as the fast-physics itch *and* the Balatro-style mechanic blend. The blend lives at the scoring layer (familiar base mechanic + escalating quotas + rule-breaking modifiers), deliberately *not* a genre mash — that was the Lab lesson from the durak-likes.

## How it plays

- **Drag to aim, release to drop.** An orb falls through a 60-peg field with real physics (gravity, bounces, a touch of jitter so nothing stalls forever).
- **Pegs score:** blue +10 · gold +40 · purple adds +1 to the whole drop's multiplier · green pays coins. Each peg scores once per drop.
- **Buckets multiply:** the slot you land in (×1/×2/×5/×2/×1) multiplies the entire drop. Aiming the *landing*, not just the first bounce, is the skill.
- **Quota rounds:** beat the round's score quota (800 → 1,160 → 1,680 → … roughly ×1.45) within 5 orbs or the run ends. Clearing early converts leftover orbs to bonus coins.
- **The bazaar:** between rounds, 3 of 9 modifiers are offered for coins — Split Orb (gold pegs split your orb), Magnet, Extra Orb, Golden Touch, Heavy Orb (+1 all buckets), Bouncy, Coin Doubler, plus **Ghost Orb** and **Peg Upgrader** (added at promotion). Each is a one-time purchase.
- A run is 5–10 minutes; in testing an unaided run died around round 4, so items + aim should carry a good run to round 6–8.

## Design decisions and why

- **Quota-per-round, not endless score** — gives every drop a stake and produces the Balatro "one more round" arc; pure high-score pachinko felt like a slot machine.
- **Bucket multiplier applied to the whole drop** — makes the *end* of the trajectory matter, which is where the little aiming agency there is lives.
- **Pegs score once per drop but keep colliding** — a stalled orb can't farm points, and dimmed pegs show what's spent.
- **Pause story (Q2=B honored):** static between drops by construction; mid-drop, losing focus freezes the orb under a Resume overlay. A dropped run costs one orb flight at most.
- **2D canvas, no Three.js (Q6=C judgment call):** glow, trails, particles, floating score text carry the spectacle; 3D would buy little for a top-down peg board.
- **Early-clear ends the round immediately** with leftover orbs converted to coins — keeps pace up and makes "clear with orbs to spare" a strategy.

## Known simplifications / cut scope

Sound and persistent best-run both shipped at promotion (`f5434bb`) — see [Improvements](ideas.md) for the open list. Still cut: no orb types yet (Peglin's per-drop orb choice — Q3 of the Arcade Polish questionnaire is now **answered**: this is the wanted direction and the next feature sprint), fixed peg grid every round (Q4=A: decided against layout variety for now), no RU localization (Q5=A: decided against, don't need it), two shop items cut (Wide Center, Second Chance), quota curve untuned past round 4.

## What happens next

**Promoted 2026-07-14** — the verdict/promotion loop above is done; [Pachinko Bazaar Questionnaire — Verdict & Direction](../../archive/questionnaires/pachinko-bazaar-verdict-and-direction.md) is answered and archived. Open now: [Pachinko Bazaar Questionnaire — Arcade Polish](../../questionnaires/pachinko-bazaar-arcade-polish.md) — Q3–Q6 answered (per-drop orb types wanted, static board is fine, deep feature sprint before moving on), **Q1 (physics/aim-assist feel) and Q2 (audio/juice) still need a play session** before the next sprint is agent-shippable.
