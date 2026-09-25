# SHS-072 — Samovar: three glasses of different shapes, each filling in the same time

- **Status:** Done
- **Size:** M
- **Iteration:** 09
- **Role lead:** Game Designer (Frontend Developer builds)
- **Depends on:** none
- **Branch:** none — trunk-based, commits to `main` (ADR-0007)

## Motivation

Sprint 08's review found that Samovar's cups don't change the decision: with one shape for
every cup, a three-star brew stops at the same share of each cup's height (IR08-1), and the
Playtester's Iterate on [SHS-068](../../08/tickets/SHS-068-samovar-core.md) found the small cup about twice as hard, with the
result card hiding the tall glass's rim. This ticket takes backlog #53 on
[Q15](../../../steering/questionnaire.md)'s ⭐ A (cups of different shapes) together with #52 (the same fill time on every
cup, and a result card that leaves the rim in view), which on its own would make the cups
identical.

## Design hypothesis, with its numbers (worked out at plan)

**The cups:** a straight tea glass (constant width), a tulip glass (a wide belly low down,
narrowing to a waist at about 80 % of its height, with a slight flare at the rim) and a
wide bowl (its foot half as wide as its rim, widening evenly). The plan's working profiles,
as the glass's half-width against its height from foot (0) to rim (1): straight `1`,
tulip `1 − 0.42 · sin(π·h / 1.6)`, bowl `0.5 + 0.5·h`. Volume is the sum of the
cross-sections, so the level climbs slowly where the glass is wide and quickly where it is
narrow.

**Every cup fills from empty to the brim in 2.5 s**, so for one strength the hold is the
same on every cup and so is its window:

| Strength | Brew hold (any cup) | Straight glass: stop at | Tulip | Bowl |
|---|---|---|---|---|
| Light, 25 % | 0.63 s | 25 % of its height | 14 % | 40 % |
| Golden, 40 % | 1.00 s | 40 % | 25 % | 56 % |
| Amber, 55 % | 1.38 s | 55 % | 39 % | 69 % |
| Dark, 70 % | 1.75 s | 70 % | 56 % | 81 % |
| The dashed line (90 % of the volume) | 2.25 s | 90 % | 86 % | 94 % |

Stops assume a cup topped up to the brim; filling to the dashed line instead lowers each
stop by a tenth of its volume. Between any two cups the stop for one strength is at least
11 points of the cup's height apart (straight against tulip, Light; straight against bowl,
Dark).

| Window, in time | Before (80 units/s) | After (2.5 s a cup) |
|---|---|---|
| Three stars on strength | ±75 ms small cup, ±112 ms teacup, ±162 ms tall glass | ±125 ms on every cup |
| The fill band (90–100 % of the brim) | 150 / 225 / 325 ms | 250 ms on every cup |

**What the player learns:** while the brew pours, the liquid is pure brew colour and its
level is the only cue, so the right place to stop is a different height on each glass:
about half-way up a straight glass for Amber, well under half-way in the tulip, two thirds
of the way up the bowl. **What the numbers don't give:** the hold for one strength is the
same on every cup, so a player who counts seconds could ignore the shape. We accept that:
the windows are fair only if the times match (the Playtester's ask), and counting to
±125 ms is harder than reading a level. The Playtester is asked at review whether players
watch the glass or count, and whether the shapes read as the thing to learn.

**It is better than sprint 08 if** no cup is much harder than another, and a player's
misses on the tulip and the bowl shrink across an evening as they learn where each one's
stop sits. **It is not** if the shapes feel arbitrary, or the liquid's level can't be read
in the tulip's narrow top at 320 wide.

## Acceptance criteria

- [x] The three cups are a straight tea glass, a tulip glass and a wide bowl, each drawn
      from one profile in `constants.js` that both the drawing and the rules read: the
      shape on screen is the shape the volume is computed from.
- [x] A pure function maps a cup's volume share to its height share and back: 0 to 0, 1 to
      1, rising, and its inverse returns the input within 0.5 %. Rules tests cover each cup.
- [x] For every strength, the three-star brew stop's height differs by at least 10 % of the
      cup's height between any two cups (a rules test over all four strengths and all three
      pairs of cups); the Result gives the table as built.
- [x] Every cup fills from empty to the brim in the same time, within 5 % (a rules test),
      and the pour still follows elapsed real time: the browser test at two frame rates
      still holds.
