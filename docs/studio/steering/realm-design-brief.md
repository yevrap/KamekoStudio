# Shadow Studio — Realm Design Brief

What the realm should look like, how you get into it, and how it shows its work. Three
directions, one recommended. Your picks go in [Shadow Studio — Questionnaire](questionnaire.md); nothing
here is built until they're made.

The placeholder live at https://yevrap.github.io/KamekoStudio/studio/ is **not** a
direction. It's tokens and layout with no identity, deliberately, so that this decision
isn't made by accident.

## What the realm has to say about itself

The production arcade says *play this*. The realm says something different, and the design
has to carry it:

1. **This is work, and the work is visible.** Unfinished things are the point. Anything
   that hides the process is designing against the concept.
2. **It's a place, not a page.** You go in and come back out — enough that leaving the
   arcade feels like a choice.
3. **It's honest about status.** A prototype, a thing being iterated, a killed experiment
   and a graduate all look different at a glance.
4. **It doesn't pretend to be the arcade.** Different mood, same quality bar.

## The three directions

### A. Backstage — the workshop behind the arcade ⭐ recommended

The room the cabinets are built in. Warm neutral ground, paper and pencil, exposed
structure, one amber worklight. Things sit on benches with tags on them.

| | |
|---|---|
| **Ground** | Warm off-white by day, near-black graphite at night |
| **Accents** | Amber worklight `#f0a84c`; a single cool teal `#3fd0e0` for anything interactive |
| **Type** | The arcade's system sans for UI; a monospace for tags, versions, iteration numbers |
| **Texture** | Thin rules, drop shadows like objects on a surface, a faint grid under everything |
| **Motion** | Things settle into place, 400 ms, ease-out. Nothing pulses, nothing glows |
| **Status** | Physical tags: a paper label per game reading PROTOTYPE / ITERATING / KILLED / PROMOTED |

**Why this one.** It is the concept, drawn. A visible workshop makes half-finished work
look intentional instead of unfinished, which is exactly the problem an experimental realm
has. It contrasts hard with the neon 3D arcade without competing with it, and it is the
cheapest of the three to execute well in vanilla CSS — no shaders, no heavy art, no assets.
It also ages well: it looks right with two games in it and right with twenty.

**Against it.** It's the least *fun* of the three at first glance. It reads as a tool.

### B. Instrument — the realm as a rig

Clinical and cold. Charcoal ground, cyan data, hairline borders, readouts and gauges. Every
game presented as an experiment under measurement: iteration number, checks passed, verdict
history. Closest to where the placeholder already is.

**For it.** Leans all the way into "a company that measures itself", which is the part of
this that is actually novel. Status is trivially legible when everything is a readout.

**Against it.** Cold to the point of unwelcoming, and it makes every game look like a test
case rather than a thing to play. Also the nearest neighbour to the existing arcade's dark
neon — the two would blur at a glance, which point 4 above says not to do.

### C. After hours — the arcade at 2am

The same arcade, closed. Low light, machines dark, one lamp on. New cabinets under dust
sheets; killed ones with their sheets still on, permanently.

**For it.** By far the strongest *place*. The portal transition writes itself, and the
"killed work stays visible but covered" metaphor is genuinely good.

**Against it.** The most art to make and the easiest to do badly; dark-on-dark is a
contrast trap on a phone in daylight; and the mood is melancholy, which is a strange
register for a workshop that is meant to feel productive.

## How you get in

Whichever direction wins, the entrance is the same shape.

**From the 3D landing page** (only once you approve the portal — see below). Not another
ring in the row. A single door in the front wall, behind where you spawn, so you find it by
turning around rather than by walking the perimeter. Warmer and dimmer than the game
portals; the prompt reads *Press E to enter the studio*, not the name of a game. Then a
plain navigation — no fade, no loader, no 3D scene transition. The realm is a different
place, and arriving abruptly is the correct feeling. A fade would imply continuity the
realm doesn't have.

**From the arcade home page,** a single quiet line in the footer, not a card in the grid.
The realm is not a game and shouldn't sit among them.

**Back out** is a persistent link, top-left, in the realm's own chrome. One tap, always
there. Leaving is never a hunt.

## The realm's home page

One page. No sub-navigation until there's something to navigate.

```
  ┌────────────────────────────────────────┐
  │ ← Arcade            Shadow Studio      │   persistent, 44px targets
  ├────────────────────────────────────────┤
  │  Iteration 04 · shipped 3 days ago     │   the company's pulse, one line
  │  What it did, in one sentence.         │
  ├────────────────────────────────────────┤
  │  ┌──────────┐  ┌──────────┐            │
  │  │  game    │  │  game    │            │   the shelf — one card each
  │  │ PROTOTYPE│  │ ITERATING│            │   tag, title, one line, iteration
  │  └──────────┘  └──────────┘            │
  │  ┌──────────┐                          │
  │  │  game    │                          │
  │  │  KILLED  │  (dimmed, still there)   │
  │  └──────────┘                          │
  ├────────────────────────────────────────┤
  │  What the team changed about itself    │   one line from the last retro
  │  How it works →  (the repo handbook)   │
  └────────────────────────────────────────┘
```

- **One card per game**, in a grid that is one column on a phone and two or three above
  520px and 900px. Card shows: status tag, title, one sentence, the iteration it arrived
  in, and the date it last changed.
- **Killed work stays on the shelf**, dimmed, tagged KILLED, not playable. That is what
  "stays in git history, out of the gallery" should look like to a person: visible as
  history, absent as an offer.
- **The pulse line** at the top is the realm's one live element — what the last iteration
  did. It is the thing that makes the place feel run rather than published.
- **A link to the handbook** at the bottom. Anyone curious about how this is made goes to
  the repo docs; the realm doesn't re-explain itself.

## The portal change, and what it costs

The technical survey is in the repo at `docs/studio/iterations/00/findings-3d.md`. The
short version, because it changes the decision:

- `3d.html` contains none of the landing page. The portal list and the scene live in
  `shared/3d/constants.js` and `shared/3d/gameplay.js` — both production files, both
  outside the path guard.
- **The page can only show nine portals, and there are eleven games.** Black Hole in One
  and Maze Warden already have no portal, and nothing reported it. A studio portal appended
  to the list would be the twelfth and simply wouldn't appear.

So there are two separate approvals here, and they are not the same decision:

| | What | Recommendation |
|---|---|---|
| **1** | Add a front-wall row of positions, taking the room from nine portals to twelve. Fixes the two missing production games. | **Approve.** It's a production bug, it's worth fixing on its own, and the diff is written and ready. |
| **2** | Add the studio's own portal entry. | **Hold** until the realm has a gallery worth entering. An empty room behind a door is worse than no door. |

Both diffs are written out in full in the findings note, so approving is a review, not a
request to go figure it out.

## What gets built once you pick

- A stylesheet of identity tokens, replacing the placeholder's.
- The home page above, with a real card component and the status tags.
- A data file the cards are generated from, so adding a game is one entry.
- The back-out chrome.
- Then, if approved, the portal — made last, in its own reviewed commit, per the guardrails.

---

*Decisions: [Shadow Studio — Questionnaire](questionnaire.md) · Design: [Shadow Studio](design.md) · Hub:
[Shadow Studio Index](README.md)*
