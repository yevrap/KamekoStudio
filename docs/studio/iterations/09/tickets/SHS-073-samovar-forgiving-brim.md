# SHS-073 — Samovar: a hair over the brim costs a star, not the cup, and the best evening shows from the start

- **Status:** Done
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

- [x] **Rules.** A cup over the brim by up to 8 % of its volume scores its stars less one
      (never below 0) and is judged `drip`; over 8 % is a spill and scores 0. Rules tests at
      100 %, just over 100 %, 108 % and just over 108 %, with the strength matched and not.
- [x] A hold of either liquid that passes 108 % spills mid-hold and serves at once; a brew
      let go in the drip band serves at once (there is no room for water) and is judged
      like any drip.
- [x] **On the cup.** A browser hold that ends just over the brim (about 104 %) shows a drip
      running down the cup's side, scores one star less than its strength alone, and the
      result line says it went a drop over the brim. A spill shows tea over the cup's side,
      not only the words on the result card. Both visible at 320 and 390 in both themes.
- [x] **The best, from the start.** With a best evening saved, the first screen shows it
      before the first pour; with none saved, it shows no best. A first evening above 0 with
      none saved reads as a new best at its end. A browser test for each.
- [x] The design note ([samovar.md](../../../games/samovar.md)): the Fill line row says what the water's skill is now,
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

- **What changed:** (`571c385`) `constants.js` adds `DRIP_BAND` 0.08. `gameplay.js`:
  `overBrim` (any tea over the brim) and `spilled`, which now means over the brim by more
  than the drip band; `judge` gives a cup over the brim within the band the fill `drip`
  and one star less than its strength (never below 0), and `verdictLine` says *…, but a
  drop over the brim.* (a spill now reads *Spilled over the side*). `main.js`: a release
  over the brim serves at once, so a brew let go in the drip band serves as a drip with no
  water; the loop still spills a hold of either liquid mid-hold, now at 108 %. The tea over
  the brim is drawn outside the glass by `drawOverflow`, following the glass's profile
  4 px out from its wall, with an outline so a pale cup reads in both themes: a drip runs
  down the right side, 12–40 % of the glass's height as the level goes from just over to
  108 %, a drop hanging at its end, growing live while the button is held; a spill heaps
  the tea over the whole rim and runs it down both sides (`data-overflow` on the cup says
  which). The best evening sits under the running stars (`#best-now`, *best 17*) from the
  first screen, hidden with none saved; the end card says *A new best evening, your first!*
  for a first evening above 0, *A new best evening! The last best was N.* for a beaten
  one, and *No best evening yet* for a first evening of 0. The page's notes say the water
  is the easy part. Docs: the design note ([samovar.md](../../../games/samovar.md)): what it is, the hook, the Fill
  line row (the water's skill: 250 ms free, 200 ms at a star, then a spill; 450 ms
  against the brew's ±125 ms), the brim table as built, #51 and #54 done under the
  verdict, the tests; `studio/README.md`'s Samovar section and file table.

  **The brim as built**, the same on every cup: 90–100 % free (250 ms); over 100 % up to
  and including 108 % a drip, one star (200 ms); above 108 % a spill, 0 stars. The plan's
  table, unchanged.
- **Tested by:** `tests/studio/samovar.test.mjs`, 23/23 green in 125 s (4 new, 3
  extended). Rules: for every cup at 100 %, 100.5 %, 104 %, 108 % and 108.5 %, with the
  strength matched (3 / 2 / 2 / 2 / 0 stars), 7 points off (2 / 1 / 1 / 1 / 0) and far off
  (0 throughout: never below 0), the fill word, `overBrim` and `spilled`; the drip's and
  the spill's lines; a brew alone over the brim judged as a drip. Browser, by real
  pointer holds: a pour of brew then water to ~104 % at 320 and 390 lands in the drip
  band, scores exactly one star under what the same tea at the brim scores, says *a drop
  over the brim*, and draws a drip outside the right wall from the rim, at least 10 % of
  the glass's height, with at least 8 px of it above the result card, on screen; a brew
  held alone to ~104 % and let go serves at once with no water, as a drip; water held on
  after a 40 % brew spills with the button still down, at 108–115 %; the brew held on
  spills with the button down (the existing spill test, now checked mid-hold); a saved
  best (17) shows on the first screen before the first pour at 320 and 390, on screen,
  and none saved shows nothing; the full evening from empty storage ends *A new best
  evening, your first!* Layout, at 320×640 and 390×780 in both themes with every cup: the
  result card measured with the new longest line (*Just the strength they wanted, but a
  drop over the brim.*) still clears the glass's top 15 %, the button, the guest line and
  the swatch; a drip at 104 % is drawn outside the right wall only, and a spill at 112 %
  outside both walls, each with at least 8 px beside and above the card, on screen, and
  nothing scrolls sideways. `--stage=ticket` 5/5. Screenshots of a drip and a spill on
  every cup at 320 in both themes, and a brew held live into the drip band at 320 (light)
  and 390 (dark), composed into sheets on disk and looked at: the drip reads as tea
  running down the outside of the glass, the spill as tea over the rim and down both
  sides; the first sheet showed the spill's drops at the foot peeking out under the card
  as stray dots, so the spill has none. Not shown red first: these are new-feature tests,
  and the one old assertion they replace (a hair over the brim scores 0) is the rule this
  ticket changes.
  The first `--stage=push` was red on two things caught before anything left the machine:
  `hygiene` read a nested array literal opening with two brackets in `main.js` as a
  note-vault wikilink (the line now names the point first), and `commit-lint` found the
  code commit's subject at 88 characters (recommitted, unpushed, at 73). Green on the
  second run.
- **Deferred:** nothing beyond the ticket's out of scope.
- **Fix rounds used:** 0 / 2
