# Changelog

All notable changes to Shadow Studio, one section per iteration. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions are iteration tags.

## [studio-iteration-00] — 2026-09-19

The setup iteration. No player-facing features.

### Added

- The engineering handbook in `docs/studio/`: process, Definition of Ready, Definition of
  Done, guardrails, public-repo hygiene, self-check reference, tech-debt policy and
  register, learning log, decision records and templates.
- Twelve role definitions in `docs/studio/team/`.
- `npm run studio:check` — the executable self-checks, in `tests/studio/`, with sixteen
  checks across five stages, plus unit tests for the checks themselves.
- `studio/` — a placeholder landing page for the realm, and `studio/README.md`.
- `docs/studio/iterations/00/` — plan, tickets, log, review, retro and a findings note on
  how the 3D landing page actually works.

### Known gaps

- The realm has no portal from the 3D landing page yet: the change falls outside the path
  guard and is proposed for approval in `iterations/00/findings-3d.md` (TD-001, TD-002).
