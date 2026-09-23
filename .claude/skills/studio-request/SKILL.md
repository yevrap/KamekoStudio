---
name: studio-request
description: "Files something for the Shadow Studio team as a GitHub issue — a request (feature, game idea, fix for a studio game, priority change for a backlog row), feedback on how a run went, or a Keep / Iterate / Kill verdict that overrides the Playtester's. Also lists open ones. Use when Yevster says 'studio request: …', 'ask the studio for …', 'prioritize X', 'move #N up', 'studio feedback: …', 'that run was too slow / wasteful / …', 'studio verdict: …', 'keep / kill the power-ups', or 'what have I asked the studio for'."
---

# Studio request

Requests reach the studio as **GitHub issues labelled `studio`**
([ADR-0011](../../../docs/studio/decisions/ADR-0011-the-studio-runs-itself.md) §4). The
next `plan` turns each one into a backlog row at its priority, comments with the row's
number, and `close` closes it with the live URL when it ships. Filing an issue never touches
the working tree, so it's safe while a sprint is running.

**Never edit the checkout here.** A sprint may be running in it. Moving backlog rows by hand
is Yevster's own edit, between runs.

## File a request

1. **Read the request.** A feature or change to a studio game, a new game idea, a bug in a
   studio game, or a move of an existing backlog row (name its `#`: check
   `docs/studio/steering/backlog.md`). A bug in an **arcade** game belongs to the `fix`
   skill, not here.
2. **Priority.** `priority: now` (top of the backlog; pulled at the next plan if it can be
   made Ready), `priority: next` (into the top five), `priority: later` (the bottom).
   If Yevster didn't say, use `next` and say so. Don't ask.
3. **Write it for a public repo.** Plain, neutral words: what a player should be able to do
   or see, and what "done" looks like if Yevster said. No personal details
   (`docs/studio/public-repo-hygiene.md`). Keep Yevster's intent; don't design the solution.
4. **File it:**
   ```bash
   gh issue create --label studio --label "priority: next" \
     --title "<short, player-facing>" \
     --body "<the request>

   <what done looks like, if given>

   _Filed with studio-request. The next studio plan puts it in the backlog (ADR-0011)._"
   ```
   If a label is missing, create it once: `studio`, `priority: now`, `priority: next`,
   `priority: later`, `in backlog`, `feedback`, `verdict`.
5. **Report** in two lines: the issue URL, and when it'll be picked up — at the next
   `plan`, which a running sprint reaches after its retro. `priority: now` doesn't interrupt
   a running sprint.

## Feedback and verdicts

Same channel, different label — never an edit to the working tree (a sprint may be
running, and an unticketed studio commit fails the checks):

- **Feedback on how a run went** (too slow, too much ceremony, a step that should be
  skipped, what worked): `--label studio --label feedback`, no priority. The next retro
  turns it into a rule, a skill or workflow edit, or a check (direction rule 8) and closes
  the issue saying which.
- **A verdict** on something the studio shipped: `--label studio --label verdict`, title
  `Keep | Iterate | Kill: <item>`, body the why. It overrides the Playtester's verdict at
  the next plan, which closes the issue saying what changed.

## List requests

`gh issue list --label studio --state all --author @me --limit 20` — show each with its
state: waiting for triage (no `in backlog` label), in the backlog (the studio's comment
names the row), or shipped (closed, with the URL).
