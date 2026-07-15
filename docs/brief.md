# Kameko Studio — Taste Brief

The steering wheel for new-game generation. `/new-game` reads this first (Phase 1) before pitching. Written 2026-07-13 from the answered vault questionnaire `Kameko Studio Questionnaire — Taste and Tiers.md`; genre directions updated 2026-07-14 from the answered `Kameko Studio Questionnaire — New Game Directions.md` (archived in the vault). Edit those notes to re-steer and re-derive this.

Games are built **for Yev to play on his phone**, ~5 minutes at a time. He does the taste; agents do the generative grind. A draft's only job is to earn a verdict.

## What "good" means here (from Q2)

Durak is the benchmark. But when asked *why* durak is the good one, Yev checked exactly two things:

- **Nostalgia / cultural connection** — the game means something; it's not a generic time-killer.
- **Right session length** — 5–10 minutes, pick up and put down.

He explicitly did **not** check "decisions over reflexes," "a real opponent that pushes back," "rules I already know," or "card games specifically." So do not assume the appeal is deep strategy or that card games are inherently favored — the stated draw is *emotional resonance + the right session length*. A game can hit the brief by feeling familiar, warm, or culturally rooted, not only by being a thinky card game.

## Session shape

- **5–10 minute sessions**, pick-up-and-put-down. No long campaigns or grinds as the core loop.
- **Mobile-first portrait**, one-handed where possible. Pointer events, 44px targets, `touch-action: none` where gestures matter.
- **If the rules aren't universally known, teach them in-game** — short how-to overlay and/or coach hints + legal-move highlighting. Never assume rulebook knowledge. (Tysiacha earned its keep-verdict this way — teach-first.)

## Prototype bar (Q4 = Modest)

A draft must be **playable + comfortable on the phone + have a restart button** before Yev will play it. Not bare (ugly-but-works is *not* enough), not arcade-ready (polish is earned post-verdict, not spent up front). Single self-contained file in `drafts/`, no tests/modules/token hooks/theme integration — see `docs/promotion-checklist.md` for what promotion costs later.

## Cadence (Q5 = on-demand only)

Jams happen when Yev says "jam kameko." No scheduled auto-drafts yet — revisit adding a weekly cron once a few on-demand jams prove the loop produces things worth playing.

## Genre directions — ANSWERED (Q3 closed 2026-07-14)

Q3 was answered via the vault's `Kameko Studio Questionnaire — New Game Directions.md` (nine worked-up concepts; four winners). The jam queue lives as roadmap rows **p3-06…p3-09** — a seeded jam should build from its row, not re-pitch. In queue order:

1. ~~**Flow Glider (A1, p3-06).**~~ Jammed and **killed same day (2026-07-14)** — shipped as a Tiny Wings copy; see the no-reskins rule under Things to avoid.
2. **Pachinko roguelike (C3, p3-07).** Peglin-style orbs-through-pegs; double-counts as physics + mechanic-blend.
3. **One-tower roguelike + hero sortie (B1+, p3-08).** Waves converge on one tower; draft upgrades between waves; light unlocks persist across runs.
4. **Durak-deck score-attack roguelike (C1, p3-09).** Durak's beat mechanic as Balatro's poker — scoring-layer blend, explicitly not another durak variant.

Un-seeded/wildcard pitches are still welcome, but rank the queue above them. Directions considered and *not* picked (don't re-pitch without new signal): A3 3D marble slope, B2 lane TD with hero, B3 maze-builder TD, C2 scratch-card roguelike. (A2 flick golf *was* in this list until Yev asked for it directly on 2026-07-14 — exactly the new-signal path — and it jammed to the Lab as **Black Hole in One, p3-10**.)

New steering from the same questionnaire:

- **Pause-proof (Q2=B): a strong preference, not a house rule.** Judge per game; every jam's PLAYTEST.md should say how the game pauses. Auto-pause on focus loss + instant resume is the default pattern to reach for. Not added to the promotion checklist — deliberately.
- **Look/tech (Q6=C): per-game agent judgment call.** Polished 2D canvas vs Three.js is decided by what the concept demands, neither is the default ambition. "I want it to look cool" stands either way — budget for particles/gradients/trails even in 2D.
- **Scope path (Q7=A): the standard loop, always.** Jam to the Lab at the Modest bar → Yev playtests → verdict decides promotion. No straight-to-gallery builds, even for the top pick.

## What the lineup already tells us (from the tiers)

- **The three durak-likes (alchemist, dungeon, tactics) went to the Lab** — "mixed mechanics are interesting but not worth the main-page spot." Signal: a straight durak-mechanic reskin is a hard sell. A new card game needs its own reason to exist, not just durak-with-a-twist.
- **Waterfall was deleted.** Generic reflex filler doesn't survive.
- **Blob-zapper is Invest but its controls need rework** — "push to move" is disliked even when the graphics are liked. Control feel matters; don't ship a novel-but-awkward input as the core interaction.
- **River-run is Invest but wants a livelier auto-run / more depth** — a cool visualizer alone isn't enough.

## Things to avoid

- **No reskins of cited prior art (the Flow Glider lesson, 2026-07-14).** Games named in a design source ("Tiny Wings energy", "Desert Golfing proved the loop") are tone/feel references only, never blueprints. Before building, name what in the concept is genuinely new versus lifted — the core hook must be original. Flow Glider died for reproducing Tiny Wings' signature day/night-clock hook verbatim; Yev: "if I want a copy I'll ask."
- Don't re-pitch anything with a **kill** verdict in `Kameko Playtest Log.md` (read it every jam — kills are hard constraints, mehs are iteration requests, keeps are "more of this").
- Don't rebuild something the arcade already has (see the Games table in `CLAUDE.md`) unless the twist *is* the point.
- Don't assume deep strategy is the draw — see Q2 above.
- Don't spend polish before a keep-verdict.

## Free space (Q7)

Blank as of 2026-07-13 — no specific wished-for game or era-to-reinterpret named yet. If Yev fills it, it likely becomes a high-priority jam seed.
