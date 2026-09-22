# Flow Glider

> **Status: 🚫 Killed July 14, 2026 — same-day verdict.** Too derivative of Tiny Wings; the "sunset pushed back by skill" hook (below) turned out to be Tiny Wings' own signature mechanic reproduced, not an original twist. Stays in the Lab as a curio; not being promoted or iterated as-is. See [Kameko Playtest Log](../../playtest-log.md) and the agent-facing correction this triggered (games built off cited prior art need a genuinely original hook, not the closest analog to the reference game).
> **Play it:** https://yevrap.github.io/KamekoStudio/drafts/flow-glider/
> Repo: `drafts/flow-glider/` (single file) · roadmap **p3-06** · shipped in v23 (`a5b5843`)
> Verdict + judgment calls: [Flow Glider Questionnaire — Verdict & Direction](../../archive/questionnaires/flow-glider-verdict-and-direction.md) · ideas: [Improvements](ideas.md)

## What it is

The **A1 pick** from [Kameko Studio — New Game Directions (July 2026)](../../planning/new-game-directions.md) — the "looks cool" one-touch physics game (Tiny Wings / Alto's Odyssey energy). Hold anywhere to dive, release to soar over endless procedurally generated hills. The whole game is one thumb: timing the dive so you land *along* a downhill slope instead of slamming into it. The beauty is the reward loop — your streak literally keeps the sun in the sky.

## How it plays

- **Hold to dive, release to soar.** Holding adds heavy gravity: in the air it slams you down; on a downslope it glues you to the hill and converts the descent into speed. Releasing near a crest launches you into a long arc.
- **Perfect landings:** touch down on a downhill slope, descending, either angle-matched to the slope or softly — the streak counts up (×2, ×3…), you keep your speed plus a boost, and you earn 100 × streak points.
- **The sun is the clock.** A run starts with ~78s of daylight and the sky slides from morning blue through golden hour to dusk. Each perfect landing pushes the sunset back (+3s, +5s during fever). When night falls, the run ends — there is no other way to die.
- **Fever at ×3:** rainbow trail, glow aura, double landing bonuses, bigger sun pushes. Lose it by slamming into an uphill.
- **Slams cost speed, not the run.** A hard landing bleeds your momentum and resets the streak, but the glider never crashes — flow is preserved, and the only real punishment is the sun you're no longer earning.
- **Score** = meters traveled + landing bonuses. Session best is tracked; hills grow bigger and steeper over the first ~1.3 km.
- A baseline run is 2–4 minutes; skilled chaining stretches it well past that.

## Design decisions and why

- **Sun-clock as the run structure** — a pure flow game needs stakes without a fail state that breaks the trance. Tying daylight to perfect landings makes the *same* skill both the score engine and the survival mechanic, and gives the "streak-driven sunset sky" from the concept a mechanical meaning instead of being wallpaper.
- **No crash state** — Yev's brief says flow, not punishment. Bad landings bleed speed; only sundown ends the run.
- **Forgiving landing judgment** — a landing is perfect if angle-matched *or* soft; only a genuinely hard perpendicular slam is a thud; tiny valley skims are neutral. This came out of headless physics sims during the build: with a strict angle-only rule, invisible micro-skims silently ate streaks and fever was unreachable. Post-fix, a sim bot that times its dives chains ×9 and sustains daylight while a dive-bomb bot dies at sundown — the skill curve is real.
- **Unified physics model** — the glider is always a projectile; ground contact just projects velocity onto the slope tangent. No separate ground/air state machines to desync; holding naturally glues you over crests because the extra gravity out-accelerates the terrain falling away.
- **2D canvas, no Three.js (Q6=C judgment call)** — keyframed day→night palette, banded Tiny-Wings-style hills, three parallax silhouette layers, motion trail, particles, dusk vignette. The sine-hill silhouette look reads *better* flat than it would in 3D, and it keeps the draft one file.
- **Pause story (Q2=B honored):** auto-pause the instant the tab/app loses focus (visibilitychange + blur + pagehide), a 48px ⏸ button top-right, and instant resume. A dropped run costs nothing.
- **Physics at a fixed 120Hz timestep** with pointer events and `touch-action: none` — input-to-dive latency is one frame; responsiveness was a hard requirement of this jam.

## Known simplifications / cut scope

All captured as checkboxes in [Improvements](ideas.md): no sound, no persistent best score (session-only, per the draft bar), no collectibles/coins along the arcs, no biome/island changes, single difficulty ramp that a top player can out-earn (daylight can be sustained indefinitely by elite play — flagged as Q4 in the questionnaire), minimal haptics, no trajectory hint, EN-only.

## What happens next

You play it on your phone and log a verdict line in [Kameko Playtest Log](../../playtest-log.md):
```
YYYY-MM-DD — flow-glider (draft) — keep|meh|kill — why
```
Then fill [Flow Glider Questionnaire — Verdict & Direction](../../archive/questionnaires/flow-glider-verdict-and-direction.md). **Keep** → promotion via `docs/promotion-checklist.md` (module split, tests, settings drawer, e2e, persistence). **Meh** → one iteration pass on what you flag. **Kill** → it stays in the Lab as a curio; the jam queue moves on to p3-08 (one-tower roguelike) either way unless the questionnaire says otherwise.
