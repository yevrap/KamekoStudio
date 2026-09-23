---
title: "What to Build Next — Proposals & Questionnaire (July 2026)"
type: questionnaire
status: answered
created: 2026-07-13
gates: []
tags: [questionnaire, studio-wide]
---

# What to Build Next — Proposals & Questionnaire (July 2026)

**Related:** [Studio Dashboard](../README.md) · [Roadmap](../roadmap.md) · [Playtest log](../playtest-log.md)

> Rewritten July 13, 2026 (evening) after Yev's redirect: not a triage of existing backlogs — **new games and experiences** that agents can plan and build, that Yev then plays with. (The morning version of this note recommended the Health App MVP; that's parked as a lane he didn't pick. Watch/Xcode work explicitly deferred — his call.)
>
> **Reframed July 14, 2026** per Yev's clarification: "multiple models" means he works with **both Anthropic and Google agents** and the dev flow must stay **consistent and interoperable across them** — plain specs, documented APIs, shared state any agent can pick up. It does **not** mean per-model personalities inside the apps. The pitches below were rewritten to drop the model-persona angle; the Q3 that asked about it is closed.

---

## ✅ Progress already made: Astro Salon shipped today

The first "something new" didn't wait for this questionnaire — your own inbox ask (astrology teaching game with dialogue) was jam-sized, so it's **built and live**:

**🔮 [Astro Salon](../games/astro-salon/README.md) — https://yevrap.github.io/KamekoStudio/drafts/astro-salon/** (Lab, v19). Five clients per session bring birthdays and questions; you answer on the zodiac wheel; the game teaches signs, elements, modalities, planets, opposites, and compatibility as you play. **Play it, log a verdict in [Kameko Playtest Log](../playtest-log.md), fill [Astro Salon Questionnaire — Verdict & Direction](../archive/questionnaires/astro-salon-verdict-and-direction.md).**

Its verdict also steers pitch E below (the "teach me anything" engine).

---

## The new-experience menu

### A — Kameko Colosseum ⚔️ *(bot arena on a documented API — my top pick)*

**What:** bot-vs-bot arena inside the arcade. Durak (later tysiacha) gets a small documented **bot API** — a strategy module that sees legal moves and game state and returns a move. Any agent session (Anthropic or Google, or Yev hand-writing one) can author a strategy against that API; bots are named for their *strategy* (aggressive-trump-hoarder, conservative-counter, etc.), not for whichever model wrote them. A tournament harness runs hundreds of headless games, a spectator mode (built on the Watch Mode you already have) replays the juicy ones at watchable speed with named seats, and a standings board lives on the arcade.

**Why it's interesting for you specifically:** it's Watch Mode with actual stakes (you already like watching the games play themselves); it never goes stale — any session can drop a new challenger strategy into the bracket. You can enter your own hand-prompted bot too. It's also honest QA: the harness doubles as a durak-engine stress test, and the bot API is exactly the kind of agent-agnostic interface the whole dev flow is built on.

**Shape:** not a jam — a planned feature (roadmap-sized, ~M+M: bot API + harness, then spectator/standings). Plans and specs live in the repo so any agent can pick up the next piece.

### B — Skazka Trail 🐺 *(cultural, story-driven)*

**What:** short interactive Russian-folklore vignettes — Baba Yaga's hut, a bogatyr at the crossroads stone — 5 minutes each, a few real choices, warm and a little dark like the originals. Story graphs are **authored at build time** (no runtime AI, keeps the zero-backend rule); the anthology grows tale by tale, each written by whatever session picks it up against a shared vignette spec. Nostalgia/cultural connection is literally the taste brief's #1 signal.

**Shape:** jam-able — one vignette as a Lab draft proves the format; the anthology grows tale by tale.

*(Pitch C was withdrawn.)*

### D — 3D Arcade Room 2.0 🕹️ *(the front-door experience)*

**What:** your inbox item "Better 3D mode room," taken seriously: a walkable Three.js arcade room where each game is a glowing cabinet — walk up, tap, play. The arcade gets a *place*. Pure spectacle, fun to show off, and the models are good at Three.js scenes now.

**Shape:** iterative sessions on `3d.html`; each session leaves it visibly cooler.

### E — The Salon Engine 📖 *(if Astro Salon's formula lands)*

**What:** Astro Salon's loop — client walks in, you answer from a structured diagram, rules teach themselves — is a reusable **"teach me anything" engine**. Next domains, each a content pack: constellations & the real night sky, wine, local birds, **Belarusian history**. Any session can draft a domain pack against the shared engine spec; you keep the ones that teach.

**Shape:** gated on the Astro Salon verdict; each pack is roughly jam-sized after that.

---

## Questionnaire

> **Q1 defaulted to shelved (2026-07-21, morning-brief).** Open 8 days across 3 rotate-flags with no answer, per the stated rule from the 2026-07-20 brief. Not deleted — the Colosseum pitch and the other options below are all still here if you want to revisit. This just stops the daily nag; say "un-shelve what to build next" or answer Q1 directly to reopen it.
>
> **Pitch B un-shelved 2026-07-22** — Yev picked it up directly (turn-based, multiple-choice folk-tale anthology, real branching, multiple endings). Full design plan: [Skazka Trail — Concept & Directions](../games/skazka-trail/plans/concept-and-directions.md) · decisions: [Skazka Trail Questionnaire — Design Decisions](../archive/questionnaires/skazka-trail-design-decisions.md). A/C/D/E remain shelved.

**Q1. Greenlight — which gets built next?** (pick 1–2; "work on X" starts it)
- [ ] **A — Kameko Colosseum** ⭐ my pick: most novel, most *you*, and the arena never goes stale
- [x] **B — Skazka Trail** (one vignette as a Lab draft first) — picked up 2026-07-22, see [Skazka Trail — Concept & Directions](../games/skazka-trail/plans/concept-and-directions.md)
- [ ] **D — 3D Arcade Room 2.0**
- [ ] **E — Salon Engine** (waits on the Astro Salon verdict anyway)
- [ ] Write-in:

**Q2. If Colosseum:**
- **a)** First arena game: [ ] durak / [ ] tysiacha / [ ] both eventually, durak first
- **b)** Tournaments run: [ ] on-demand ("run the colosseum") / [ ] nightly scheduled, standings waiting with your coffee
- **c)** Do you want your own hand-prompted bot in the bracket from day one? [ ] yes / [ ] later

**Q3. ~~The multi-model angle~~ — CLOSED July 14, 2026.** Yev clarified: multi-model means the dev flow stays consistent and interoperable across Anthropic and Google agents (shared specs, shared state, agent-agnostic APIs) — **not** per-model personalities or authorship comparisons in the apps. Deliverables are built by whoever's in the session.

**Q4. Cadence check:** Astro Salon happened because a jam could ship same-day. Should "one new Lab draft per week" become a standing rhythm (scheduled jam), or stay on-demand?
- [ ] Standing weekly jam
- [x] On-demand only (current setting, per the taste brief)

---

*Answers flow to: the roadmap (A/D as roadmap items) and `new-game` jams (B/C/E).*
