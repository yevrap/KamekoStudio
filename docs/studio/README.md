# Shadow Studio — engineering handbook

Shadow Studio is an experimental realm inside Kameko Studio, built and run by a small
simulated engineering team. The team plans, builds, tests, documents and reviews its own
work in bounded iterations, and everything it produces lives in this repository under
version control.

This folder is the team's handbook. It is written for a stranger reading the repo: it
should be possible to understand how the studio works, what it is allowed to touch, and
why any given decision was made, without any outside context.

## Read in this order

| Document | What it covers |
|---|---|
| [`process.md`](process.md) | The iteration protocol and the ceremonies that produce these documents |
| [`definition-of-ready.md`](definition-of-ready.md) | When a ticket may be started |
| [`definition-of-done.md`](definition-of-done.md) | When a ticket may be closed, per role |
| [`guardrails.md`](guardrails.md) | The path guard, the storage-key rule, the stop rules |
| [`public-repo-hygiene.md`](public-repo-hygiene.md) | What may never appear in a public commit |
| [`self-checks.md`](self-checks.md) | `npm run studio:check` — what each check proves |
| [`tech-debt.md`](tech-debt.md) | Debt policy and the live register |
| [`learning-log.md`](learning-log.md) | What the team learned, iteration by iteration |
| [`decisions/`](decisions/) | Architecture decision records |
| [`iterations/`](iterations/) | Plan, tickets, review and retro for each iteration |
| [`templates/`](templates/) | Ticket, ADR and iteration-document templates |
| [`CHANGELOG.md`](CHANGELOG.md) | What shipped, per iteration |
| [`team/`](team/) | The roles: what each owns, reviews and refuses |

## Ground rules

1. **One home per artifact.** Nothing is maintained in two places.
2. **State lives in files.** A fresh session picks up from `iterations/<latest>/` and the handoff.
3. **Production changes only as reviewed fixes.** The studio writes inside its own paths, and outside them only as a
   production fix through the full process ([ADR-0008](decisions/ADR-0008-production-fixes.md)) or a recorded
   exception — see [`guardrails.md`](guardrails.md).
4. **Public-repo quality.** Everything committed is something a stranger could read and respect.
5. **Bounded runs.** One iteration per run, small caps, a clean stop.
6. **Checks are evidence-based.** A check that did not run is reported as "not run", never silently skipped.
7. **Docs describe the present.** A changed decision is edited in place; the reasoning goes in `decisions/`,
   not into a stack of superseded paragraphs.

## Where the realm lives

- Code and assets: [`../../studio/`](../../studio/) — served at `/KamekoStudio/studio/`.
- Tests and the self-check runner: [`../../tests/studio/`](../../tests/studio/).
- Everything else about the studio: this folder.

## Relationship to the rest of the repo

Kameko Studio (the production arcade) is described in the repository root `CLAUDE.md` and
`docs/mission.md`. Shadow Studio runs *inside* that repo and inherits its stack
constraints — vanilla JS, no build step, no backend, static hosting — but keeps its own
process, its own folder and its own tests. A studio game only becomes a production game
through an explicit promotion, described in [`promotion.md`](promotion.md).
