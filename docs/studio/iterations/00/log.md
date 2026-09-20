# Iteration 00 — stand-up log

## After preflight

- **Scrum Master** — done: preflight green (clean tree, on `main`, no `STOP`, all three
  suites passing: 466 unit, 13 smoke pages, 23 e2e). next: plan. blocked: nothing.
- **Scrum Master** — note: `main` was already one commit ahead of `origin` before this
  iteration started — a pre-existing docs commit touching `docs/roadmap.md`. Not the
  studio's, not reverted, and it will be carried along by the publish push. Recorded so the
  path guard's base ref is honest: the iteration diffs against that commit, not `origin/main`.

## After SS-001, SS-002

- **Technical Writer** — done: the handbook, twelve role files. next: the iteration record.
  blocked: nothing.
- **Tech Lead** — done: four ADRs, the initial debt register. next: the check script.
  blocked: nothing.

## After SS-003

- **Tech Lead** — done: eighteen checks, five stages, pure rules extracted and unit tested.
  next: hand to QA. blocked: nothing.
- **QA Engineer** — done: 18 unit tests on the rules; ran every stage against the live repo.
  next: the placeholder page. blocked: nothing.
- **QA Engineer** — the checks caught six real problems while being built. Each is in the
  review.

## After SS-004

- **Front-end Dev** — done: placeholder page, verified headless at 390×844 and 1280×900 —
  no console errors, no horizontal scroll, 44px targets, the arcade's drawer and theme
  inherited. next: nothing. blocked: nothing.
- **Data & Systems Dev** — done: two `studio_` keys, both documented before use. The
  namespace is applied inside the storage wrappers as a literal, so it is both structurally
  unavoidable and statically checkable. next: nothing. blocked: nothing.

## After SS-005

- **Tech Lead** — done: surveyed `3d.html` and `shared/3d/`; the portal work is a two-file
  production change, not an HTML edit, and the page silently drops portals past the ninth.
  next: nothing. blocked: **the portal itself** — outside the path guard, needs approval.

## After SS-006, SS-007, SS-008

- **UX / Art Direction** — done: three identity directions with a recommendation, the
  entrance, and the home-page layout. next: nothing. blocked: the pick is Yev's.
- **Technical Writer** — done: the executive views and two templates, in the vault.
  next: close out. blocked: nothing.
- **Scrum Master** — done: three skills, registered in the skills index and the three agent
  context files. next: review and retro. blocked: nothing.
