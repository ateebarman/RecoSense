# Frontend Style Guide

## Palette
- Primary: #646cff (var(--primary))
- Accent: #a6e22e (var(--accent))
- Surface / Card: #2f2f2f (var(--card))
- Background: #121212 (var(--bg))
- Muted text: #9aa0b4 (var(--muted))
- Danger: #e53935 (var(--danger))

## Typography
- Font family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif
- Base font-size: 16px
- Line height: 1.5
- Headings: bold, use scale: h1 1.6rem, h2 1.25rem, h3 1.05rem

## Spacing & Radius
- Spacing unit: var(--gap) = 1rem
- Border radius: var(--radius) = 8px

## Breakpoints
- Small: < 640px — stacked, single-column layouts
- Medium: 640–900px — compact grids
- Large: > 900px — multi-column grid

## Components
- Product Card: consistent image aspect-ratio (4:3), price accent color, accessible like button with `aria-pressed` and `aria-label`.
- Navbar: collapses to a vertical menu on small screens; toggle button should be keyboard accessible and have `aria-expanded`.
- Forms: inputs fill width on small screens; labels should remain visible and inputs have clear error states `error-message`.

## Accessibility & Interaction
- Focus states: use `:focus-visible` outlines
- Contrast: ensure text on surfaces meets AA contrast
- Images: use `loading="lazy"` for product images

## How to extend
- Add component-specific CSS variables when creating new components, and document changes here.

---

Design by: Recommender System UI improvements

Replace placeholder screenshots in `frontend/screenshots/` with real device captures for PR previews.
