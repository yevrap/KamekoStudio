# Samovar — design note

**Status:** PROTOTYPE, core mechanic only · built in iteration 08 ([SHS-068](../iterations/08/tickets/SHS-068-samovar-core.md)) ·
play it at `studio/games/samovar/` (the realm's shelf) · epic E2, *the studio's first
original game worth playing* ([Direction](../steering/direction.md)).

## What it is

An evening at the tea table. Ten guests come one at a time; each brings a small cup, a
teacup or a tall glass and wants their tea at a strength, shown as a colour swatch (Light,
Golden, Amber, Dark) beside the cup. One button, one thumb: hold to pour the dark brew
from the samovar's teapot, let go; hold again to top up with hot water, let go to serve.
The liquid in the cup is always the colour of what is in it, and its level is the total
against the brim.

A cup over the brim spills and scores nothing. Otherwise it scores 0–3 stars from the gap
between the poured and the wanted strength, less one star if it is short of the dashed
fill line at 90 % of the brim (two if it is under three quarters full). The result card shows the wanted and the poured
colour side by side for a moment, then the next guest comes. After ten cups: the evening's
stars out of 30, the best evening so far, a strip of each cup's stars, and *Pour again*.

## The hook

Tea is strong or weak by its **ratio**, not its amount. Because the brew goes in first and
the water only tops it up, the one real decision is how long to pour the brew for *this*
cup's size, and once the water goes in the strength is fixed. Each cup is a two-second
estimate whose result shows at once as a colour.

Against the genre: pour-the-drink phone games fill one liquid to a line. Here there are two
liquids, a hidden target ratio, and a brim that punishes both too much brew (the water no
longer fits) and too little (the cup is pale or short). No game named in the brief was used
as a blueprint.

**What the review found (sprint 08, IR08-1).** As built, the ratio is not hidden and the
cup's size is not the cue. Every cup is drawn with the same shape, and the liquid's height
is its volume over the cup's, so a three-star brew stops at the same share of every cup's
height: about half-way up for Amber, whether the cup is small or tall. While the brew
pours, the liquid is pure brew colour, so nothing else guides the stop. The real decision
is to stop at an imagined line at the wanted share of the cup, which is close to the
fill-to-a-line genre the hook set out to differ from. Sprint 09 acts on this with the
Playtester's Iterate: [questionnaire](../steering/questionnaire.md) Q15 and backlog #51–#53.

## The hypothesis (recorded before the build)

**It is fun if** a player's misses shrink over an evening (they can see the estimate
improving) and they start a second evening straight away. **It is not** if the cups feel
random or the colour match can't be read at a glance on a phone. The Playtester judges it
at iteration 08's review; its Keep / Iterate / Kill decides sprint 09.

## Tuning, and why

| Number | Value | Why |
|---|---|---|
| Pour rate | 80 units/s, brew and water alike | A tall glass takes about three seconds to fill, a small cup one and a half: long enough to judge, short enough for a ten-cup evening in about a minute |
| Cups | 120, 180, 260 units | Drawn so the bigger cup looks bigger. *Review 08:* with one shape for every cup the three-star brew stops at the same share of each cup's height, so size changes how long a pour takes, not where it stops (IR08-1) |
| Strengths | 25 %, 40 %, 55 %, 70 % brew | Four colours far enough apart on the ramp to tell at a glance (a test holds their luminance at least 25 apart) |
| Star bands | within 5 / 10 / 17 points of the wanted ratio | Three stars on a small cup needs the brew within about ±75 ms; on a tall glass about ±160 ms, so small weak cups are the hard ones |
| Fill line | 90 % of the brim | A band, not a line, meant to make the water the lesser skill. *Review 08:* it isn't yet. The band (10 % of the cup) is as long in time as the three-star brew window (about 150 / 225 / 325 ms for small / teacup / tall), and a miss over the brim costs every star while a strength miss costs one per band (IR08-2) |
| An evening | 10 of the 12 cup-and-strength pairs, drawn without replacement | Every cup and every strength turns up, and no pour is asked twice |

Pours are timed from `performance.now()` at press and release, not counted in frames, so a
120 Hz phone pours at the same rate as a 60 Hz one (Active rule 9). Hiding the page or
opening the settings drawer stops a pour where it is (the next hold carries on with the
same liquid) and holds the result card's timer.

## Verdict

**Iterate** (the Playtester, sprint 08 review, 2026-09-24). The loop reads at once and
becomes a skill curve once the player anticipates the stop (one evening 5 → 24 of 30 at
390 wide, 0 → 21 at 320), but a first evening with a normal reaction lag scored 0 of 30:
every cup spilled by a hair, some with the colour matched. What sprint 09 changes, from the
verdict and the review: a forgiving brim (#51), the same fill time on every cup and a result
card that leaves the rim in view (#52), and a decision the cup's size or shape really
changes (#53, Q15). Also noted: an evening lasts about a minute, and the best evening only
shows at its end.

## What was cut

Out of scope for the core, and waiting on a Keep: progression (harder guests, a tray of
several cups), guest personalities, sugar or lemon, a pour sound, a 3D portal on the
landing page (production code, `shared/3d/`), and the arcade gallery. A tap on the result
card to skip ahead was left out so a thumb still on the button can't brew the next cup by
accident.

## Tests

`tests/studio/samovar.test.mjs`: the rules without a browser, then in headless Chrome a
full evening poured by real pointer holds (30 of 30 stars), a spill, the best evening
surviving a reload under `studio_samovar_best` with no other key written, the pour at two
frame rates, pausing when hidden, the open drawer still holding the result after a hide
and show, Space pouring guest after guest without a Tab, and the layout at 320 and 390 wide with every cup size in
both themes.
