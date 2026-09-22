# Skazka Trail — Jam Brief (Vasilisa the Beautiful pilot)

> Turns the answered [Skazka Trail Questionnaire — Design Decisions](../../../archive/questionnaires/skazka-trail-design-decisions.md) into an actual buildable scope for the first jam. See [Skazka Trail — Concept & Directions](concept-and-directions.md) for full rationale. Execution tracked in `Backlog.md` (this folder) and `Dev Log.md`.

**Pilot tale:** Vasilisa the Beautiful (Baba Yaga) — **not** Morozko (Q3=B overrides the concept doc's ⭐ recommendation). The concept doc's MVP-slice section illustrates the mechanic using Morozko; this brief adapts the same flag-based/rule-of-three structure to Vasilisa's own trials.
**Target:** `drafts/skazka-trail/` in this repo, Modest prototype bar — **playable, phone-comfortable, restart button, nothing more.** Bare text (Q7=A), English only (Q8=A).

---

## Story structure — Vasilisa the Beautiful

Faithful to the Afanasyev-collected tale (mother's death → doll → cruel stepfamily → sent for fire → Baba Yaga's hut → three chores → the Three Riders → the forbidden question → the fire that judges the stepfamily). Kept real per Q6: the dark ending stays dark, no softening.

**Flags tracked:**
- `dollHelp` (0–3) — across the three chores, how often Vasilisa leaned on her mother's doll instead of doing it alone. Doesn't hard-branch the ending, but changes Baba Yaga's closing-question flavor text (accumulated-flag routing per Q4, not just the last click).
- `curiosity` (0–3) — across the three roadside Riders (White/Day, Red/Sun, Black/Night), how often she stopped to watch instead of hurrying past.
- `askedForbidden` (bool) — set only if she asks about the disembodied Hands in Baba Yaga's yard.
- `answeredHonestly` (bool) — her answer to Baba Yaga's "how did you finish in one night?"

**The callback-gate (Q4's early-choice-locks-a-later-scene mechanic, concretely):** the option to ask about the Hands only *appears* at the Q&A scene if `curiosity >= 2`. A reserved playthrough (hurried past the Riders each time) never even sees the trap; a curious one is tempted into it. This is the direct Vasilisa-native equivalent of the Geese-Swans callback pattern the concept doc describes.

**Scene graph (17 nodes):** `intro` → `sentForFire` → 3× rider scenes (`rider_white/red/black`, each a watch/hurry choice) → `arrival` → 3× chore scenes (`chore_grain/cook/clean`, each an alone/doll choice) → `qanda_riders` (branches to `qanda_riders_answer`, `qanda_silent`, or — gated — `qanda_forbidden`) → `qanda_final` (the honest/evasive choice) → one of 3 endings.

**Endings (Q5=B, 3 total):**
1. **"Blessing's Fire"** — `askedForbidden=false` + `answeredHonestly=true`. The real/canonical ending: Baba Yaga, repelled by the word "blessing," drives Vasilisa out with the fire; the skull's eyes burn the stepmother and stepsisters to cinders by morning. Dark but earned — the source tale's actual ending, unsoftened.
2. **"The Bargain Kept"** — `askedForbidden=false` + `answeredHonestly=false`. She lies about the doll's help. Baba Yaga isn't repelled (no "blessing" spoken) but a bargain is a bargain — the fire is handed over cold and unimpressed. It still judges the stepfamily; but back home, the doll goes silent — the quiet cost of denying her mother's gift once. Bittersweet middle path per Q5's own rationale ("mostly kind, one slip").
3. **"The Price of Prying"** — `askedForbidden=true`, overrides everything else. She asks about the one thing she was warned not to ask about. This is the tale's own stated danger (Baba Yaga's real warning: those who ask too much don't get to leave) played straight, not softened — ends on the threshold, in the tale's own restrained voice, same register as the Morozko doc's handling of its own dark 0/3 ending.

## Engine architecture (Q10)

Deliberate exception to the drafts/ single-file convention: this prototype ships as **`index.html` (markup + inline CSS) + `engine.js` (reusable) + `tales/vasilisa.js` (content pack)** rather than one inline file. That split *is* the design requirement — Q10 locked in "one shared story engine + a small content-pack file per tale," and the whole anthology's future depends on `engine.js` being tale-agnostic from day one. `engine.js` knows nothing about Vasilisa; it renders whatever scene/choice/flag/ending shape a content-pack object gives it. The next tale (whichever gets picked after this verdict, per Q9=C) should be able to plug in as `tales/<name>.js` with zero engine changes.

## Q12 — seeing the branches

Two views, both the simplest version that clears the Modest bar:
- **Dev/debug graph view** — a plain-text dump of every node in the loaded content pack (id, narration excerpt, each choice's flag deltas and target, which nodes are endings), reachable at `?debug=1`. Not a visual node-link diagram — a readable list is enough to verify all paths exist and check flag math by hand.
- **In-fiction "story so far" page** — a `📜 Story so far` button visible during play, opening an overlay that lists, in order, the choices actually made this playthrough (scene prompt → choice picked). This is also what powers each ending screen's own recap line.

## Explicitly out of scope this jam (→ Backlog Parked)

- CSS motifs / illustration (Q7=A chose bare text)
- Russian localization (Q8=A, English only for the pilot)
- The mirrored stepsister-style second playthrough (Q11=B, deferred to iteration 2, gated on this verdict)
- `localStorage` endings-seen counter (a good replay hook per the concept doc, but not asked for in the Modest-bar scope this round — "nothing more" per the ask)
- Any second tale / anthology order (Q9=C — picked fresh after this verdict)

---

*Brief written 2026-07-22 from the answered questionnaire. Jams to `drafts/skazka-trail/`, logs to [Kameko Playtest Log](../../../playtest-log.md) for verdict.*
