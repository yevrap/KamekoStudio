# Dev Tooling Investigation — GitHub Actions, Projects & Alternatives

*Captured: September 20, 2026. Investigation, not a decision.*

> **Resolved in part, 2026-09-22:** all studio planning, decisions and agent skills moved into this repo. Private notes no longer hold any studio work, so the "three places" below became two for studio purposes. The GitHub Projects and Actions questions are still open.

## The question

Should GitHub's built-in tooling — Actions (scheduler) and Projects (task
management) — take over part of the dev workflow? And if not GitHub, what
else? Survey the options before committing.

## Why now

- The dev tracker idea ([Arcade Dev Mode — Dashboard Idea](arcade-dev-mode-dashboard.md)) needs a home
for boards/sprints/tickets. GitHub Projects is free and lives next to the code.
- Scheduled runs (studio iterations, view regeneration) currently depend on
skills + my Mac being open. Actions could run them in the cloud on a schedule.
- No new paid tools — free tiers only.

## The bigger picture

Information lives in three places, and I like all three in a sense:

- **Private notes** — thinking and planning.
- **Google Drive** — shared documents.
- **The repo** — execution, versioned with the code.

The goal isn't consolidation — it's optimization: sharp boundaries so each
place does its job, and nothing lives in two places ambiguously.

## Tensions to resolve

- **Same data, synced** (decided Sept 20, 2026): the repo is the source of
truth. A GitHub Project board would be another projection — does it sync
both ways, or read from the repo like everything else?
- **Privacy**: private notes stay off GitHub (decided Sept 20, 2026). Anything
in Projects/Actions must be safe for a public repo.
- **The Mac being closed**: Actions runs without my Mac. That's the main
attraction — but it also means cloud agents touching the repo, which needs
guardrails (the repo already has `public-repo-hygiene.md`).

## To investigate

- GitHub Projects: boards, roadmap/table views, how tickets map to
`docs/studio/iterations/NN/`
- GitHub Actions: scheduled runs for studio iterations + view regeneration;
what secrets/permissions it needs
- Alternatives (free tier): Linear and others — what's actually better vs.
just familiar?

## Related

- [Arcade Dev Mode — Dashboard Idea](arcade-dev-mode-dashboard.md) — the dev tracker section this would feed
- [Shadow Studio Index](../studio/steering/README.md) — current iteration workflow
