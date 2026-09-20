# Iteration 00 — stand up the company

**Goal:** establish the team, the paper trail and the self-checks, and put a placeholder
page live — no games.

## Committed tickets

| ID | Title | Size | Role lead |
|---|---|---|---|
| SS-001 | The engineering handbook | L | Technical Writer |
| SS-002 | Twelve role definitions | M | Scrum Master |
| SS-003 | `npm run studio:check` | L | Tech Lead |
| SS-004 | The realm's placeholder page | M | Front-end Dev |
| SS-005 | Findings on the 3D landing page | M | Tech Lead |
| SS-006 | The executive-facing views | M | Technical Writer |
| SS-007 | The realm design brief | M | UX / Art Direction |
| SS-008 | The three skills | M | Scrum Master |
| SS-009 | This iteration record | S | Scrum Master |

Nine tickets is more than the standing cap of 2–3. Iteration 00's scope is the setup
brief's, not the Product Owner's, and every ticket is a named deliverable of it. The cap
applies from iteration 01. Recorded here rather than quietly exceeded.

## Reserved capacity

SS-003, SS-005 and SS-009 are the debt, learning and documentation share — a third of the
iteration rather than the standing fifth, which is what a setup iteration should look like.

## Risks

| Risk | Response |
|---|---|
| The brief requires `npm run studio:check`, which needs `package.json` — outside the path guard | Record it as a narrow, content-checked exception rather than widening the guard. ADR-0002 |
| Every studio push redeploys production | Run all three existing suites before merging; verify a production page after |
| The portal work may turn out to be larger than "one link in `3d.html`" | Survey first, propose a diff, apply nothing. SS-005 |
| A setup iteration produces no player-facing evidence, so the checks are the only proof it works | Make the checks catch real failures, and record each one they caught |

## Out of scope

Games. The visual identity itself (designed, not built — the decision is Yev's). Any edit
to `3d.html` or `shared/3d/`. Any change to production behavior.
