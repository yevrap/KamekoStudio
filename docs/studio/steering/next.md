# Shadow Studio — Next step

**Next:** `review`: sprint 05, one round (QA on `opus`, Independent Reviewer on `fable`)
**Say:** `studio next` (in a new session) · or `studio next — focus: <what you want>`

| | |
|---|---|
| Epic | E1 · The Studio Wing opens · sprint 1 of 3 (+1 reserve) |
| Sprint | 05 · the River Run portal opens the studio's fork of River Run |
| Steps | plan ✓ · build ✓ (SHS-055 ✓ → SHS-056 ✓ → SHS-057 ✓) · **review ▶** · close · retro |
| Waiting on you | Nothing blocks. Q12 (first River Run experiment) takes ⭐ power-ups if blank at plan 06 |

## Notes for the next session

- Review diff: `git diff studio-iteration-04..HEAD`. Its production lines are
  `shared/3d/constants.js` (one url, recorded exception ADR-0010, already pushed and live)
  and SHS-055's check changes. There are no ADR-0008 production fixes, so no
  `reviews/<TICKET>.md` is needed unless a finding creates one.
- Point the reviewers at `allowOnlyStudioForkPortal`: it reverts on both sides (a
  deliberate difference from `frontPositions`, reasoned in ADR-0010). Is that loophole-free?
- `045f031` (in SHS-057) changed SHS-056's browser test so the run ends on purpose.
  It was the push-stage flake.
- Backlog #22: the browser test exempts one named, inherited Tone.js `RangeError`.
- The next ticket number after SHS-058 is SHS-059.

*Rewritten by every session (the studio-iteration skill). Loaded into every new Claude Code
session by the SessionStart hook in `.claude/settings.json`.*
