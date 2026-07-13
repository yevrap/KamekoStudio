# Kameko Studio — Taste Brief

The steering wheel for new-game generation. `/new-game` reads this first (Phase 1) before pitching. Written 2026-07-13 from the answered vault questionnaire `Kameko Studio Questionnaire — Taste and Tiers.md`; edit that note to re-steer and re-derive this.

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

## Genre directions — OPEN (Q3 unanswered)

**Q3 of the questionnaire is still blank.** Until it's answered, jams run on the durak-benchmark fallback: rules the player knows or learns in one round, 5–10 min sessions, mobile portrait, card/turn-based thinking games ranked above pure reflex arcade. The candidate directions Yev has *not yet* picked among:

- More card games (durak variants, Tysiacha-likes, Kozel, Preferans-lite)
- Turn-based strategy (Hex Drift direction)
- Puzzle / logic (Signal Tower direction)
- Word & cognition (Glyph Run / keypad direction)
- Games Max could play in a year or two (age 3–4: tap, colors, sounds)
- Reinvented arcade (reflex only if the twist is genuinely new)
- Wildcard within the brief

Pitch across these; treat none as confirmed until Q3 lands.

## What the lineup already tells us (from the tiers)

- **The three durak-likes (alchemist, dungeon, tactics) went to the Lab** — "mixed mechanics are interesting but not worth the main-page spot." Signal: a straight durak-mechanic reskin is a hard sell. A new card game needs its own reason to exist, not just durak-with-a-twist.
- **Waterfall was deleted.** Generic reflex filler doesn't survive.
- **Blob-zapper is Invest but its controls need rework** — "push to move" is disliked even when the graphics are liked. Control feel matters; don't ship a novel-but-awkward input as the core interaction.
- **River-run is Invest but wants a livelier auto-run / more depth** — a cool visualizer alone isn't enough.

## Things to avoid

- Don't re-pitch anything with a **kill** verdict in `Kameko Playtest Log.md` (read it every jam — kills are hard constraints, mehs are iteration requests, keeps are "more of this").
- Don't rebuild something the arcade already has (see the Games table in `CLAUDE.md`) unless the twist *is* the point.
- Don't assume deep strategy is the draw — see Q2 above.
- Don't spend polish before a keep-verdict.

## Free space (Q7)

Blank as of 2026-07-13 — no specific wished-for game or era-to-reinterpret named yet. If Yev fills it, it likely becomes a high-priority jam seed.
