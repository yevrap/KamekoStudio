# Arcade Dev Mode — Dashboard Idea

*Captured: September 20, 2026. Idea, not a plan yet.*

## The idea

One app, one repo (KamekoStudio), with a "dev mode" that surfaces everything
behind the games — the roles, personas, sprint artifacts — plus a Jira-like
view for guiding development. Read-only for now; maybe interactive later.

## Sections

All in the same repo, as pages/sections of the one app:

1. **Arcade** — the existing arcade page, as today.
2. **Labs** — where new things get tried out; experiments before they graduate.
3. **3D mode** — the new Shadow arcade workflow (Shadow Studio), in 3D.
4. **Dev tracker** — Jira-like: boards, sprints, tickets. For seeing and
guiding development — lives alongside the steering views and the repo docs,
not replacing them.

## Two audiences

- **Show-and-tell** (e.g. at the playground): the *making-of*, presented
nicely — development artifacts and other interesting things, beyond the
games themselves.
- **Me**: a single dashboard of what's going on across Shadow Studio's
AI-driven iterations and my own guided sessions.

## What's surfaced

The twelve roles/personas (`docs/studio/team/`), sprint artifacts
(`docs/studio/iterations/NN/` — plans, tickets, logs, reviews, retros),
scorecard, changelog, decisions, learning log.

## Decisions

- **Same data, synced.** The repo is the source of truth; the dev tracker,
steering views (Board, Scorecard, Handoff), and repo docs are projections of
it, kept in sync. (Decided Sept 20, 2026.)
- **Docs maintenance gets dedicated time.** Cleaning and improving the
docs is part of the workflow, not something squeezed in — cadence TBD. No new paid
tools for this in the meantime.

## Open questions

- Static site generated from the repo (like the existing `studio/` page on
GitHub Pages) vs. a live view inside the app?
- Artifact inventory per section — what shows up where?
- Generated from the repo on a cadence (like the steering views are), or
hand-curated?
- Public or private? The repo is public and the studio page is already on
GitHub Pages — this could extend that, or stay deliberately separate.

## Related

- [Shadow Studio Index](../studio/steering/README.md) — the steering views (Board, Scorecard, Handoff)
- [Kameko Arcade](../games/README.md) — the arcade itself
- [Dev Tooling Investigation — GitHub Actions, Projects & Alternatives](dev-tooling-investigation.md) — where scheduling + task management should live