- [x] The liquid is drawn in the cup's shape, its surface at the height the profile gives
      for the volume poured (a browser check on each cup at a known volume, within 3 % of
      the cup's height), and the dashed fill line sits at 90 % of that cup's volume.
- [x] At 320 and 390 wide, in both themes, with every cup: the result card doesn't
      overlap the cup's top 15 % (rim and dashed line in view), and the cup, swatch, guest
      line and button are on screen without overlapping; the button stays ≥ 44 px in the
      bottom third.
- [x] A full evening poured to each guest's ratio by real pointer holds still scores 30 of
      30, and a spill still scores 0 (the existing browser tests, updated to the new
      cups).
- [x] The design note ([samovar.md](../../../games/samovar.md)): the hook says what the player learns now, the Cups
      and Pour rate rows carry the table above as built, and the hypothesis above is
      recorded as sprint 09's.

## Evidence plan

`tests/studio/samovar.test.mjs`: new rules tests for the profile, the stops and the fill
time; the browser tests extended for the liquid's surface, the dashed line and the result
card's box at both widths. `--stage=ticket` green. Screenshots of each cup at 320 (light)
and 390 (dark), saved to disk and looked at once, not kept in context. The Playtester
judges the hypothesis at review.

## Out of scope

The forgiving brim and the best on the first screen ([SHS-073](SHS-073-samovar-forgiving-brim.md)); a holder that hides the
brew (Q15 B); the evening's length and any second layer (sprint 10, on a Keep); sound; a
3D portal or the arcade gallery.

---

## Result

- **What changed:** (`fa2d4d0`) `studio/games/samovar/constants.js` gives each cup a
  `halfWidth(h)` profile, the plan's working ones unchanged (straight `1`, tulip
  `1 − 0.42 · sin(π·h / 1.6)`, bowl `0.5 + 0.5·h`), a `height` and an `aspect` for its
  look; every cup holds 100 units and `FILL_MS` is 2500, so `POUR_RATE` is 40 units/s.
  `gameplay.js` adds `volumeAtHeight` and `heightAtVolume`, pure: the volume below a
  height is the sum of round slices (area as the half-width squared), tabulated once per
  profile at 512 slices by Simpson's rule, both directions reading the same table.
  `main.js` draws the glass as an SVG from the same profile (open rim, a clip path for the
  tea, the dashed line wall to wall at 90 % of that glass's volume) and puts the surface at
  `heightAtVolume` of the volume poured; the stream stops at that surface. The result card
  sits low on the table, compact (swatches and stars in one row), so the rim and the
  dashed line stay in view. The cups are named *a tea glass*, *a tulip glass*, *a wide
  bowl*. The page's notes say what the player learns now. Docs: the design note
  ([samovar.md](../../../games/samovar.md)) has the hook's new paragraph, sprint 09's hypothesis, and the Pour rate,
  Cups, Star bands and Fill line rows as built; `studio/README.md`'s Samovar section.

  **The stops as built**, in % of the glass's height, for a cup topped up to the brim:

  | Strength | Straight | Tulip | Bowl | Closest pair |
  |---|---|---|---|---|
  | Light, 25 % | 25.0 | 14.5 | 40.1 | 10.5 (straight, tulip) |
  | Golden, 40 % | 40.0 | 25.3 | 56.1 | 14.7 |
  | Amber, 55 % | 55.0 | 38.9 | 69.3 | 14.3 |
  | Dark, 70 % | 70.0 | 56.3 | 80.7 | 10.7 (straight, bowl) |
  | The dashed line, 90 % | 90.0 | 85.5 | 94.0 | — |

  Every stop is within a point of the plan's table (the tulip's dashed line is 85.5, which
  the plan rounded to 86). Every cup fills in 2.5 s, so three stars on strength is
  ±125 ms and the fill band 250 ms on every cup.
- **Tested by:** `tests/studio/samovar.test.mjs`, 20/20 green in 101 s (6 new or
  extended). Pure: the three ids and profiles (straight constant, the tulip's belly, waist
  and flare, the bowl's foot at half the rim); for each cup `heightAtVolume` maps 0 to 0
  and 1 to 1, rises over 201 samples, and each direction inverts the other within 0.5 %
  (measured error ~1e-16); for all four strengths and all three pairs the stops are
  ≥ 10 % of the cup apart, and every stop is within a point of the plan's table; every cup
  fills in `FILL_MS` within 5 %. Browser: at 320×640 and 390×780, dark and light, with each
  cup, 60 % of its volume poured puts the drawn surface within 3 % of the cup's height of
  the profile's (the bowl would be 13 points off if drawn by volume alone), the dashed line
  within 3 % of 90 % of its volume; with the longest result line served ("… but short of
  the brim."), the card is on screen and clear of the cup's top 15 %, the button, the guest
  line and the swatch; the cup, swatch, guest line and button still don't overlap, the
  button ≥ 44 px in the bottom third, no sideways scroll. The existing browser tests, on
  the new cups: a full evening by real pointer holds scores 30 of 30, a brew held past the
  brim spills to 0, a 1 s hold pours 40 ± 3 units at a frame every 8 ms and every 33 ms.
  `--stage=ticket` 5/5. Screenshots of every cup mid-pour and with its result card, at 320
  (light) and 390 (dark), composed into one image and looked at once: the three shapes read
  apart, the tulip's waist is wide enough to read the level at 320, and the rim and dashed
  line show above every result card. Not shown red first: these are new-feature tests.
- **Deferred:** nothing beyond the ticket's out of scope. The result card was not split
  out: it landed in this ticket.
- **Fix rounds used:** 0 / 2
