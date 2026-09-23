# ADR-0010 — `shared/3d/constants.js` gets one recorded exception: River Run's portal opens the studio fork

- **Status:** Accepted
- **Date:** 2026-09-22
- **Iteration:** 05

## Context

The executive's direction for epic E1 makes the 3D landing page the studio's window. Its
first done-when line reads: *a 3D portal leads to a studio fork, and every portal without a
fork still leads to its production game*. Q4 (decided 2026-09-21) approved the 3D page as
the studio's window, and the executive chose River Run as the first fork (Q11, option C).
SHS-056 put that fork live at `studio/games/river-run/`.

The portal list is `ARCADE_GAMES` in `shared/3d/constants.js`. The landing page builds one
portal per entry and navigates to the entry's `url`. The file is production code, outside
the path guard. ADR-0005 left it uncovered on purpose, because the studio had nothing
behind a door yet.

## Decision

`shared/3d/constants.js` is a **recorded exception**, narrowed to one value: the `url` of
the entry named `"River Run Rapids"` may be `studio/games/river-run/` instead of
`games/river-run/`. Nothing else in the file may change.

The approval comes from the E1 direction's done-when and Q4, as described above. It covers
this one portal. A second fork's portal is a new approval and a new row in
`STUDIO_FORK_PORTALS`, with its own record.

The check works the way the `frontPositions` check does. `allowOnlyStudioForkPortal` in
`../../../tests/studio/lib/rules.mjs` undoes the approved value, matched on that entry's
own line, in both the base and the current text, and requires the results to be equal byte
for byte. This means:

- any other edit in the file fails, whether it's a colour, a second url or a stray space;
- the fork url on any other entry, or River Run pointed at anything but its fork, fails;
- once released, the change is part of the base, and the next iteration sees an unchanged
  file rather than a url the base "did not have";
- pointing River Run back at `games/river-run/` passes, because that's the rollback.

## Consequences

- A player walking into River Run's portal on `3d.html` plays the studio's copy, which
  keeps its own `studio_` saves. The arcade gallery (`index.html`) still opens the
  production game. The two entrances now lead to different builds of the same game, and
  that's the point of the Studio Wing.
- Production River Run gets bug fixes only from now on (direction rule 5). Its feature rows
  left the arcade roadmap for the studio backlog on 2026-09-22, in an arcade `docs:` commit
  made by the studio at the executive's direction (see `guardrails.md`, *Arcade docs about
  studio work*).
- *Found in the iteration 05 review.* The rest of the 3D page and the drawer still assume
  River Run has one build. The trophy beside the portal shows the arcade's
  `riverRunHighScore`, which the fork never writes, so play through the portal never earns
  it. The gallery's recently-played sort reads `lastPlayed_riverRun`, not the fork's key.
  The drawer's game switcher (`shared/settings.js`) highlights 🌊 on the fork page, and
  tapping it leaves for the production build. All three are production code, outside this
  exception, and on the backlog.
- `tests/studio/studio-portal.test.mjs` asserts that every portal url resolves to a page and
  that every portal without a fork still points at `games/<slug>/`. It also walks into the
  portal in a headless browser and checks that the fork is what opens.
- The exception is for a value and not a table, so it's simpler than ADR-0005's grammar.
  There is nothing to smuggle in a string literal that the byte comparison doesn't catch.
- The portal gives no sign that it leads to a studio build. A visual mark is backlog
  material if the executive wants one.

## Alternatives considered

| Option | Why not |
|---|---|
| A studio-owned portal list merged into `ARCADE_GAMES` at runtime | It needs a larger production edit (an import and a merge in `gameplay.js`) to change one string, and the guard would have to trust code rather than compare a value |
| Redirect `games/river-run/` to the fork | It would change the arcade's own game for gallery players too, which the direction rules out |
| Exempt the whole file | The guard is worth having because it's narrow. Nothing about this change needs standing access to the other ten entries |
