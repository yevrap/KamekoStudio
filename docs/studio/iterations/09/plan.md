# Iteration 09 — Samovar, second pour: glasses of their own and a forgiving brim

**Epic:** E2 · The studio's first original game worth playing · **sprint 2 of 3 (+1
reserve, unclaimed)**. The epic's suggested shape for 09: act on the Playtester's verdict.

**Sprint goal:** you can play Samovar's second pass on your phone: three tea glasses of
different shapes that each fill in the same time, so each one's right stop sits at a
different height; a hair over the brim costs a star and shows a drip instead of emptying
the cup; and your best evening is on the first screen.

## Tickets

| # | ID | Title | Type | Size | Source |
|---|---|---|---|---|---|
| 1 | [SHS-072](tickets/SHS-072-samovar-cup-shapes.md) | Samovar: three glasses of different shapes, each filling in the same time | feature | M | The Playtester's Iterate on [SHS-068](../08/tickets/SHS-068-samovar-core.md) · IR08-1 · backlog #53 on Q15's ⭐ + #52 |
| 2 | [SHS-073](tickets/SHS-073-samovar-forgiving-brim.md) | Samovar: a hair over the brim costs a star, not the cup, and the best evening shows from the start | feature | M | The Playtester's Iterate on [SHS-068](../08/tickets/SHS-068-samovar-core.md) · IR08-2 · backlog #51 + #54 |
| 3 | [SHS-074](tickets/SHS-074-skill-describes-pull-requests.md) | The skill's build and review steps describe the branch and pull-request flow | process | S | Executive, [ADR-0011](../../decisions/ADR-0011-the-studio-runs-itself.md) §5 · backlog #49 (#40, part 2 of 3) |
| — | [SHS-075](tickets/SHS-075-iteration-record.md) | This iteration's record | docs | S | Ceremony commits |

Three planned tickets, at the cap. Two change what a player sees or plays, both Samovar,
because the epic's second sprint acts on its verdict. [SHS-074](tickets/SHS-074-skill-describes-pull-requests.md) is the one ticket on the
studio's own machinery.

**Why four backlog rows make two games tickets.** #52 (the same fill time) makes the three
cups identical unless #53 (shapes) lands with it, and #52's other half, the result card
clear of the rim, has to be checked against the new shapes; so the two are one ticket. #51
(the brim) and #54 (the best on the first screen) are both S and both about how an evening
reads; one ticket. Each games ticket is an M.

**Numbers before the build** (retro 08). Both games tickets carry their design hypothesis
with the numbers per cup, worked out at this plan: the stop height for each strength in
each glass, and the time windows. Working them out changed two things. The drip band is 8 %
of the cup, not #51's 5 %: the Playtester's 150–200 ms release lag is 6–8 % of a cup
filling in 2.5 s, so at 5 % a player letting go at the brim would still spill. And the
shapes ticket says openly what the numbers don't give: with fair windows, one strength's
hold is the same on every cup, so a player who counts seconds could ignore the shape; the
Playtester is asked which players do.

**Order.** The shapes first: they change the core decision and set the fill time the
brim's numbers assume. The brim second. The skill last, so the new flow can't touch this
sprint's own builds; it starts at plan 10, and #50 rides on sprint 10's first games ticket.

## Verdicts acted on

Sprint 08's two player-visible items have the Playtester's verdicts in
[08's review](../08/review.md): **Iterate** on Samovar ([SHS-068](../08/tickets/SHS-068-samovar-core.md)), acted on by both games
tickets, and **Keep** on the River Run fork's pickups ([SHS-069](../08/tickets/SHS-069-river-run-power-ups-read-at-a-glance.md)), which needs nothing
more. No verdict issue from the executive was open, and neither verdict was struck.

## Decisions taken on their ⭐

- **Q15, what makes the cups different:** blank at plan, so ⭐ A, shapes, built as
  [SHS-072](tickets/SHS-072-samovar-cup-shapes.md). Ticking B or C in the [questionnaire](../../steering/questionnaire.md) before review turns it around.
- **Q14, E2's first game:** blank again at plan 09, so Samovar stands as E2's game; folded
  into the answered list.
- **Q17, when a pull request merges** (new): ⭐ A, at the end of its build on green CI and
  a green `push` stage, with the Independent Reviewer's verdict posted on it at the sprint's
  review. [SHS-074](tickets/SHS-074-skill-describes-pull-requests.md) writes the flow on it.

## What will be visible

- `studio/games/samovar/` (the realm's shelf): a straight tea glass, a tulip glass and a
  wide bowl, drawn in their shapes with the tea filling them; every cup takes the same
  time to fill; the result card leaves the rim in view; a drop over the brim shows a drip
  and costs one star; the best evening on the first screen.
- For the reader: the `studio-iteration` skill's build and review steps in the branch and
  pull-request flow, and ADR-0007 marked superseded.

## Risks

| Risk | Response |
|---|---|
| [SHS-072](tickets/SHS-072-samovar-cup-shapes.md) outgrows one session: a shaped cup in CSS, the liquid clipped to it, a pure profile and its inverse | The rules and the drawing first; if it grows, the result card's position goes back to the backlog as its own S |
| The tulip's narrow top makes the level unreadable at 320 wide | A criterion: every cup at 320 and 390 in both themes, surface within 3 % of the profile's height |
| Players count seconds and the shapes turn cosmetic | Said openly in the ticket; the Playtester is asked which it does; sprint 10 acts on the answer |
| A wide drip band makes the brim meaningless | It costs a star, and the numbers are in the ticket: 250 ms free, 200 ms at a star, then a spill |
| The skill edit changes the flow mid-sprint | Built last, and the flow starts at plan 10 |

## Out of scope

- Samovar's second layer (progression, guests, modes) and the evening's length: sprint 10,
  and only on a Keep.
- A holder that hides the brew (Q15 B); a sound for the pour or the drip.
- A 3D portal for Samovar (production, `shared/3d/`), and promotion to the arcade.
- River Run fork work (#45, #8, #31, #37): its last verdict was Keep, and E2's slots go to
  Samovar this sprint.
- A ticket through a real pull request (#50, sprint 10); the steering-edit commit form
  (#21, next in the process slot after #49).
