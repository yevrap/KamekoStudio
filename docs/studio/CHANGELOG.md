# Changelog

All notable changes to Shadow Studio, one section per iteration. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions are iteration tags.

## [studio-iteration-00] — 2026-09-19

The setup iteration. No player-facing features.

### Added

- The engineering handbook in `docs/studio/`: process, Definition of Ready, Definition of
  Done, guardrails, public-repo hygiene, self-check reference, tech-debt policy and
  register, learning log, promotion process, decision records and templates.
- Twelve role definitions in `docs/studio/team/`.
- `npm run studio:check` — the executable self-checks, in `tests/studio/`: eighteen checks
  across five stages, with the decision logic isolated as pure functions and unit tested.
- `studio/` — a placeholder landing page for the realm, live, with `studio/README.md`.
- `docs/studio/iterations/00/` — plan, log, eleven tickets, review, retro, and a findings
  note on how the 3D landing page actually works.

### Fixed

After an independent review of this iteration's own diff, run by two agents with fresh
context:

- The `package.json` path-guard exception read diff text, so once a change to that file was
  committed it compared an empty string and passed — any committed change was waved through
  while the check reported "exception used". It now compares the parsed file between the
  base revision and now, and checks the script's value as strictly as its key.
- The path guard counted only a rename's destination, so a file could be moved out of
  production and reported as a studio-only change.
- The storage rule checked three named accessors, missing bracket access, `delete`, and
  `localStorage.clear()` — which empties the whole shared origin, production saves included.
- Five places, including copy on the public placeholder page, overstated the storage rule:
  studio pages inherit the arcade's settings script, which owns `theme` and `devMode`.
- Standalone footer links were below the 44px tap target; a corrupted visit count rendered
  a nonsense sentence.
- Smaller: commit-lint could be opted out of by starting a subject with "Merge"; `hygiene`
  skipped files by extension, so a stray `.pem` would not be scanned; an unresolvable
  `--base` silently disabled the guard; a missing browser was reported as a test failure
  rather than as "not run".

### Known gaps

- The realm has no portal from the 3D landing page: the change falls outside the path guard
  and is proposed for approval in `iterations/00/findings-3d.md` (TD-001, TD-002).
- Five open rows on the tech-debt register, three of them production-side.
