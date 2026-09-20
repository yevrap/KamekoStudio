# SS-012 — The realm wears the Backstage identity instead of placeholder tokens

- **Status:** Done
- **Size:** M
- **Iteration:** 01
- **Role lead:** UX / Art Direction
- **Depends on:** none
- **Branch:** `ss-012-backstage-identity`

## Motivation

`studio/style.css` carries deliberately identity-free tokens, written in iteration 00 so
that the visual identity would not be decided by accident. The direction is now decided —
Backstage, the workshop behind the arcade — so the placeholder tokens are replaced by the
real ones.

## Acceptance criteria

- [ ] The stylesheet defines the Backstage token set: a warm off-white ground in light mode
      and a near-black graphite ground under `body.dark-mode`, an amber worklight accent
      `#f0a84c` (and its light-mode counterpart), and a single cool teal `#3fd0e0` reserved
      for interactive elements.
- [ ] A monospace family token exists and is used for tags, versions and iteration numbers;
      the system sans continues to carry UI text.
- [ ] A faint grid sits under the page in both themes, and surfaces read as objects on it —
      thin rules and a soft drop shadow rather than flat panels.
- [ ] Motion is settle-only: no element pulses, glows or loops. Existing entry motion stays
      within 400 ms, ease-out, and remains behind `prefers-reduced-motion`.
- [ ] Body text, dimmed text and accent-on-ground each meet WCAG AA contrast (4.5:1, or
      3:1 for text at or above 24px) in **both** themes.
- [ ] No binary assets are added: the grid and every texture are CSS.
- [ ] The light/dark toggle still comes from the arcade's shared settings script via
      `body.dark-mode`; the realm declares no toggle of its own.

## Evidence plan

- Contrast: computed ratios for each named pair, recorded on this ticket.
- `npm run studio:check -- --stage=ticket` green.
- The placeholder page renders under both themes at 360px and 1280px; recorded on the
  ticket as what was looked at and what was seen.

## Out of scope

- The home page's structure — that is SS-013. This ticket changes tokens and the treatment
  of the shapes already on the page.
- Any new page or component.

---

## Result

- **What changed:** `studio/style.css` replaced token for token. Warm off-white ground
  (`#f2efe9`) and paper surfaces by day, graphite (`#131418`) at night; amber worklight
  `#8a4b0c` light / `#f0a84c` dark, used only for status and focus; teal `#0f6d7a` light /
  `#3fd0e0` dark, used only for links and interactive borders. A monospace token carries
  the eyebrow, tags, code, dates and iteration numbers. A 24px grid sits under the page at
  4.5% ink, and surfaces lift off it with a hairline border and a two-stop shadow. Entry
  motion renamed to `settle`, 400 ms ease-out, still behind `prefers-reduced-motion`; the
  status tag lost its pill radius for a 3px paper corner. `studio/README.md`'s description
  of the stylesheet was updated to match.

- **Tested by:**
  - Contrast, computed from the sRGB relative-luminance formula, all sixteen pairs AA or
    better. Light: ink/ground 14.82:1, ink/surface 16.18:1, dim/surface 7.19:1,
    dim/ground 6.59:1, teal/surface 5.72:1, teal/ground 5.24:1, amber/surface 6.46:1,
    amber/tag-wash 5.42:1. Dark: 14.77, 13.52, 6.27, 6.85, 9.07, 9.91, 8.35, 7.83:1.
    The tag washes are flat literals precisely so they can be measured.
  - Headless Chrome at 360x780 and 1280x900, each in both themes: no uncaught errors, no
    console errors, no horizontal overflow (scrollWidth == innerWidth at both widths), and
    no `a`/`button` shorter than 44px.
  - `npm run studio:check -- --stage=ticket` green: path-guard, storage-keys, studio-tests.

- **Deferred:** nothing.

- **Fix rounds used:** 1 / 2 — the first draft cut the body's top padding from 64px to
  24px, which put the arcade's fixed settings control on top of the page's first line. The
  padding is restored with a comment naming why it cannot shrink. Found by looking at the
  rendered page, not by a check; no check covers it, which is recorded in the retro.
