# SHS-072 — Samovar: three glasses of different shapes, each filling in the same time

- **Status:** Ready
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

- [ ] The three cups are a straight tea glass, a tulip glass and a wide bowl, each drawn
      from one profile in `constants.js` that both the drawing and the rules read: the
      shape on screen is the shape the volume is computed from.
- [ ] A pure function maps a cup's volume share to its height share and back: 0 to 0, 1 to
      1, rising, and its inverse returns the input within 0.5 %. Rules tests cover each cup.
- [ ] For every strength, the three-star brew stop's height differs by at least 10 % of the
      cup's height between any two cups (a rules test over all four strengths and all three
      pairs of cups); the Result gives the table as built.
- [ ] Every cup fills from empty to the brim in the same time, within 5 % (a rules test),
      and the pour still follows elapsed real time: the browser test at two frame rates
      still holds.
- [ ] The liquid is drawn in the cup's shape, its surface at the height the profile gives
      for the volume poured (a browser check on each cup at a known volume, within 3 % of
      the cup's height), and the dashed fill line sits at 90 % of that cup's volume.
- [ ] At 320 and 390 wide, in both themes, with every cup: the result card doesn't
      overlap the cup's top 15 % (rim and dashed line in view), and the cup, swatch, guest
      line and button are on screen without overlapping; the button stays ≥ 44 px in the
      bottom third.
- [ ] A full evening poured to each guest's ratio by real pointer holds still scores 30 of
      30, and a spill still scores 0 (the existing browser tests, updated to the new
      cups).
- [ ] The design note ([samovar.md](../../../games/samovar.md)): the hook says what the player learns now, the Cups
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

*Filled in as the ticket is worked. Empty until then.*

- **What changed:**
- **Tested by:**
- **Deferred:** (each item also filed as a ticket or a debt row)
- **Fix rounds used:** 0 / 2
