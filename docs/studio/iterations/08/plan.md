# Iteration 08 — the studio's first original game, poured by the cup

**Epic:** E2 · The studio's first original game worth playing · **sprint 1 of 3 (+1
reserve, unclaimed)**. Adopted at this plan from *Proposed next epic*; the executive did
not strike or change it.

**Sprint goal:** you can play *Samovar*, the studio's first original game, on your phone
from the realm's shelf (one evening of ten guests, pouring each cup's tea by feel), and
spot the River Run fork's power-ups from far up the river.

## Tickets

| # | ID | Title | Type | Size | Source |
|---|---|---|---|---|---|
| 1 | [SHS-068](tickets/SHS-068-samovar-core.md) | Samovar: pour tea for an evening of guests, the core mechanic playable on a phone | feature | M | E2 ([Direction](../../steering/direction.md)) · backlog #48 · Q14 ⭐ |
| 2 | [SHS-069](tickets/SHS-069-river-run-power-ups-read-at-a-glance.md) | River Run fork: a far-off pickup is easy to spot, and the power-up label keeps one height | feature | M | The Playtester's notes on [SHS-060](../06/tickets/SHS-060-river-run-power-ups.md) and [SHS-064](../07/tickets/SHS-064-river-run-power-up-hud-real-time.md) · backlog #42 + #44 |
| 3 | [SHS-070](tickets/SHS-070-checks-accept-studio-branches.md) | The studio's checks accept a ticket branch and a squash-merged pull request | process | S | Executive, [ADR-0011](../../decisions/ADR-0011-the-studio-runs-itself.md) §4–5 · backlog #40, part 1 of 3 |
| — | [SHS-071](tickets/SHS-071-iteration-record.md) | This iteration's record | docs | S | Ceremony commits |

Three planned tickets, at the cap. Two change what a player sees or plays (a new game, the
fork's power-ups). [SHS-070](tickets/SHS-070-checks-accept-studio-branches.md) is the one ticket on the studio's own machinery.

**Why #42 and #44 are one ticket.** Both are the Playtester's notes on how the fork's
power-ups read, both touch the same few lines of the fork's `index.html` and its layout
subtest, and each is S. If the session can't hold both, the far-off pickup lands first.

**How #40 splits.** Its criteria had four parts; one is already met (the skills exception
landed as [SHS-065](../07/tickets/SHS-065-studio-edits-its-own-workflow.md)). What is left: the checks accept a branch and a squash
merge (this sprint, [SHS-070](tickets/SHS-070-checks-accept-studio-branches.md)); the skill's build and review steps describe the
flow and ADR-0007 is marked superseded (new #49); one real ticket ships through a merged
pull request with CI green (new #50). The team keeps working on `main` until #49.

**Order.** The game first: it is the epic, and the sprint's biggest risk. The fork second.
The checks last, so a change to `on-main` can't disturb this sprint's own pushes until the
last build.

## Three pitches

The Game Designer's pitches for E2's first game. The brief the studio reads for taste
([`docs/brief.md`](../../../brief.md)): one player on a phone, five minutes at a time, warmth
and cultural roots over deep strategy, taught in the game, and never a copy of a game
named as a reference. The pick is Q14 in the [questionnaire](../../steering/questionnaire.md),
built on its ⭐.

**A. Samovar ⭐.** An evening of guests at the tea table. Each brings a cup of a different
size and wants their tea at a strength shown as a colour. Hold to pour the dark brew,
release; hold again to top up with hot water, release to serve. Strength is the ratio, so
the whole game is one estimate per cup: how long to pour the brew for *this* cup, before the
water fixes it. Too much and it overflows; too little and it's weak or short of the brim.
*Hook:* two liquids and a hidden ratio against a brim, where pour-the-drink phone games
fill one liquid to a line. *Fun if* a player's misses shrink across an evening and they
pour another. *Why first:* one thumb, one button, readable at a glance, warm, and small
enough for one session.

**B. Nest.** Nesting dolls arrive one at a time; three stacks on the table, each showing
only its outermost doll. A doll closes around a stack only if it is bigger than the one
showing, and a stack scores when it holds a full set with no size missing, so you have to
remember what each stack hides. *Hook:* a memory game where the thing to remember is
inside the thing you see. *Risk:* needs teaching, and the fun is in the third or fourth
minute, not the first.

**C. Ice hole.** Winter fishing through a hole in the ice. You jig the line with your thumb
(short flicks, slow lifts, pauses), and each kind of fish answers a different rhythm; a
bite shows only as a twitch of the rod tip, and you strike on the twitch. *Hook:* the lure
is a rhythm you choose, and the bite is read, not signalled. *Risk:* its fun depends on
feel and animation that one session is unlikely to get right.

## Verdicts acted on

Sprint 07's player-visible items both have the Playtester's **Keep** in
[07's review](../07/review.md) ([SHS-064](../07/tickets/SHS-064-river-run-power-up-hud-real-time.md), [SHS-066](../07/tickets/SHS-066-production-river-run-restart.md)), with two notes: the label's
height (#44) and the spread shot's shots (#45). #44 is in [SHS-069](tickets/SHS-069-river-run-power-ups-read-at-a-glance.md); #45 waits. No verdict
issue from the executive was open.

## What will be visible

- `studio/` (the realm): a new card, *Samovar*, `PROTOTYPE`, opening
  `studio/games/samovar/`: an evening of ten guests, one pour button, stars per cup and the
  best evening kept.
- `studio/games/river-run/` (and the River Run portal on `3d.html`): a pickup far up the
  river is big or glowing enough to steer for at 320 and 390 wide, and the power-up label
  no longer jumps in height.
- For the reader: the checks accept a `studio/SHS-NNN-slug` branch and a squash-merged pull
  request, ready for the new flow.

## Risks

| Risk | Response |
|---|---|
| Samovar outgrows one session | Core only, as the ticket's out-of-scope says; if it grows, the evening loop and the judging land first, and the end screen or the design note go back to the backlog |
| The colour match can't be read on a phone, so the hypothesis fails for a reason that isn't the mechanic | The result shows the wanted and the poured colour side by side; both themes and both widths are criteria |
| A pour rate tied to frames makes a 120 Hz phone pour twice as fast (Active rule 9) | A criterion: pour rates from elapsed time |
| Changing `on-main` breaks the sprint's own pushes | Built last; red first on a scratch repository; `--stage=push` green on `main` is its evidence |
| The Playtester's screenshots are the biggest cache cost of a sprint (issue #4) | The tickets ask for screenshots read back once, not kept; the retro weighs the rest |

## Out of scope

- Samovar's second layer (progression, guest personalities, modes): sprint 10 at the
  earliest, and only on a Keep.
- A 3D portal for Samovar (production, `shared/3d/`), and promotion to the arcade.
- New River Run experiments (#6, #7, #23), the spread shot's shots (#45).
- The skill and ADR changes for branches and pull requests (#49), a ticket through a real
  pull request (#50), the steering-edit commit form (#21).
- The executive's two `feedback` issues (#3, #4): the retro acts on them (direction rule 8).
