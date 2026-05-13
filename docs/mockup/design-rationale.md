# KIR-50 Design Rationale — GitPrice Light Theme

**Date:** 2026-05-13  
**Author:** Max (CTO)  
**Status:** Awaiting Board approval before implementation

---

## Overview

This document describes the design decisions behind the light-theme, Apple-inspired redesign mockup for `gitprice-web`. The mockup is a standalone HTML/CSS file at `docs/mockup/light-theme-mockup.html` — open it in any browser to review at both desktop (1440px) and mobile (375px) viewport widths.

---

## Design Principles Applied

### 1. Apple-Inspired Aesthetic

Apple's design language on product marketing pages shares a clear vocabulary:

- **High-contrast whitespace.** Sections breathe. 104px vertical padding on content sections mirrors the generous spacing used on apple.com product pages.
- **Typography as hero.** The headline runs at 5rem (80px) on desktop with –0.045em letter-spacing and 1.04 line-height — tight, confident, zero ambiguity about what the product does.
- **Surface hierarchy via value, not hue.** Light gray (#F5F5F7) surfaces sit one step below pure white (#FFFFFF). Cards use the same light gray, with a 1px border at 7% black opacity. No colored backgrounds except the hero and CTA ambient glow.
- **Frosted glass nav.** `backdrop-filter: saturate(180%) blur(16px)` with 85% white opacity — identical to Apple's sticky navigation treatment.
- **Shadow system.** All shadows are warm-neutral (rgba(0,0,0,...)) with low opacity (4–12%). No colored shadows except the browser mockup's emerald glow, which reinforces brand identity.

### 2. Color System

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#FFFFFF` | Page background |
| `--bg-alt` | `#F5F5F7` | Alternate sections (features, how-it-works, footer) |
| `--text-1` | `#111827` | Primary text, headings |
| `--text-2` | `#374151` | Body text |
| `--text-3` | `#6B7280` | Secondary/supporting text |
| `--brand` | `#34d399` | Brand accent (kept from current) |
| `--brand-dark` | `#059669` | Text on light backgrounds (WCAG AA) |
| `--brand-muted` | `#f0fdf7` | Tinted background for brand elements |

The emerald brand color (`#34d399`) is unchanged — it's the single accent in an otherwise achromatic palette. On a light background, `#34d399` itself doesn't meet WCAG AA for text, so `--brand-dark` (`#059669`) is used for all text-colored brand elements (kickers, step numbers, badges, links).

### 3. Typography

**Fonts unchanged**: Sora (display/headings) + Karla (body). Both are already self-hosted in the repo.

| Scale | Usage |
|-------|-------|
| 5rem, –0.045em | Hero H1 |
| 2.625rem, –0.04em | Section H2 |
| 1.125rem, –0.03em | Card titles, step titles |
| 1rem / 0.9375rem | Body, feature copy |
| 0.875rem | Nav links, secondary labels |
| 0.8125rem–0.75rem | Badges, tags, footnotes |

### 4. Logo Treatment on Light Background

The current logo mark (emerald green square, white "G") works unchanged on a light background — it provides strong visual contrast. The wordmark uses `--text-1` (#111827) instead of the current light text.

No logo file changes required. Only a CSS color swap on the wordmark text element.

### 5. Key Section Changes vs. Current Dark Theme

| Section | Dark (current) | Light (proposed) |
|---------|----------------|-----------------|
| Background | `#0f0f1a` navy | `#FFFFFF` / `#F5F5F7` |
| Hero glow | Emerald radial on dark | Emerald radial at 7% opacity, barely visible |
| Nav | Frosted glass on dark surface | Frosted glass on white |
| Feature cards | `#1e1e35` surface | `#F5F5F7` with 1px border |
| CTA section | Full-width dark with glow | White with subtle bottom glow |
| Text hierarchy | 4-tier light grays | 4-tier dark grays |
| Shadows | No shadows (too visible on dark) | Apple-style light shadows (3–12% opacity) |

### 6. Browser Mockup

The hero browser window demonstrating the extension panel:
- Uses standard macOS traffic-light buttons for context
- Shows realistic EGP pricing for three stores
- "Lowest" badge uses brand-muted background (#f0fdf7) + emerald-dark text
- Subtle `rotateX(2deg)` perspective tilt animates flat on hover (CSS-only)
- Box shadow includes `--shadow-glow` at 15% opacity for brand reinforcement

### 7. Responsive Design

Single breakpoint at 680px (≈ 375px mobile + gutter):
- Hero H1 drops to 2.625rem (42px) — still impactful on small screen
- Two-column features grid becomes single column
- Three-column steps grid becomes stacked single column with bottom borders as dividers
- Horizontal store pills wrap / center
- Nav collapses to logo + CTA only (same as current)

---

## Sections Covered

- [x] Navigation (sticky, frosted glass)
- [x] Hero (headline, subheadline, CTA pair)
- [x] Browser mockup (extension panel, 3-store comparison)
- [x] Store strip (Amazon.eg / Noon / Jumia badges)
- [x] Features grid (4 cards)
- [x] How it works (3 steps)
- [x] CTA / Waitlist
- [x] Footer

---

## Acceptance Criteria Status

| Criterion | Status |
|-----------|--------|
| Covers all 6 page sections | ✅ All 6 sections present |
| Light/Apple aesthetic clearly evident | ✅ White backgrounds, Apple spacing/typography/shadows |
| Logo and favicon treatment specified | ✅ Logo mark unchanged; wordmark color = `#111827` |
| Desktop + mobile layouts included | ✅ Responsive CSS included; test at 375px and 1440px |
| Mockup reviewed and approved by Board | ⏳ Pending — this document is the submission |

---

## Implementation Notes (post-approval)

These notes are for the implementation phase, not part of this review.

1. **CSS token swap only**: ~30 token values change. Component structure stays identical.
2. **Shadow system**: Add 4 new light-mode shadow tokens; remove dark `rgba(0,0,0,0.4–0.5)` values.
3. **Brand text color**: All in-text brand uses switch from `#34d399` to `#059669` for WCAG compliance.
4. **No font changes**: Same Sora + Karla woff2 files.
5. **No component rewrites**: Nav, Hero, Features, HowItWorks, CTA are CSS-only changes.
6. **HeroMockup**: Light background for browser chrome; winner row uses `--brand-muted` instead of dark glow.
7. **Estimated effort**: 1 engineer day (Sam) for CSS token migration + visual QA.
