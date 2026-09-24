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
