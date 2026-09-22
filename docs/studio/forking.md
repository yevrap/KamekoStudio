# Forking

A **fork** is the studio's own copy of a production game, made the first time the studio
works on that game (direction rule 5). From then on the game's feature work happens in the
copy, and production gets bug fixes only. A fork is the opposite direction to a
[promotion](promotion.md): it brings a game *into* the studio's paths, so it needs no
exception to the path guard. It only reads production, and it writes only under `studio/`,
`tests/studio/` and `docs/studio/`.

The first fork is River Run (iteration 05, SHS-056). This page is the procedure it followed,
written down so the second fork can follow it. There is no fork script: a tool is built only
if the second fork shows the procedure needs one.

## What is copied

- The game's page and every file it loads from its own directory, into
  `studio/games/<slug>/`, copied from **one named production commit**. The latest commit
  that touched the game's directory is the natural choice; `git log -1 -- games/<slug>/`
  finds it.
- Nothing from `shared/`. The fork loads the same shared scripts production does
  (`shared/settings.js` for the drawer and the theme), by a path one directory deeper.
- CDN scripts stay on the same URLs as production.

## What is changed

Only these, and nothing a player would call gameplay:

| Change | Why |
|---|---|
| A provenance line at the top of the page: the source path and the full commit hash | The copy says where it came from, in the file itself |
| Every storage key renamed to `studio_<game>_<name>` | The storage rule. The fork never reads a production save, so a player's arcade progress neither leaks in nor gets overwritten |
| Any key the storage rule cannot read (a computed `setItem(opt.key, …)`) rewritten with a literal key | `storage-keys` must pass **with no exemption** |
| Reads of the arcade's `theme` key replaced by `document.body.classList.contains('dark-mode')` | `shared/settings.js` owns the theme and sets that class before the page's script runs. Reading its key would be a studio read of a production key |
| Watch Mode registered as `registerWatchSection('studio_<game>', …)` | `settings.js` builds the keys it writes from that prefix, so the prefix decides whose keys they are |
| Shared paths one level deeper (`../../../shared/…`) and `data-gallery-depth="3"` | The fork sits one directory deeper than `games/<slug>/` |
| The studio's page contract: a back link to the realm, 44px targets, a `<noscript>` explanation, and storage calls that survive blocked site data | The `studio-boot` check holds every page under `studio/` to it. Production games are not held to it, so a faithful copy usually fails it somewhere |
| The unnamespaced legacy keys some production games write (River Run's `muted`) | Renamed like the rest, with a row in `studio/README.md` naming the production key it replaces |

## How the copy is proved

The list of differences is data, in `tests/studio/lib/<slug>-fork.mjs`: each edit's text
before and after, and how many times the text occurs. Its test applies the list to the
source at the named commit and requires the result to equal the fork **byte for byte**. An
edit that is not on the list fails that equality, and a list that no longer matches its
source throws instead of applying halfway. River Run's is
[`tests/studio/lib/river-run-fork.mjs`](../../tests/studio/lib/river-run-fork.mjs).

That test proves the fork *started* faithful. Once the first experiment changes the game
on purpose, the equality test is retired with a note in the ticket that retires it. The
storage and browser tests stay.

Beside it, in a real browser: seed the production keys a player of the arcade would have,
load the fork, play a run to game over, toggle mute, start and stop Watch Mode from the
start screen and from the drawer, flip the drawer's own settings, and require every
non-`studio_` key to be exactly what it was. The same test also checks that the studio keys
were really written, because a fork that saved nothing would pass the first half.

## Then

1. Document every key in `studio/README.md` before it ships.
2. Add the fork to the shelf in `studio/shelf-data.js` with status `ITERATING`.
3. Tell the executive which arcade roadmap rows now belong to the fork. `docs/roadmap.md`
   is outside the path guard, so the studio doesn't edit it. The fork's rows go in the
   studio backlog.
4. **From then on, production takes bug fixes only.** A production bug fix does not flow
   into the fork on its own. If the fork still has the same code, the fix is applied to
   both.

## River Run: what the first fork found

- Production River Run reads `theme`, writes the unnamespaced `muted`, and saves its
  invert-drag setting through a computed key. All three are covered by the table above.
- It fails the studio's page contract in four places: no back link, a 21px mute button,
  no `<noscript>`, and an uncaught throw with site data blocked. Each is fixed in the fork
  as a listed edit. The same four hold in production, where the arcade's own rules apply.
- Its music restarts a Tone.js sequence on every new run, and now and then Tone rejects a
  start time a hair below zero. The audio code is untouched by the fork, so the error is
  inherited. The browser test names that one error signature exactly rather than ignoring
  errors in general, and the backlog carries the fix.
