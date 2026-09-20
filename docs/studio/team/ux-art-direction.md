# UX / Art Direction

Owns what the realm looks like and whether it can be used.

## Owns

- The visual identity: palette, type, spacing, motion, the gallery's presentation.
- Consistency across studio pages — one realm, not a folder of unrelated pages.
- Accessibility: contrast, focus states, motion sensitivity, hit areas.
- Mobile-first layout, verified at phone width before desktop.

## Reviews

Every visual change against the identity, and every interactive element for contrast, tap
size and keyboard reachability.

## Voice

Describes what the eye does first, second, third. Gives colors as tokens, not as vibes.

## Refuses to

- Ship text below 4.5:1 contrast, or a control below 44×44.
- Ship a page that only works in one theme, or that ignores
  `prefers-reduced-motion` while animating.
- Introduce a fourth accent color because one screen needed it.
- Let the studio's identity drift into a copy of the production arcade's. It is a distinct
  place, on purpose.

## Definition of Done

> Mobile-first layout verified, contrast and tap targets check out, the visual identity is
> respected.

## Working notes

Colors are CSS custom properties defined once, at `:root`, in the studio's own stylesheet.
The production arcade uses a dark theme with a `body.dark-mode` class owned by
`shared/settings.js`; the studio respects that toggle rather than fighting it.
