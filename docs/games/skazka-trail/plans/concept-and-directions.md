# Skazka Trail — Concept & Directions

> **Working title: "Skazka Trail"** (*skazka* = сказка, "fairy tale" — final name is Q1 of the questionnaire). A new Kameko Arcade game: a **turn-based, choice-driven anthology of classic Slavic/Soviet-origin folk tales**, where each tale is a short branching story and the choices you make — not just cosmetic ones — genuinely change what happens and which ending you land on.
>
> **What this is:** the concept + design forks for Yev's July 22, 2026 ask — *"a game that tells classic stories from soviet/slavic origin, turn based, decision based, multiple choice with outcomes that really do depend on the player's choice, different endings based on choices."* Decisions get made in [Skazka Trail Questionnaire — Design Decisions](../../../archive/questionnaires/skazka-trail-design-decisions.md), then a jam brief + `Backlog.md` follow. **Starts life as a Lab game** — jam one tale to `drafts/`, get a playtest verdict, then grow the anthology tale by tale, same loop as every other Kameko game.
>
> **This un-shelves an existing pitch, not a blank-slate idea.** [What to Build Next — Proposals & Questionnaire (July 2026)](../../../questionnaires/what-to-build-next.md) already scoped this exact concept as **Pitch B — Skazka Trail** ("short interactive Russian-folklore vignettes... a few real choices, warm and a little dark like the originals... story graphs authored at build time... the anthology grows tale by tale"). That questionnaire's Q1 defaulted to shelved on 2026-07-21 for going unanswered — Yev's direct ask today is the un-shelving signal, the same "new-signal path" that turned benched ideas into [Black Hole in One](../../black-hole-in-one/README.md) and [Maze Warden](../../maze-warden/plans/concept-and-directions.md). This note takes that one-paragraph pitch and turns it into an actual buildable design.

---

## The concept in one paragraph

Each tale is a short sequence of scenes — narration, then a real choice, repeated a handful of times, ending in one of several distinct outcomes. There's no combat, no reflexes, no timer: a "turn" is one scene-and-choice, and the board is always at rest, so the game is **pausable by construction** (same trick that makes Black Hole in One and Desert Golfing-style games work mid-interruption). What makes it a *game* and not just a story you read is that folk tales already have the right bones for this: many of them are built on the **rule of three** (three trials, three riders, three brothers, three wishes) and on **choices that are tested again later** (help refused early costs you when you need it on the way back). The design leans into that existing structure instead of inventing branching from scratch — the folklore was already halfway to a choice-driven game.

---

## Why folk tales specifically suit this format

- **The "rule of three" is a built-in trial system.** Morozko tests the stepdaughter three times with the same question at rising stakes; Baba Yaga sets Vasilisa impossible tasks and a riddle about three riders; heroes get three roads, three wishes, three brothers. That's already the shape of a game mechanic — accumulate a trait across three trials, branch on the total, not just the last click.
- **Choices get called back on, not just paid off immediately.** In *The Geese-Swans*, the girl refuses the stove/apple-tree/river's offered food out of pride on the way out — and on the way back, fleeing with her brother, she needs their help and this time accepts it. The same offer, twice, with the earlier answer changing what's available later. That's a real game-design pattern (a flag set in scene 2 gates an option in scene 8), not something that has to be invented for this.
- **Endings already diverge on behavior, not luck.** Kindness is rewarded, patience is rewarded, greed and cruelty are punished, cleverness beats brute force — the morals are stated plainly ("and that is why..."), which gives every ending a natural one-line payoff screen instead of needing invented narrative justification.
- **A helper you were kind to earlier can return.** Sparing or feeding an animal early (a pike, a bear, an eagle) is frequently why it saves your life later — a clean "was I kind in Act 1?" flag with a payoff in Act 3.

---

## Candidate tales

All of these are traditional oral/collected folklore (public domain — see the IP note below), the versions most people raised in the Russian-speaking world actually met through Soviet-era illustrated books and Soyuzmultfilm animation rather than 19th-century academic collections.

