# Iteration 09 — review

**Verdict:** Approve with findings (Independent Reviewer, `opus`, round 1 of 1)

QA (`sonnet`, round 1 of 1): **Verdict:** Approve. Every claim QA checked against the code
and a real local run held up, and it found no defect in [SHS-072](tickets/SHS-072-samovar-cup-shapes.md), [SHS-073](tickets/SHS-073-samovar-forgiving-brim.md) or [SHS-074](tickets/SHS-074-skill-describes-pull-requests.md).
Playtester (`opus`): **Iterate** on Samovar's glasses of three shapes, **Keep** on the
forgiving brim, **Keep** on the best evening from the first screen. Neither reviewer
rejected, so there is no second round.

The sprint was built on trunk (ADR-0007's last sprint; the pull-request flow starts at plan
10), so there is no pull request to post the Independent Reviewer's verdict on. The sprint
changed no production file, so there is no `reviews/<TICKET>.md` record. All three
reviewers returned.

## Keep / Iterate / Kill

> Since [ADR-0011](../../decisions/ADR-0011-the-studio-runs-itself.md) the Playtester's
> verdict is the one the team acts on. The executive may strike it and write their own;
> theirs overrides. Given at this review (2026-09-24), from a local build at phone width.

- **[SHS-072](tickets/SHS-072-samovar-cup-shapes.md), Samovar's glasses of three shapes, each filling in the same time — Iterate**
  (Playtester). The three glasses read as different shapes at 320 and 390: a straight
  glass, a bowl, and a "tulip" widest at its flat foot and narrowing to a waist near the
  top. The tulip's narrowest point is 101 px wide at 320, so its level stays readable; the
  bowl's dashed line sits 10 px under its rim at 320. Every glass fills in 2.5 s (a brew
  held past the brim served itself at 2.72 s), and on every glass the result card sat
  below the rim and the dashed line. **Play:** a player stopping the brew at the
  strength's share of the glass's height scored 14 of 30 on a first evening (tea glass 11
  of 12 stars, bowl 3 of 9, tulip 0 of 12, every tulip *Much too strong*). A player
  adjusting each glass's stop after the verdict line scored 21, 25, 29 at 390 and 20, 28,
  25 at 320; within the first evening the tulip's stop settled about 20 points lower and
  the bowl's about 10 higher. So the shapes can be learned and are not arbitrary. **What
  gets in the way:** with every cup filling in the same time, one strength's hold is the
  same on every glass. A player who never looked at the glass and counted the hold
  (strength × 2.5 s) scored 25 and 26 with 8 % timing noise and 23 with 15 %, which beats
  every first evening played by watching the level. The skill comes down to four hold
  times, and the page's own notes, which say every cup fills in the same time, hint at
  counting. Smaller: at 320 the first instruction wraps to three lines, so the glass sits
  21 px lower on the first guest than on the later ones; the tulip reads as a vase. **Its
  next step:** a flow per guest shown by the stream's thickness (**backlog #57**, on
  **[Q18](../../steering/questionnaire.md)** ⭐ A), and the glasses drawn true to their names (**#58**).
- **[SHS-073](tickets/SHS-073-samovar-forgiving-brim.md), part 1: the forgiving brim — Keep** (Playtester). Letting go at the dashed
  line, as the hint says, never spilled in about 80 cups. At a 180 ms release lag about 1
  cup in 8 went a drop over the brim; at a slow 260 ms lag 9 in 10 did, and still none
  spilled. Each of those lost exactly one star, with a thin drip down the glass's right
  side above the result card and *but a drop over the brim* on the card. The brim still
  matters: aiming at the rim instead of the line spilled 3 cups in 10, and a spill is plain
  to see (tea heaped over the rim and down both sides, × in the evening's strip, *Spilled
  over the side*). A brew held too long spills and serves itself, and a thumb still on the
  button did not start the next guest's brew. First evenings scored 8 to 25 of 30, not 0.
  The open drawer held the result card for 3.5 s and it carried on after the drawer closed.
  One copy note: with the strength also off, *Much too weak, but a drop over the brim*
  reads better with *and* (fixed now, below).
- **[SHS-073](tickets/SHS-073-samovar-forgiving-brim.md), part 2: the best evening from the first screen — Keep** (Playtester). A
  fresh profile shows nothing under the stars; after the first evening *best 25* appeared
  there, and stayed after *Pour again*, a reload, and leaving to the Studio and coming
  back. The end card says *A new best evening, your first!*, *A new best evening! The last
  best was 21.*, or *Best evening: 28.* when it wasn't beaten. The game wrote one key,
  `studio_samovar_best`. The best is small grey 12 px text, readable and never in the way,
  and with an evening of about 45 s it is what gives a second evening a target.

[SHS-074](tickets/SHS-074-skill-describes-pull-requests.md) can't be played, so it has no verdict.

### For the executive, on a real phone

The Playtester and the Independent Reviewer could not answer these from headless Chrome:

1. After two or three evenings, do you still watch the tulip's level, or have you fallen
   into a rhythm per colour? By script, counting wins; a real thumb may differ.
2. In the tulip a Light brew stops about 14 % of the way up, a layer about 40 px deep at
   320. Can you read that thin dark layer on the dark theme in daylight?
3. The drip band assumes a release lag of 150–200 ms, simulated in headless Chrome, not
   measured on a phone (IR09-2). Letting go when the level reaches the brim itself: does
   your thumb land in the drip (up to about 200 ms late) or spill? And at arm's length, do
   you notice the drip and the star it costs before the card moves on after about 1.8 s?

## What was reviewed

The sprint's diff, `studio-iteration-08..c3f0bd1`: [SHS-072](tickets/SHS-072-samovar-cup-shapes.md) (`fa2d4d0`), [SHS-073](tickets/SHS-073-samovar-forgiving-brim.md)
(`571c385`), [SHS-074](tickets/SHS-074-skill-describes-pull-requests.md) (`337b280`) and [SHS-075](tickets/SHS-075-iteration-record.md)'s records. No path outside `studio/`,
`docs/studio/`, `tests/studio/` and the studio's own skills and workflow changed, so
ADR-0008 does not apply. Each reviewer worked from a local server and made no change to
the repository.

- **Independent Reviewer.** Read the whole diff. Measured the clip path's effect on the
  liquid's box and on a point just outside the bowl's wall at 390×780 (IR09-3), the bowl's
  drawn size at four viewports (IR09-7), and the brim with the shipped `judge` and
  `pourAmount` at release lags of 150–300 ms (IR09-2). Read the repository's squash
  settings with `gh api` (IR09-1).
- **QA.** Checked the code, tests and process claims of all three tickets against a real
  local run.
- **Playtester.** Played fresh profiles at 390×780 and 320×640 with real pointer holds, as
  players who stop at the strength's share of the glass, who adjust after each verdict,
  who count the hold, who release late, and who aim at the rim; plus *Pour again*, a
  reload, leaving and returning, and the drawer. Its screenshots stayed on its machine.

## Findings and what became of them

| # | Finding | Severity | Became |
|---|---|---|---|
| IR09-1 | [SHS-074](tickets/SHS-074-skill-describes-pull-requests.md): Nothing lints the squash-merge's subject before it lands on `main`. With several commits on a branch the squash takes the pull request's title, typed freely into `gh pr create`; `commit-lint` reads only the branch's commits and CI doesn't run it, so the first check is the close gate, when only a hash waiver could get it through | process | **Fixed now**, `d715105`: the skill's `build` step 5 lints the title with `lintCommitSubject` before `gh pr create` (the command shown failing on a 99-character title and passing on a good one), and `process.md` says so. Sprint 10's first pull request (#50) is the first to use it |
| IR09-2 | [SHS-073](tickets/SHS-073-samovar-forgiving-brim.md): The drip band's 8 % rests on a 150–200 ms release lag the design records call measured, though sprint 08's Playtester simulated it headless. Letting go at the brim spills from about 220 ms | player-facing (tuning claim), record | **Fixed now** in the record: the design note's Fill line row (`59c701c`) and `DRIP_BAND`'s comment (`cbc4383`) call the lag an assumption and say what the band gives at the line and at the brim. The band stays 8 % (**declined** the margin for now): the page's hint is to let go at the dashed line, which leaves 450 ms, and the Playtester's Keep found no spill that way in about 80 cups, at up to 260 ms. The real thumb is the executive's question 3 above; a spill there makes it a backlog item |
| IR09-3 | [SHS-072](tickets/SHS-072-samovar-cup-shapes.md): No test checks that the tea is drawn in the glass's shape: the layout test reads the liquid's bounding box, which ignores the clip path | test strength | **Fixed now**, `7ec99e6`: the layout test asks what is painted a tenth of the way up each glass, tea on its axis and none half-way from a narrower wall to the box's edge. Red with the clip pointed at a missing path (*the tea is painted outside the glass's wall, tulip at 320×640 (dark)*), green restored; Samovar 23/23 |
| IR09-4 | [SHS-073](tickets/SHS-073-samovar-forgiving-brim.md): `hygiene`'s wikilink pattern flags an array of arrays in studio code; SHS-073's first push failed on it and the game code was bent around it, recorded only in the ticket's Result | process | **Backlog #59** (process, S, Ready) |
| IR09-5 | [SHS-072](tickets/SHS-072-samovar-cup-shapes.md): The design note's hook still said, in the present tense, that the decision is how long to pour for this cup's size, a two-second estimate with a hidden ratio | nit (record) | **Fixed now**, `59c701c`: the hook states the shapes as built, once, and where the hook is weak (the Playtester's counting finding) |
| IR09-6 | [SHS-073](tickets/SHS-073-samovar-forgiving-brim.md): Comments that no longer match the code: a puddle at the foot that isn't drawn, a cup "size" with four pairs, one over-long comment line | nit | **Fixed now**, `cbc4383` |
| IR09-7 | [SHS-072](tickets/SHS-072-samovar-cup-shapes.md): On 390-wide screens and up, `.cup`'s `max-width: 82%` draws the bowl at about 1.1 wide for 1 tall, not its aspect of 1.5 (the rules are unaffected) | nit | **Backlog #58**, with the Playtester's note that the tulip reads as a vase |
| Playtester | Counting the hold beats watching the glass, so the shapes are an obstacle counting walks around | player-facing | **Backlog #57** on **Q18** (new, ⭐ A: a flow per guest shown by the stream's thickness) |
| Playtester | The tulip is widest at its foot and reads as a vase; at 320 the first guest's glass sits 21 px lower than the later ones' | player-facing, low | **Backlog #58** |
| Playtester | *Much too weak, but a drop over the brim*: *and* reads better when the strength is off too | copy | **Fixed now**, `cbc4383`: *but* only after the strength they wanted, for a drip and for a short cup. A rules test, red first on the old line, then green |
| Playtester | The realm's Samovar card still reads *Iteration 08* and its first verdict | record | **Already covered:** `close` updates the shelf entry of every game the sprint changed |
| Review | Found by this step: the ticket stage failed once on *the water stopped at 108.0 %, not just past the drip band*. The two spill tests read the page's brew and water, written to 0.01 of a unit, so a spill caught a hair past 108 % can read as 108.00 | test (flake) | **Fixed now**, `cbc4383`: both allow that rounding, and the game's own verdict (0 stars, *Spilled*, `data-overflow` spill) still has to say it spilled. The ticket stage then 5/5 |

QA reported no findings.

## What a second round would likely have found

None is due: neither reviewer rejected, no production file changed and no save changed. A
second round would most likely have re-read `d715105`, checking that the lint command runs
from the repository root as the skill assumes and that nothing after it edits the title,
and `7ec99e6`, checking that the outside probe can't land on the glass's stroke on a
narrower screen and pass for the wrong reason (it asks only that the point is not tea, so
a stroke there still counts as outside).
