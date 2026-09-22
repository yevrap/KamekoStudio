# Kameko Studio — Docs

Kameko Studio is a one-person web arcade built in public by AI agents, with a human
engineering director setting direction and judging the results. Everything the studio plans,
decides and learns is here.

| Start here | For |
|---|---|
| [`roadmap.md`](roadmap.md) | What's next — open work by priority |
| [`questionnaires/`](questionnaires/) | Product decisions waiting on the director |
| [`playtest-log.md`](playtest-log.md) | Verdicts from real play sessions — the strongest steering signal |
| [`games/`](games/) | The lineup, and one design doc per game: what it is, why it's shaped that way, ideas for later |
| [`brief.md`](brief.md) · [`mission.md`](mission.md) | What the studio is trying to make, and why |
| [`planning/`](planning/) | Studio-wide direction: new-game directions, the agent game loop |
| [`studio/`](studio/) | Shadow Studio — an agent "scrum company" running an experimental realm, with its own handbook |
| [`archive/`](archive/) | Shipped history, consumed questionnaires, finished plans, frozen dev logs |

**How work flows.** The director gives direction, verdicts and answers; agents record them
here, turn them into roadmap rows, and ship them end to end — tested, deployed to
[the live arcade](https://yevrap.github.io/KamekoStudio/), and documented in the same commit.
The agent workflows live in [`.claude/skills/`](../.claude/skills/); the working agreements in
[`CLAUDE.md`](../CLAUDE.md).
