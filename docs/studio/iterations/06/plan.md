# Iteration 06 — power-ups on the river, and ticket numbers you can click

**Epic:** E1 · The Studio Wing opens · **sprint 2 of 3 (+1 reserve, unclaimed)**

**Sprint goal:** you can play the River Run fork with a shield and rapid-fire floating on
the river and judge them, and every `SHS-` ticket number in the studio's docs opens that
ticket's file.

## Tickets

| # | ID | Title | Type | Size | Source |
|---|---|---|---|---|---|
| 1 | SHS-059 | Every `SHS-NNN` mention in the repo's Markdown links to its ticket file, and a script keeps it so | process | M | Chat focus, sprint 06 plan · backlog #32 |
| 2 | SHS-060 | River Run fork: a shield and rapid-fire / spread shot float on the river | feature | M | Direction E1 (sprint 06: the first experiment) · Q12 ⭐ · backlog #4 |
| 3 | SHS-061 | River Run fork: the music never schedules a Tone.js start below `Tone.now()` | fix | S | SHS-056 build · iteration 05 review · backlog #22 |
| — | SHS-062 | This iteration's record | docs | S | Ceremony commits |

Three planned tickets, at the cap. SHS-059 is work on the studio's own machinery (its
handbook and records), which uses this sprint's allowance of one; #21, which was next in
line for that slot, waits for sprint 07.

**Order.** SHS-059 first, because it is what the executive asked for. SHS-060 next: it is
E1's first gameplay experiment, and it retires the fork's byte-for-byte equality test.
SHS-061 last, because the audio exemption it removes rests on that equality test. Each is
one build session.

## What will be visible

- `https://yevrap.github.io/KamekoStudio/studio/games/river-run/` (also through the River
  Run portal on `3d.html`): power-ups float down the river one at a time. A shield takes one
  hit and shows on the boat; rapid-fire / spread shot changes shooting for a few seconds with
  a timer on screen. The review asks for a Keep / Iterate / Kill.
- On GitHub, in `docs/studio/`: every `SHS-NNN` in the plans, logs, reviews, retros,
  steering views, decision records and handbook is a link to that ticket's file.

## Focus from the prompt

The executive asked, in chat at this plan, for every mention of an `SHS` ticket to link to
its ticket file. Today none do: 383 mentions of the 16 ticketed numbers
(SHS-043…058) sit in 52 Markdown files, mostly under `docs/studio/`, plus two arcade
docs and `studio/README.md`. The Product Owner made it backlog #32 at the top, and it is
this sprint's process ticket. The older `SS-NNN` tickets are left as #34, since the focus
named `SHS`.

Q12 was still blank, so its ⭐ stands: power-ups are River Run's first experiment.

## Risks

| Risk | Response |
|---|---|
| A mass edit of 52 files, including past sprints' records, breaks something that reads Markdown: the handbook's example commits that `commit-lint` tests, `**Reviewed:**` lines in `reviews/SHS-052.md`, the docs-evidence test, the frontmatter the docs tests need | The script never touches code spans, fenced blocks, frontmatter or file paths, and never an ID with no ticket file (the handbook's examples use SHS-001, SHS-003, SHS-999…). Before the push: `npm test` (its docs-links test resolves every new link under `docs/`) and the studio suites, then `--stage=push` |
| The links rot as tickets are added, and the fix becomes a one-off | The script is idempotent and re-runnable; `process.md` says the retro runs it, and the ticket template says to write mentions as links. A check that fails on a bare mention is not built: direction rule 2 builds a new check only for a live defect or a recurring lesson |
| Two arcade docs mention SHS tickets (`docs/archive/dev-logs/black-hole-in-one.md`, `docs/games/black-hole-in-one/ideas.md`) | Linked in a separate arcade `docs:` commit, the route the executive asked for at sprint 05's review |
| Power-ups need two effects, pickups, HUD and a browser test each, in one session | The ticket allows the split the backlog row named: if the session can't hold both, the shield lands and rapid-fire goes back to the backlog as its own row |
| Retiring the equality test loses the record of how the fork differs from production | The ticket keeps `EDITS` and the source commit as the record of the copy, with a note in the test saying why equality stopped at SHS-060 |
| The Tone fix differs the fork's audio from production's, which is still broken | Fork only here. The production twin is backlog #33, a production fix under ADR-0008 with its own review before push |

## Out of scope

- The production River Run Tone fix (#33) and any other production change.
- Linking `SS-NNN` mentions (#34), commit subjects, or mentions in code and test files.
- A studio check that fails on a bare ticket mention (see Risks).
- The near-miss streak, biomes and River Run's other queued experiments (#6, #7, #23–#25).
- The commit form for the executive's steering edits (#21): next sprint's process slot.
