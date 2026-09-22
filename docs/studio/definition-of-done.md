# Definition of Done

Done means the work is merged, proven and documented. A ticket is not done because the
code works.

## Every ticket

- [ ] Acceptance criteria all met, each with its evidence recorded on the ticket.
- [ ] New or changed behavior is covered by a test, or the ticket states why it cannot be
      (and what was checked manually instead).
- [ ] `npm test`, `npm run smoke` and `npm run e2e` are green.
- [ ] `npm run studio:check` is green — **at the ticket stage before each commit, and at
      the push stage before the ticket is pushed**. The push stage runs every gate-only
      check, such as `hygiene`, so one fails on the ticket responsible rather than after the
      work is merged. Iteration 01 learned this the expensive way.
- [ ] After the push, `--stage=postdeploy` passes with a `--marker` only the new build has.
- [ ] Only allowed paths changed (see [`guardrails.md`](guardrails.md)). A production fix
      also has a regression test shown failing without the fix and passing with it, and a
      pre-push review record naming a commit that holds exactly what is pushed of every
      one of its files.
- [ ] Commits are conventional, scoped `studio`, and carry the ticket ID.
- [ ] The ticket file records: what changed, what was tested, what was deferred.
- [ ] Anything discovered and not done is written down — as a new ticket, a debt-register
      row, or a line in the review — never left only in a commit message.

## Per role

Each role signs off its own column. The Scrum Master does not close an iteration with an
unsigned column and no stated reason.

| Role | Signs off that |
|---|---|
| **Product Owner** | The change matches the accepted criteria, and nothing shipped that nobody asked for |
| **Scrum Master** | Caps, stop rules and the paper trail were respected |
| **Game Designer** | The mechanic does what the design hypothesis said, and the hypothesis was recorded before the build |
| **Level / Content Designer** | Content is complete, ordered and beatable; no placeholder text ships as final |
| **Front-end / Gameplay Dev** | Code follows the repo's stack constraints; no console errors at load; pointer input works on touch and mouse |
| **Data & Systems Dev** | Every storage key is `studio_`-prefixed and documented; saved data still loads after the change |
| **Tech Lead / Architect** | Structure and conventions hold; debt added is registered, debt paid is closed out |
| **QA Engineer** | The test plan ran, results are recorded, and failures became tickets |
| **UX / Art Direction** | Mobile-first layout verified, contrast and tap targets check out, the visual identity is respected |
| **Audio / Juice** | Sound is synthesized (no binary assets), respects the mute setting, and never plays before a user gesture |
| **Technical Writer** | Docs, changelog and the executive-facing views match what actually shipped |
| **Independent Reviewer** | A verdict was given on the diff with fresh context, and every finding was answered |

## Per iteration

- [ ] `review.md` and `retro.md` written from ceremonies that actually happened.
- [ ] `CHANGELOG.md` updated.
- [ ] Debt register and learning log updated.
- [ ] Post-deploy checks recorded: the new build is being served, a production page still
      loads, and no production file changed except the production fixes this iteration's
      tickets own.
- [ ] Tag `studio-iteration-NN` pushed.
- [ ] Handoff written and reported.