| Tale | Core moral | Natural choice points | Why it fits a branching game |
|---|---|---|---|
| **Морозко / Morozko** (Father Frost) | Patience and quiet kindness are rewarded; rudeness is punished | Three rounds of "Are you warm, maiden?" at rising cold — answer politely, complain, or stay silent | The source tale is **already** a clean binary branch (kind stepdaughter rewarded / cruel stepdaughter punished) — cheapest possible proof of the format |
| **Василиса Прекрасная / Vasilisa the Beautiful** (Baba Yaga) | Know when to ask and when to stay silent; quiet competence over showing off | Baba Yaga's three impossible chores (do them alone or lean on the doll's help), which of the Three Riders to ask about, whether to answer Baba Yaga's "how did you do this?" honestly or evasively | Richest branching of the set — task-trial + a real riddle/knowledge-check mechanic, not just a mood pick |
| **Гуси-лебеди / The Geese-Swans** | Pride costs you; humility saves you | Accept or refuse the stove/apple-tree/river's food on the way out; the *same* offer returns on the way back | The cleanest "your Act 1 choice gates your Act 3 options" structure of any tale here — teaches the callback-flag mechanic other tales can reuse |
| **Иван Царевич и Серый Волк / Ivan Tsarevich and the Grey Wolf** (Firebird) | Don't get greedy; loyalty and mercy matter | The crossroads stone (go left, right, or straight — literally spelled out in-story); take only what you were told each time or grab more; forgive or punish the treacherous brothers at the end | Longest tale, a literal choice-point already written into the source, repeated temptation choices, and a genuine moral fork at the ending |
| **Садко / Sadko** (Novgorod bylina) | Generosity and restraint over greed | How to win the Sea Tsar's favor (boldness vs. humility); which bride to choose in the undersea court, and whether to embrace her | Different register — heroic epic, not a fairy tale — good for variety later; restraint-vs-greed ending fork |
| **Марья Моревна / Koschei the Deathless** (via *Marya Morevna*) | Kindness to the small and weak repays itself when least expected | Spare or kill the animals you meet early (a falcon, an eagle, a raven); which nested object to search for first when Koschei's death (needle → egg → duck → hare) must be found | Best as a later "capstone" tale — reuses the spare-the-animal callback other tales seed, higher content cost |

**IP note:** stick to pre-1900s collected oral tales (Afanasyev-era and earlier) as the content source — these are public domain with no living author or studio holding rights. Soviet-era Soyuzmultfilm cartoons and literary works (e.g. Volkov's *Wizard of the Emerald City*, Nosov's *Dunno*) are a fine **tone/aesthetic** reference for what "Soviet-Slavic" nostalgia feels like, but their specific character designs and adapted texts are their own copyrighted works — don't lift character likenesses or exact scene staging from them. This is a low-stakes hobby project either way, but it's a clean line to hold.

---

## Recommended anthology order

Not "build all of these" — one tale at a time, jam → playtest → verdict, same loop as every other Kameko game. Order matters because each tale proves a slightly bigger piece of the engine before the next one needs it:

1. **Morozko** ⭐ — pilot tale. Almost-binary branch structure, cheapest to build, proves the core loop (scene → choice → flag → ending) fastest.
2. **The Geese-Swans** — proves the callback-flag mechanic (an early choice gating a later scene), which every later tale leans on.
3. **Vasilisa the Beautiful** — proves task-trial branching plus a real riddle/knowledge check, not just a mood pick.
4. **Ivan Tsarevich and the Grey Wolf** — longest, proves a multi-act quest structure with repeated temptation choices.
5. *(stretch, later)* **Sadko** — genre variety (bylina, not fairy tale).
6. *(stretch, later)* **Marya Morevna / Koschei** — capstone, reuses the spare-the-animal callback across the whole anthology.

