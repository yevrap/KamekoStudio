# SHS-073 — Samovar: a hair over the brim costs a star, not the cup, and the best evening shows from the start

- **Status:** Ready
- **Size:** M
- **Iteration:** 09
- **Role lead:** Game Designer (Frontend Developer builds)
- **Depends on:** [SHS-072](SHS-072-samovar-cup-shapes.md) (the fill time the numbers below assume)
- **Branch:** none — trunk-based, commits to `main` (ADR-0007)

## Motivation

The Playtester's Iterate on [SHS-068](../../08/tickets/SHS-068-samovar-core.md): any overfill zeroed the cup, even with the colour
matched, so a first evening with an ordinary release lag scored 0 of 30, and the review
found the fill band no easier than the brew (IR08-2). Its smaller notes: the best evening
shows only at the end, and a first best above 0 isn't celebrated. Backlog #51 and #54.

## Design hypothesis, with its numbers (worked out at plan)

The Playtester measured a release lag of 150–200 ms. With every cup filling in 2.5 s
([SHS-072](SHS-072-samovar-cup-shapes.md)), that is 6–8 % of any cup. So the drip band is **8 % of the cup's volume above the
brim** (200 ms), not the 5 % backlog #51 first proposed: at 5 %, a player who lets go when
the level reaches the brim still spills, which is the first-evening zero again.

| Where the water stops | Share of the cup | Time in it (any cup) | Costs |
|---|---|---|---|
| The fill band, dashed line to brim | 90–100 % | 250 ms | nothing |
| The drip band, just over the brim | 100–108 % | 200 ms | one star, and a drip shows down the side |
| Over the drip band | above 108 % | — | the cup: a spill, 0 stars, tea over the side |

A player who lets go when the level reaches the dashed line, 200 ms late, lands at 98 %:
full, no loss. One who lets go at the brim, 150–200 ms late, lands at 106–108 %: a drip,
one star less, and a lesson about stopping early rather than a zero. The water stays the
smaller skill: 450 ms before a spill against ±125 ms for three stars on the brew.

## Acceptance criteria

- [ ] **Rules.** A cup over the brim by up to 8 % of its volume scores its stars less one
      (never below 0) and is judged `drip`; over 8 % is a spill and scores 0. Rules tests at
      100 %, just over 100 %, 108 % and just over 108 %, with the strength matched and not.
- [ ] A hold of either liquid that passes 108 % spills mid-hold and serves at once; a brew
      let go in the drip band serves at once (there is no room for water) and is judged
      like any drip.
- [ ] **On the cup.** A browser hold that ends just over the brim (about 104 %) shows a drip
      running down the cup's side, scores one star less than its strength alone, and the
      result line says it went a drop over the brim. A spill shows tea over the cup's side,
      not only the words on the result card. Both visible at 320 and 390 in both themes.
- [ ] **The best, from the start.** With a best evening saved, the first screen shows it
      before the first pour; with none saved, it shows no best. A first evening above 0 with
      none saved reads as a new best at its end. A browser test for each.
- [ ] The design note ([samovar.md](../../../games/samovar.md)): the Fill line row says what the water's skill is now,
      with the table above as built; the verdict section lists #51 and #54 as done.

## Evidence plan

`tests/studio/samovar.test.mjs`: the rules cases above; browser holds for a drip, a spill
past the band and the best on the first screen (seeded `studio_samovar_best`) and at the
end of a first evening. `--stage=ticket` green. A screenshot of a drip at 320 and 390,
saved to disk and looked at once.

## Out of scope

The cup shapes and the fill time ([SHS-072](SHS-072-samovar-cup-shapes.md)); a sound for the drip; the evening's length and
any second layer (sprint 10, on a Keep).

---

## Result

*Filled in as the ticket is worked. Empty until then.*

- **What changed:**
- **Tested by:**
- **Deferred:** (each item also filed as a ticket or a debt row)
- **Fix rounds used:** 0 / 2
