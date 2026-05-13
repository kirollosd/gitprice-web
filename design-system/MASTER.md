# GitPrice Design System — MASTER

> Single source of truth for all gitprice-web pages.
> Page-specific overrides live in `design-system/pages/<page>.md`.
> When building a page, check pages/ first; if no override, use this file exclusively.

---

## Brand Identity

**Product:** GitPrice — Chrome extension for cross-platform price comparison (Amazon.eg, Noon, Jumia).
**Aesthetic:** Apple-inspired. Clean, spacious, typography-driven, light-first.
**Voice:** Direct, confident, savings-focused.

---

## Logo Usage

| Context | Asset | Size |
|---------|-------|------|
| Nav / Header | `icons/icon-inverse.svg` (inline) + "GitPrice" Sora 700 text | 28×28px icon |
| Footer | Same as nav | 24×24px icon |
| Favicon | `icons/icon-128.png` | `<link rel="icon">` |

**Rules:**
- Never use the "GP" text-in-SVG placeholder.
- Always show icon alongside wordmark in headers/footers/prominent placements.
- Icon background colour is `#2D415E` (brand navy) — do not recolour.

---

## Color Palette

```css
:root {
  /* Surfaces */
  --white:       #ffffff;
  --gray-50:     #F5F5F7;
  --gray-100:    #E8E8ED;
  --gray-200:    #D2D2D7;

  /* Text */
  --gray-400:    #8E8E93;
  --gray-500:    #6E6E73;
  --gray-900:    #1D1D1F;

  /* Brand accent */
  --accent:      #34d399;
  --accent-dk:   #10b981;
  --accent-lt:   rgba(52, 211, 153, 0.10);
  --accent-bdr:  rgba(52, 211, 153, 0.22);

  /* Brand icon */
  --brand-navy:  #2D415E;
}
```

---

## Typography

| Role | Family | Weight | Size | Tracking |
|------|--------|--------|------|----------|
| Hero headline | Sora | 800 | clamp(44px, 7.5vw, 96px) | −3.5px |
| Section h2 | Sora | 800 | clamp(28px, 3.5vw, 46px) | −1.5px |
| Nav / labels / CTAs | Sora | 600–700 | 12–16px | −0.3px |
| Body | Karla | 400 | 15–18px | 0 |
| Meta / captions | Karla | 400 | 12–13px | 0 |

Fonts self-hosted (no CDN): `fonts/sora-latin.woff2`, `fonts/sora-latin-ext.woff2`,
`fonts/karla-latin.woff2`, `fonts/karla-latin-ext.woff2`.

---

## Spacing

Base unit: **8px**. All values multiples of 4 or 8.

| Token | Desktop | ≤900px | ≤768px |
|-------|---------|--------|--------|
| `--pad-section` | 120px | 80px | 64px |
| `--nav-h` | 52px | 52px | 52px |
| Container max-width | 1100px | fluid | fluid |
| Centred CTA max-width | 680px | fluid | fluid |
| Horizontal gutter | 24px | 24px | 16px |

---

## Components

### Navigation
- `position: fixed`, `height: 52px`
- `background: rgba(255,255,255,0.82)` + `backdrop-filter: saturate(180%) blur(20px)`
- `border-bottom: 0.5px solid var(--gray-200)`
- Logo: icon-inverse.svg (28px) + Sora 700 16px + "Beta" chip (Sora 700 9px uppercase)
- CTA: `bg: var(--gray-900)`, `border-radius: 20px`, `padding: 8px 18px`, Sora 600 13px

### Buttons

| Variant | Background | Text | Radius | Padding |
|---------|-----------|------|--------|---------|
| Primary dark | `var(--gray-900)` | white | 14px | 15px 28px |
| Primary accent | `var(--accent-dk)` | `#0f172a` | 14px | 15px 28px |
| Nav pill | `var(--gray-900)` | white | 20px | 8px 18px |
| Ghost | none | `var(--gray-500)` | — | — |

### Feature Cards
- `background: var(--white)`, `border: 1px solid var(--gray-100)`
- Grid outer corners `border-radius: 20px` only; inner cards flush
- Hover: `background: var(--gray-50)`, no transform
- No box-shadow — border + bg contrast provides separation

### Waitlist / CTA Section
- Background: `var(--gray-900)`
- Radial glow: `rgba(52,211,153,0.07)` ellipse at centre
- Form layout: flex row — standalone `<input>` + `<button>`, NO outer wrapper element
- Input: `background: rgba(255,255,255,0.08)`, `border: 1px solid rgba(255,255,255,0.15)`, `border-radius: 12px`, `padding: 14px 18px`, Karla 16px
- Button: `background: var(--accent)`, `color: #0f172a`, `border-radius: 12px`, `padding: 14px 22px`, Sora 700
- Mobile ≤600px: `flex-direction: column`, button `width: 100%`

### Footer
- `background: var(--white)`, `border-top: 1px solid var(--gray-100)`
- Logo: icon-inverse.svg (24px) + Sora 700 15px text
- Copyright + links: Karla 13px `var(--gray-400)`

---

## Page Structure (index.html)

1. NAV — fixed frosted glass
2. HERO — white bg, centred, browser+popup mockup below
3. STORES STRIP — gray-50, supported platforms chips
4. FEATURES — white, 3-col bento grid
5. HOW IT WORKS — gray-50, 3 numbered steps
6. WAITLIST — gray-900 dark, email form
7. FOOTER — white

---

## Responsive Breakpoints

| Max-width | Changes |
|-----------|---------|
| 900px | Section padding → 80px; feature/HIW grids → 1 col |
| 768px | Nav → hamburger; section padding → 64px; waitlist form → column |
| 480px | Hero letter-spacing reduces |

---

## Animations

- Scroll reveal: `IntersectionObserver`, `opacity 0→1` + `translateY(26px→0)`, 0.6s ease, threshold 0.1
- Hero: `fadeUp` keyframe, stagger 80ms per element
- Hover: 140–150ms ease
- `prefers-reduced-motion`: all transitions/animations disabled

---

## Accessibility

- Icon-only elements: `aria-hidden="true"` + adjacent label
- Form inputs: `<label for="...">` explicit
- Nav toggle: `aria-expanded` synced to state
- Contrast: body `#6E6E73` on `#fff` = 5.4:1 ✓; headings `#1D1D1F` = 16:1 ✓

---

## Anti-Patterns

- CDN font links — all fonts must be self-hosted
- "GP" text SVG placeholder — use real icon SVG
- Dark theme on light-first pages
- Inter or any font not in `fonts/`
- Hardcoded hex values in components — use CSS vars
- `box-shadow` on feature cards
- Emoji as structural icons