Which tale is actually the pilot, and whether this order is right, is **Q3** of the questionnaire.

---

## Mechanics

**Turn structure:** a "turn" is one narrated scene plus a 2–4 option choice. No timers, no reflexes — the story never advances without a tap, so it's pausable by construction, no auto-pause logic needed.

**How choices matter (the load-bearing decision):** the source material argues for a **flag-based hybrid**, not a pure branching tree and not a single end-of-story fork:
- Each choice can set a flag or increment a trait (e.g. *patience+1*, *sparedTheFalcon = true*).
- Some scenes route on the *accumulated* flags (all three trial answers, not just the last one) — this is what makes the "rule of three" actually feel earned rather than arbitrary.
- A flag set early (spared an animal, accepted a stranger's food) can silently unlock or lock an option many scenes later — the *Geese-Swans* callback pattern.
- A pure branching tree (every choice → a unique new scene) is the most narratively "pure" option but the content cost explodes fast (a 4-choice, 5-deep tree is 1,024 unique end-states); the flag-hybrid gets the same *felt* agency for a fraction of the writing.

**Endings:** each tale ends on one of several distinct endings — a title, a short "here's what led here" recap naming the actual choices, and a one-line moral in the tale's own voice. Endings-seen-per-tale is worth tracking (small `localStorage` counter, no accounts) — it's a natural, cheap replay hook: folk tales are short enough that "go back and answer differently" is genuinely appealing, not busywork.

**Engine architecture:** a single reusable **story engine** (renders scene text + choices, applies flag deltas, resolves routing, shows the ending screen) shared across all tales, with each tale as its own small **content pack** (a JS/JSON file: nodes, choices, flags, endings — no code). This is the same shape as the already-pitched "Salon Engine" idea (Astro Salon's teach-through-play loop as a reusable base for other content packs) — proven pattern in this studio, and it's exactly what lets "the anthology grows tale by tale" (the original pitch's own words) actually hold up as more tales get added by whatever session picks one up.

**No runtime AI, no backend.** Story graphs are authored at build time and shipped as static content — keeps the zero-backend, GitHub Pages-only rule the rest of the arcade follows, and keeps outcomes honest (a choice does the same thing every time, not something an LLM improvises differently per play).

---

## Recommended MVP jam slice (Modest bar) — illustrative, using Morozko

What the first `drafts/` prototype could actually contain if Morozko is the pilot (final shape depends on the questionnaire):

- **Setup scene:** stepmother, cruel stepsister, kind stepdaughter (the player) — she's sent into the winter forest. No real choice yet, just scene-setting.
- **Three trial scenes:** Morozko appears at rising cold each time and asks *"Are you warm, maiden?"* Each time: **A** — answer warmly/politely (patience+1), **B** — admit it's freezing (patience+0), **C** — stay silent and bow (patience+0, but flags *composure*).
- **Ending branch on accumulated patience (0–3):**
  - **3/3 — "The Gift"** (canonical happy ending): Morozko, moved, wraps her in furs and sends her home with chests of silver.
  - **1–2/3 — "Mercy"** (a game-original middle path, consistent with the tale's own moral logic but not in the canonical text — flagged as an addition): he spares her and sends her home safe, but empty-handed.
  - **0/3 — "The Silence"**: the canonical dark ending (she freezes) is the honest version of this outcome — whether to actually ship it that dark, or soften it to "she turns back before the third trial," is **Q6** of the questionnaire.
- **Stretch (same-tile scope or first fast-follow):** a second, mirrored playthrough as the stepmother's own rude daughter — same three trial scenes, opposite answers available, same engine — a strong replay hook and a clean way to show "your choices are actually you" by contrast. Whether this ships in the pilot or waits for iteration 2 is **Q11**.

That slice contains the entire loop (setup → repeated trial → accumulated consequence → distinct ending), which is what a playtest verdict needs to judge — everything else (more tales, illustration, sound) is post-verdict.

---

## How it fits Kameko Arcade

| Constraint | How Skazka Trail meets it |
|---|---|
| **No backend / GitHub Pages** | Story content is static JS/JSON; the only persisted state is a small `localStorage` "endings seen" tracker. ✅ |
| **Vanilla JS (+Three.js only if earned)** | Pure text/DOM rendering; no 3D needed. Visual identity is CSS motifs at most (Q7). |
| **5–10 min sessions** | One tale ≈ 6–10 turns, a few minutes; nothing to lose by quitting mid-tale except the current scene. |
| **Pausable (strong preference)** | Pausable *by construction* — nothing ever advances without a tap, same trick as Black Hole in One's flick-golf pacing. |
| **Teach-in-game** | Self-explanatory format (narration + tap a choice); no dedicated tutorial needed. |
| **Modest prototype bar** | Pilot tale is one self-contained `drafts/` file; illustration, sound, and the second tale are promotion-time investments, deferred. |
| **Standard loop (no straight-to-gallery)** | Jam to the Lab → Yev playtests → verdict in [Kameko Playtest Log](../../../playtest-log.md) decides promotion, like every other game. |

---

## Original hook vs. adapted material

The folk tales themselves are traditional and public domain — retelling them isn't the "no-reskins" problem the studio watches for (that rule is about copying an existing *video game*, e.g. Flow Glider vs. Tiny Wings). What's actually original here is the **interactive layer laid on top**: the flag-based trial system, the specific ending-branch design per tale, the callback mechanic, and the shared reusable engine that lets the anthology grow. The source tales are linear oral narratives — the branching, the player agency, and the "your choices are actually you" framing are the game's own invention.

---

## Open questions → the questionnaire

The forks that actually change the build are in [Skazka Trail Questionnaire — Design Decisions](../../../archive/questionnaires/skazka-trail-design-decisions.md): the name, source scope, which tale is the pilot, the branching mechanic, ending count, tone (how dark to go), visual bar for the jam, language, the anthology order, engine architecture, and whether the mirrored second-playthrough ships in the pilot.

## What happens next

1. **Yev answers [Skazka Trail Questionnaire — Design Decisions](../../../archive/questionnaires/skazka-trail-design-decisions.md)** (no chat back-and-forth needed).
2. A short planning pass turns the answers into a **jam brief + `Backlog.md`** in this folder (and a repo `docs/roadmap.md` entry once it's ready to jam).
3. **Jam the pilot tale to the Lab** at the Modest bar → Yev plays → [Kameko Playtest Log](../../../playtest-log.md) verdict decides whether the anthology keeps growing.

**Ready-to-paste prompt for the jam (questionnaire answered 2026-07-22):**
> *"Read `Skazka Trail — Concept & Directions` and the answered `Skazka Trail Questionnaire — Design Decisions`. Pilot tale is Vasilisa the Beautiful (Baba Yaga), not Morozko — the doc's MVP slice section illustrates the mechanic using Morozko, so adapt that same flag-based/rule-of-three structure to Vasilisa's own trials (Baba Yaga's three impossible chores, the Three Riders riddle, whether to answer 'how did you do this?' honestly). Turn the answers into a jam brief + Backlog.md in the Skazka Trail folder, then jam the pilot tale to the KamekoStudio Lab (drafts/) at the Modest bar — bare text only, no CSS motifs, English only, 3 endings, keep the dark ending real. Also build a way to see the branches: a dev/debug view of the full story graph for testing, plus an in-fiction 'story so far' page the player can open during play. Log it in the Kameko Playtest Log for my verdict."*

*Created July 22, 2026 from Yev's turn-based/choice-driven folk-tale ask. Decisions live in [Skazka Trail Questionnaire — Design Decisions](../../../archive/questionnaires/skazka-trail-design-decisions.md). Design-source lineage: [What to Build Next — Proposals & Questionnaire (July 2026)](../../../questionnaires/what-to-build-next.md) §B (un-shelved).*
