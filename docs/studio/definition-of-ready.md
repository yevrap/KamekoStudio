# Definition of Ready

A ticket may be pulled into an iteration only when every line below is true. The Product
Owner owns this list; the Scrum Master refuses to plan a ticket that fails it.

- [ ] **One outcome.** The ticket describes a single observable change, not a theme.
- [ ] **Why it exists.** The motivation is stated in one or two sentences, including whose
      input it came from (a direction, a review finding, a bug, the debt register).
- [ ] **Acceptance criteria.** Written as checkable statements. A criterion a reviewer
      cannot verify by reading the diff or running something is not a criterion.
- [ ] **Evidence plan.** How it will be proved: which test, which page, which screenshot.
- [ ] **Sized.** S (under an hour of agent work), M, or L. An L is split before planning.
- [ ] **Inside the guard.** Every file it expects to touch is inside the allowed paths in
      [`guardrails.md`](guardrails.md), or the ticket states the exception it needs and
      who approved it.
- [ ] **No hidden decision.** If the ticket contains an open product question, it is not
      ready — the question goes to the executive as a questionnaire, and the ticket waits.
- [ ] **Dependencies named.** Any ticket it must follow is listed.

A ticket that fails this list is either refined until it passes or sent back to the
backlog with the reason recorded on it.
