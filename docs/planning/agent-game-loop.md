# Kameko Studio — Agent Game Loop Roadmap

> **What this is:** the plan for making Kameko Arcade the home where agents build new no-backend PWA games *for Yev* — more games to test, and depth for the ones that earn it. Created July 9, 2026. Companion steering doc: [Kameko Studio Questionnaire — Taste and Tiers](../questionnaires/taste-and-tiers.md).

## The one-sentence thesis

The ship pipeline already works — what's missing is the **taste loop**: nothing today captures what Yev thinks after playing, so agents polish all 10 games evenly instead of building more of what he actually likes.

## Where things stand (July 2026)

**Built and working:**
- Ship pipeline: `/triage`, `/improve`, `/ship` in the repo, plus planning-side dev skills — ~20 items shipped July 7–8 alone
- Foundation clean: all P0 roadmap items ✅, 113+ tests, GitHub Pages auto-deploy, token *earning* wired into 9 games
- Roadmap discipline: `docs/roadmap.md` in the repo is the active tracker, and agents verify items against code before working

**Missing:**
1. **No verdict capture.** Yev plays on his phone; the reaction ("durak is good, the others aren't") never lands anywhere agents read.
2. **No new-game engine.** P3 has three pitches from April sitting untouched, because every new game today pays the full convention tax (ES modules, tests, token hooks, doc tables) before anyone knows if it's fun.
3. **Effort spread evenly.** P1/P2 polish all 10 games alike. 4 of 10 are durak variants and durak is the only confirmed favorite — that's a strong signal nothing acts on.

## The loop

```
Brief (what Yev likes)
   ↓
Jam session — agent builds a cheap prototype in drafts/
   ↓
Playtest — Yev, on the phone, 5 minutes
   ↓
Verdict — one line in [Kameko Playtest Log](../playtest-log.md)
   ↓
Triage — verdicts reprioritize the roadmap
   ↓
Invest (depth features) · Promote (draft → arcade) · Park/Kill (stop work)
   ↺
```

Asymmetric effort by design: agents do the generative grind, Yev does taste. Steering happens in files (questionnaires, verdicts, brief edits) — never in chat back-and-forth.

## Layer 1 — Taste (docs)

- **Portfolio tiers.** Every game gets a verdict: **Invest** (build new features), **Maintain** (bugfix only), **Park** (stop work; stays playable). Set initially via [Kameko Studio Questionnaire — Taste and Tiers](../questionnaires/taste-and-tiers.md); revised any time by editing it.
- **Playtest log.** [Kameko Playtest Log](../playtest-log.md) — one line per play session (game, verdict, why). Agents read it before every triage and jam. This is the single highest-leverage steering input in the whole system.
- **The brief** — `docs/brief.md` in the repo (roadmap item p0-08). The steering wheel for new-game generation: what durak-goodness actually consists of, genres to try, session length, things to avoid. Seeded from the questionnaire answers; Yev edits it whenever taste shifts. It lives repo-side because that's where `/new-game` runs and where this project's roadmap already lives.

## Layer 2 — Prototype pipeline (repo)

**Principle: prototypes are cheap; promotion is earned.**

- New games are born in `drafts/` (folder already exists): one folder per prototype, **single-file HTML**, playable core loop in 2 minutes, mobile-first. No tests, no token hooks, no module split, no doc-table registration at draft stage.
- **`/new-game` command** (p0-09): reads the brief + playtest log → pitches 3 concepts → builds the strongest → registers it on a drafts index page → pushes and reports the live URL.
- **Drafts index** (p0-10): `drafts/index.html` linked from the arcade, so every prototype is playable on the phone minutes after the jam.
- **Promotion** (p0-11) happens only after a "keep" verdict: the draft then pays the full tax — ES modules, tests, token hook, settings integration, doc tables — via a promotion checklist `/ship` can execute in one go.
- **Kill without ceremony.** A dead draft is deleted; git history keeps it. Dead drafts are the system working, not failing.

## Layer 3 — Depth for winners

Durak is confirmed Invest-tier. Its idea inbox was triaged into the repo roadmap today (each item verified missing in code first):
- Hand sort toggle (p1-09) and finishing-placement display (p1-10)
- Perevodnoy / transfer-durak variant (p2-11)
- Seeded deals + share-a-deal links (p2-12)
- Extended stats beyond W/L/D (p2-13)
- Learning/referee mode — design note first (p2-14)

Other games' P1/P2 items stay listed but should not be picked **until the questionnaire sets tiers** — no more polish for games about to be parked.

## Cadence

Two session types, both started in the repo:
- **Jam** ("jam kameko" / "make me a new game") — one new prototype via `/new-game`, optionally plus one small Invest-tier item. Output: a playable thing on the phone.
- **Depth** ("ship kameko") — 1–2 roadmap items for Invest-tier games via dev-ship.

Recommended rhythm: start **on-demand** and validate the loop with 2–3 jams. Once jams produce things worth playing, add the scheduled version — a weekly task that leaves a fresh draft to try (the scheduled-jam option). Don't schedule first: a bad loop on a schedule is just weekly noise.

## Sequence from here

1. ~~**Yev (~15 min):** fill [Kameko Studio Questionnaire — Taste and Tiers](../questionnaires/taste-and-tiers.md).~~ ✅ **Done July 12, 2026** — tiers applied to the repo roadmap (Invest ×7; durak-likes → Lab p1-29; waterfall → delete p1-30). The tysiacha jam already validated the loop end-to-end (keep verdict → promoted → invested).
2. **Agent (1 session):** ~~`/new-game`, drafts index, promotion checklist (p0-09…p0-11)~~ ✅ shipped July 9. Remaining: write `docs/brief.md` from the questionnaire answers (**p0-08, now unblocked**) and execute the tier moves (p1-29 Lab demotions, p1-30 waterfall removal).
3. ~~**Agent (jam #2):** next prototype → deploy → report the URL to play.~~ ✅ **Q3 closed July 14, 2026** via [Kameko Studio Questionnaire — New Game Directions](../archive/questionnaires/kameko-studio-new-game-directions.md) — four jams picked and run to verdict since (Flow Glider ❌ killed, Pachinko Bazaar ✅ promoted, Black Hole in One ✅ promoted and heavily iterated; one-tower TD and durak score-attack still queued as p3-08/p3-09). Only **Q7 (free space)** remains open in the Taste and Tiers questionnaire.
4. **Yev:** play it, leave a one-liner in [Kameko Playtest Log](../playtest-log.md).
5. Repeat. Every ~4th session, run dev-triage to keep the roadmap honest against the verdicts.

## What "great" looks like (3-month check)

- A new prototype lands on the phone every week or two, aimed by the brief — several die fast, and that's fine.
- The durak family has real depth (variants, deal sharing, stats, learning mode) because it earned it.
- Parked games stopped consuming agent sessions entirely.
- Yev's total steering cost is minutes of checkboxes and one-liners — zero chat back-and-forth.

---
*Created July 9, 2026 alongside [Kameko Studio Questionnaire — Taste and Tiers](../questionnaires/taste-and-tiers.md) and [Kameko Playtest Log](../playtest-log.md). Same session: repo roadmap gained p0-08…p0-11, p1-09…p1-10, p2-11…p2-14; the durak idea inbox was triaged.*
