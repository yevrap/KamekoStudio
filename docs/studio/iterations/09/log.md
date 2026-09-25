# Iteration 09 — stand-up log

Done / next / blocked, per role that acted. One entry per session (ADR-0009), pushed when it
is committed.

## Session 1 — plan (2026-09-24)

- **Scrum Master** — *Done:* preflight green (tree clean, on `main` in sync with origin, no
  `STOP`, baseline suites green in 200 s). E2, sprint 2 of 3 (+1 reserve, unclaimed). Three
  planned tickets plus the record; one is studio machinery ([SHS-074](tickets/SHS-074-skill-describes-pull-requests.md)). No executive
  commit since retro 08, so no exemption is needed. *Next:* build [SHS-072](tickets/SHS-072-samovar-cup-shapes.md).
  *Blocked:* nothing.
- **Product Owner** — *Done:* no open `studio` issue from the owner and nothing in the
  inbox. Q15 blank, so its ⭐ (shapes) is taken; Q14 blank again, so Samovar stands and Q14
  is folded in; Q17 (when a pull request merges) is new, on its ⭐. Backlog #53 + #52 became
  [SHS-072](tickets/SHS-072-samovar-cup-shapes.md), #51 + #54 [SHS-073](tickets/SHS-073-samovar-forgiving-brim.md), #49 [SHS-074](tickets/SHS-074-skill-describes-pull-requests.md). #51's drip band refined from 5 % to
  8 % on the numbers. *Next:* nothing until review. *Blocked:* nothing.
- **Game Designer** — *Done:* the cup profiles, the stop height per strength and glass, and
  the time windows, worked out before the build and written into both games tickets
  (retro 08's rule). *Next:* review, with the Playtester, against those numbers.
  *Blocked:* nothing.

## Session 2 — build [SHS-072](tickets/SHS-072-samovar-cup-shapes.md) (2026-09-24)

- **Frontend Developer** — *Done:* [SHS-072](tickets/SHS-072-samovar-cup-shapes.md), Samovar's glasses of three shapes (`fa2d4d0`): a
  profile per glass in `constants.js` that the SVG drawing and the rules both read, the
  volume-to-height mapping in `gameplay.js`, every cup filling in 2.5 s, the result card
  low on the table. `tests/studio/samovar.test.mjs` 20/20, `--stage=ticket` 5/5.
  *Next:* build [SHS-073](tickets/SHS-073-samovar-forgiving-brim.md). *Blocked:* nothing.
- **Game Designer** — *Done:* the stops as built are within a point of the plan's table;
  the closest pair is 10.5 points (Light, straight against tulip). The design note carries
  the table and sprint 09's hypothesis. *Next:* review, where the Playtester is asked
  whether players watch the glass or count seconds. *Blocked:* nothing.

## Session 3 — build [SHS-073](tickets/SHS-073-samovar-forgiving-brim.md) (2026-09-24)

- **Frontend Developer** — *Done:* [SHS-073](tickets/SHS-073-samovar-forgiving-brim.md), Samovar's forgiving brim and the best from the start
  (`571c385`): a cup up to 8 % over the brim drips down the glass's side and costs one
  star, past it spills with tea over both sides; a brew let go over the brim serves at
  once; the best evening under the running stars from the first screen, a first evening
  above 0 a new best. `tests/studio/samovar.test.mjs` 23/23, `--stage=ticket` 5/5.
  *Next:* build [SHS-074](tickets/SHS-074-skill-describes-pull-requests.md). *Blocked:* nothing.
- **Game Designer** — *Done:* the brim as built is the plan's table (250 ms free, 200 ms
  at a star, then a spill), in the design note with #51 and #54 marked done. *Next:*
  review, where the Playtester says whether a first evening still scores near 0.
  *Blocked:* nothing.

## Session 4 — build [SHS-074](tickets/SHS-074-skill-describes-pull-requests.md) (2026-09-24)

