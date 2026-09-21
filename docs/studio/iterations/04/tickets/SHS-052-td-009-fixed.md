# SHS-052 — Black Hole in One no longer throws when Explore starts with spiral particles alive (TD-009)

- **Status:** In progress
- **Size:** S
- **Iteration:** 04
- **Role lead:** Front-end / Gameplay Dev
- **Depends on:** SHS-051 (the rule that admits the production files)
- **Branch:** none — trunk-based, commits to `main` (ADR-0007)

## Motivation

TD-009, diagnosed in iteration 03: entering Explore while a golf hole's spiral particles
are alive throws `Cannot read properties of null (reading 'x')` from `stepParticles` on
every frame for about a second, and players reach it by every route tried. It also makes
the repository suite fail some of the time for a reason unrelated to whatever is being
tested. The fix was specified in iteration 03 and not made, because production files were
out of bounds.

## Acceptance criteria

- [ ] `stepParticles` in `games/black-hole-in-one/ui.js` drops spiral particles when there
      is no black hole. One line; nothing else in the file changes.
- [ ] `scripts/e2e.mjs` has three deterministic regression tests: the start menu → Explore;
      a golf round → ☰ Menu → Explore; and the defect directly — spirals alive in a golf
      round, the black hole removed, one step. Each **proves spirals were alive** before it
      acts, and each is shown failing on the unfixed file and passing on the fixed one.
- [ ] `node tests/studio/diagnostics/td-009.mjs` exits 0 on the fixed tree, and its output
      is recorded here. Its three checks now live in production's own suite, so the
      diagnostic is retired, and TD-009 is closed with this ticket's ID.
- [ ] Golf is unchanged: spirals still spawn and orbit the black hole in a golf round (the
      direct test's precondition proves it).
- [ ] Both production files are admitted by `PRODUCTION_FIXES`, named in the check's output
      with this ticket, and nothing else outside the guard changes.
- [ ] After the push, `--stage=postdeploy --marker-at=/games/black-hole-in-one/ui.js`
      finds a string only the fixed file has.

## Evidence plan

- The three new tests: red on the unfixed `ui.js` (each with TD-009's error), green on the
  fixed one.
- The diagnostic's exit code and output on the fixed tree.
- `npm run e2e` several times in a row on the fixed tree, recorded with the count.
- The path guard's report; the post-deploy stage with the marker.

## Out of scope

- The two end-to-end tests that used to fail intermittently. They were not wrong: they
  entered Explore and the game threw. They stay as they are.
- Any other change to Black Hole in One, and the arcade's own roadmap.

---

## Result

*Filled in as the ticket is worked. Empty until then.*

- **What changed:**
- **Tested by:**
- **Deferred:**
- **Fix rounds used:** 0 / 2