- **Scrum Master** — *Done:* [SHS-074](tickets/SHS-074-skill-describes-pull-requests.md), the pull-request flow written down (`337b280`): the
  `studio-iteration` skill's `build` names the eight commands in order, `review` posts the
  Independent Reviewer's verdict on each pull request, records stay on `main`; the
  workflow's prompts and `references/prompts.md` agree; `process.md`'s *Branches, commits,
  tags* and the ticket template follow; ADR-0007 superseded. `--stage=push` 11/11.
  *Next:* review. *Blocked:* nothing.
- **Tech Lead** — *Done:* read the commands against the checks and found one the plan
  missed: `production-fix-reviewed` needs the reviewed commit in `main`'s history, which a
  squash-merge replaces, so a production fix stays on trunk until backlog #56 (new, S,
  Ready). ADR-0011 §5 is the executive's, so Q17 carries a note rather than an edit.
  *Next:* review. *Blocked:* nothing.

## Session 5 — review (2026-09-24)

- **Scrum Master** — *Done:* one round, run by the `studio-sprint` workflow: the
  Independent Reviewer (`opus`) approved with seven findings, QA (`sonnet`) approved with
  none, and all three reviewers returned; no second round. Built on trunk, so no pull
  request to post on. Fixed now: `7ec99e6` (the tea's clip probed by point, red first),
  `cbc4383` (*and* for two misses, red first; stale comments; the spill tests' rounding
  flake, found when the ticket stage went red once), `d715105` (the skill lints a pull
  request's title before opening it), `59c701c` (the design note's hook, the lag as an
  assumption). *Next:* close. *Blocked:* nothing.
- **Product Owner** — *Done:* the Playtester's verdicts into [review.md](review.md): Iterate on
  the glasses' shapes ([SHS-072](tickets/SHS-072-samovar-cup-shapes.md)), Keep on the brim and on the best from the first screen
  ([SHS-073](tickets/SHS-073-samovar-forgiving-brim.md)). Backlog #57 (a flow per guest, on Q18's ⭐, new) and #58 (the glasses drawn
  true) from the Iterate, #59 from IR09-4. Q15 folded into the answered list: blank
  through this review, so the shapes stand. *Next:* sprint 10 plans against #57 and #58.
  *Blocked:* nothing.
- **Game Designer** — *Done:* the hook rewritten to one current version; the drip band
  kept at 8 %, with the lag behind it recorded as an assumption and put to the executive's
  phone. *Next:* the flow-per-guest numbers at plan 10. *Blocked:* nothing.

## Session 6 — close (2026-09-24)

- **Scrum Master** — *Done:* the close records (`3e1151c`): `review.md`'s *In plain words*
  and demo list, the changelog's `studio-iteration-09` section, the pulse line, Samovar's
  shelf entry (iteration 09, its second verdict), backlog #49 and #51–#54 marked done, the
  Playtester's verdicts and Q15's fold in the input ledger, [SHS-075](tickets/SHS-075-iteration-record.md) Done. The gate
  (base `studio-iteration-08`) went red once, on `docs-current`: [SHS-072](tickets/SHS-072-samovar-cup-shapes.md) and [SHS-073](tickets/SHS-073-samovar-forgiving-brim.md) wrote
  their commit between *What changed* and its colon, so the label read as missing
  (`67a97ac` moves it; the fourth sprint `docs-current` was red at a gate, backlog #47).
  The rerun hung: two browser suites (`river-run-fork`, `samovar`) sat idle for over nine
  minutes with no Chrome running, and were stopped; `samovar` alone then went 23/23 in
  124 s, and the full gate 11 of 11. Pushed, tagged `studio-iteration-09`; postdeploy
  found each marker live: the new Samovar blurb on the realm (attempt 3) and the verdict
  line's `joint` in Samovar's `gameplay.js` (attempt 1). No `studio` issue was tied to this
  sprint. *Next:* retro. *Blocked:* nothing.
