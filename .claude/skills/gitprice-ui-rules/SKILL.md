---
name: gitprice-ui-rules
description: Use when designing, reviewing, mocking up or implementing any GitPrice UI (website and landing page, Chrome extension overlay, badge, comparison panel, popup, side panel, native iOS/Android apps, store frames, brand assets), or touching buttons, colours, contrast, dark mode, toggles, switches, tabs, chips, cards, spacing, radius, fonts, Arabic/RTL text, EGP / ج.م currency, warnings, the wordmark or the g-mark. Owner-approved GP-407 round-3 rules plus a tick-able verification checklist.
---

# GitPrice UI rules (GP-407 round 3)

Owner-approved rules for every GitPrice surface. They override older guidance (Jade/Fustat, mint-on-navy, the legacy `[data-gp="light"]` block, `design-system/design-map.md`, the Sketch library).

Sources of truth, read before changing them:
- `DESIGN.md` → "UI rules (GP-407 round 3)"
- `design-system/colors_and_type.css` (tokens; it wins over this skill)
- `design-system/handoff/components.css` (`.btn`, `.chip`, `.toggle`, `.tab`, `.card`, `.prow`, ...)
- `design-system/rules/accessibility.html` (measured pairs)
- Full hex table: `references/tokens.md`

Use tokens (`var(--gp-*)`, `var(--gp-web-*)`), never raw hex, in shipped code.

## 1. Contrast: WCAG AA, both themes, measured

- Text ≥ 4.5:1; control edges, state fills, focus ring ≥ 3:1. Measure each pair on `surface` AND `surface-raised`, light AND dark. Never assume; run the snippet in the checklist.
- Known exceptions (the only ones):
  - iOS green toggle-on track `#34c759`: knob on it 2.01, light track vs ground 2.01 / raised 1.83. Compensated by the `#248a3d` inset edge (3.99 / 3.62), the knob shadow, the knob position and the visible label. Dark track is 8.91 / 8.28.
  - `--gp-warn-edge` on warn-bg (light 2.13): the box is identified by glyph + word.
  - Hairlines (`--gp-hairline`, `--gp-hairline-strong`) are decorative. Anything that identifies a control uses `--gp-control` (`#71717a`).
- Never: light text on coral fill (2.79), `#f2b84b` as text (1.62 on light).

## 2. Spacing

- Extension and apps: 4px grid, `--gp-sp-*` = 4 8 12 16 20 24 32 40 48 64.
- Website: 8px grid, `--gp-wsp-*` = 8 16 24 32 40 48 64 80 96 128, tokens only (a literal 16px is a finding too).
- Applies to ALL elements: margin, padding, gap, inset, top/right/bottom/left, scroll-margin/padding, `translate` / transform `translate*()`, inline `style={{}}`; component internals (button, chip, card, input padding, row gaps, heading margins, absolute offsets); phone layouts (zoomed landing: source units on the scale).
- `--gp-wsp-0` = 4px only for an icon-to-label gap inside one chip or status line.
- Section rhythm: every landing section and page band pads `--gp-wsec` 128 (desktop) / `--gp-wsec-m` 64 (phone). Pinned scroll runways are not gaps; a live scroll never shows a blank viewport.
- Heading to content 24 or 32; card padding 24; chip gap 8; button-row gap 16 (web).
- Allowed literals: 0, 1px hairline, 2px underline/focus offset, control sizes 40/44/48, font sizes, radii, asset sizes, coordinates past 128 on multiples of 8. Anything else (icon geometry, motion keyframes, SVG units) goes in the allowlist with a reason: website `scripts/spacing-allowlist.json`, design system `design-system/metrics/spacing-allowlist.json`.
- No off-grid values (6px, 10px, 14px, 18px...), no app `--gp-sp-*` tokens on the website, no `--gp-wsp-*` on surfaces.

## 3. No true white, no true black

- Light ground `#f4f4f5` (lightest value anywhere); light raised `#e9e9ec`.
- Dark ground `#0a0a0b`, dark raised `#141416`; web dark band `#060607`.
- Shadows `rgb(10 10 11 / a)` only, never `rgba(0,0,0,a)`.
- On the web, raised = slab (`#e9e9ec`), so a card inside a slab band uses the ground colour.

## 4. Colour roles

| Role | Rule |
|---|---|
| Coral fill `--gp-fill` `#ff5a4e` | Only the one primary button and the g-mark. Text on it is INK `--gp-on-fill` `#0a0a0b` (6.43). Never white on coral. |
| Coral text `--gp-accent` | `#c8261a` light / `#ff6f63` dark: links, coral words, focus ring. |
| Savings / money | Never coloured. Bold ink (`--gp-savings` / `--gp-web-save`). Never green, never coral. |
| Green `--gp-on` `#34c759` | Toggle-on track only. Green text is `--gp-on-text` (`#166534` / `#4ade80`) for on / enabled / success words, never money. |
| Warning and danger (amber) | Soft tint `--gp-warn-bg` + 1px `--gp-warn-edge` + `--gp-warn-text`, plus a glyph AND a word (▲ / ! / "Error"). `#f2b84b` only as dot/glyph. Never coral, never a solid amber fill, never the old orange `#b54708` / `#ffa94d`. |
| Medium confidence | `--gp-confidence-medium` (`#8a5a00` / `#f2d48a`), told apart from warning by its half-dot mark and label. |

## 5. Buttons

- ONE coral primary per screen (`.btn-primary`: coral fill, ink text).
- Every other action is the ONE secondary style (`.btn-secondary`: ink text, 1px `--gp-control` edge, no fill). `.btn-tertiary` is a deprecated alias; do not invent more styles.
- At most 2 action colours on a screen. A destructive confirm (`.btn-danger`: amber tint + edge + warn text, glyph + word) replaces the primary in its own step, never beside coral.
- Sizes: app/extension 44px tall / 16px padding (`--gp-btn-h`), compact 32 / 12 (`.btn-sm`, dense extension rows and the badge only); web 48 / 24 (`--gp-wbtn-h`), compact 40 / 16 (`[data-gp="web"] .btn-sm`: header, menu, dock) with a 44px tap area.
- Pressed: scale settles from .96 to 1 over 160 ms (`.btn:active`).
- Arrow links ("See how it works ↓"): label + arrow are one unit, arrow 8px after the label, never wrapped alone (`.arrow`).
- Side-by-side buttons share one size, or are both full width (`.btn-block`). Gap 8px on surfaces, 16px on the website.
- No cramped buttons: label never touches the edge, never wraps mid-word, never below the standard height.
- Secondary "open dashboard" / "open side panel" actions are icon buttons (44 / 32 target, `--gp-r-control`) with an `aria-label`, not extra text buttons.

## 6. Website

- ONE coral primary per SECTION, not per viewport. The old "one coral at a time" switching (demoting hero/footer CTAs while the dock shows) is retired.
- Every waitlist / Add to Chrome CTA (header, menu sheet, dock pill, dock form, footer, forms, pricing) is the SAME coral primary: `--gp-web-fill` + `--gp-web-on-fill`, radius 8, weight 600, same hover/pressed, light and dark, dark dock pill included. No ink, inverted, outline-only or alternate-colour CTAs; other actions use the one secondary.
- The hero has NO waitlist CTA: its single action is the secondary "See how it works ↓". The header CTA stays.
- Header section links: scroll-spy marks the section crossing the viewport centre with `aria-current` and a 2px ink rule 8px under the label (`.navlink`); one active link at most.
- Language switch, theme switch and every language link share one control (`.ctl`): 36px (34 phone), radius 8, 1px `--gp-control` edge, no fill, 18px icon, 44px tap area.
- Beta tag: 24px, radius 8, 1px currentColor edge, never a pill (`.tag-beta`).
- Web-to-DS class map and what the sync mirrors: `design-system/web-parity.md`.

## 7. Radius

- Rounded rectangle everywhere: controls 8 (`--gp-r-control`), cards and panels 12 (`--gp-r-card`).
- Nested is never rounder than its parent (a control inside a control: `--gp-r-xs` 4).
- No pill buttons, chips or tabs. No circular buttons on cornered cards.
- Only the toggle (track + knob) and dots are fully round (`--gp-r-round`). `--gp-r-pill` is deprecated.

## 8. Toggles, tabs, segmented controls

- Toggle ON: green `#34c759` track, 1px inset `#248a3d` edge, `#f4f4f5` knob with `--gp-knob-shadow` at the end. OFF: grey `--gp-control` track, `#f4f4f5` knob at the start. Use `.toggle` / `.toggle.is-on`; identical on every surface (extension, web, apps).
- Selected tab / segmented option / price-history range = contrast ink (ink on light, `#f4f4f5` on dark). Never coral.
- Segmented toggles (Sort by price / Sort by GitPrice, With / Without) use the one `.seg`: raised track, radius 8, 4px inner, 40px segments (44 on phones).

## 9. Chips

- One chip: 28px high, radius 8, `surface-raised` fill, 1px `hairline-strong` border, ink text 12px / 600 (`.chip`).
- Meaning only from a glyph and a word (=, !, ✓), never a different fill or border.
- Chips are not button-shaped (no button height, padding or fill); filters are chips, actions are buttons.
- Selected filter = ink fill with ground-coloured text (`.chip.sel` or `aria-pressed="true"`). The only deviation is the warning chip (`.chip.warn`).
- Interactive chips (picker, filters, fill actions) keep the 28px visual but get a 44px tap target via an invisible `::after` pad; they are buttons (or `role="button"` + `tabindex`) so keyboard and AT reach them.

## 10. Typography and language

- Fonts are ALWAYS unified: Outfit (EN), Alexandria (AR), JetBrains Mono (figures and data). No other family, ever: Fustat and Noto Sans Arabic are removed, Sora and Karla retired. Sole exception: receipt mockups, which represent another document and may use receipt typefaces.
- Currency "EGP" / "ج.م" uses the surrounding EN/AR family via `.gp-cur` / `.cur` (`font-family: var(--gp-font)`, tabular numerals), even beside a JetBrains Mono price. Never `--gp-font-num`, never a system fallback.
- Western (Latin) digits in Arabic. "GitPrice" and the g-mark are never translated. Arabic copy is strict MSA (no dialect).
- RTL: `dir="rtl"` swaps `--gp-font` to Alexandria first; use logical properties (`inset-inline-*`, `padding-inline-*`).

## 11. Comparison item cards

- Each card: product image, then the title centred, clamped to 2 lines with a "Read more" affordance.
- Real cards (raised fill, `--gp-r-card`), separated by gap, not by separator lines.
- All cards in a set are the same size (fixed grid tracks / equal heights), whatever the title length or image ratio.

## 12. Brand

- Wordmark is zinc on ink: `#f4f4f5` wordmark on `#0a0a0b` (on a light ground it is ink, `--gp-web-logo`). Not "coral g-mark on ink".
- App icon A: ink g on coral tile (`#ff5a4e` / `#0a0a0b`, 6.4:1). Assets in `design-system/brand/`.

## Verification checklist

Copy into the PR / review and tick each line. `P` = the files you changed (e.g. `P="extension/src design-system/screens"`).

**Colours and values**
- [ ] No true white/black:
  `grep -rnEi '#fff\b|#ffffff|#000\b|#000000|\bwhite\b|\bblack\b|rgba?\(\s*0\s*,\s*0\s*,\s*0|rgba?\(\s*255\s*,\s*255\s*,\s*255' $P`
- [ ] No pill or circular controls (toggle/knob/dots only):
  `grep -rnE 'r-pill|r-full|9999px|999px|border-radius:\s*50%' $P`
- [ ] No orange/coral danger, no solid amber fill:
  `grep -rnEi '#b54708|#ffa94d|background:\s*(#f2b84b|var\(--gp-warn-glyph\))' $P` and review every `--gp-accent` / `--gp-fill` use: none on errors or losses.
- [ ] No raw hex outside the token file:
  `grep -rnE '#[0-9a-fA-F]{3,8}\b' --exclude=colors_and_type.css $P` (only receipt mockups and SVG brand sources may keep literals).
- [ ] Text on coral is ink (`--gp-on-fill`), never `--gp-on-accent` / light text.
- [ ] Savings and prices are bold ink, not green/coral.
- [ ] Every warning/error has tint + edge + warn text AND a glyph AND a word.

**Contrast (measure every new or changed pair, light + dark, on surface + raised)**
- [ ] Run (from repo root; reuses `design-system/metrics/hard-metrics.js`):
  ```bash
  node -e "const vm=require('vm'),fs=require('fs'),c={};vm.runInNewContext(fs.readFileSync('design-system/metrics/hard-metrics.js','utf8'),c);for(const p of process.argv.slice(1)){const[f,b]=p.split(':');const r=c.contrastRatio(f,b);console.log(f+' on '+b,r.toFixed(2),r>=4.5?'AA text':r>=3?'UI 3:1 only':'FAIL')}" '#0a0a0b:#ff5a4e' '#5e5e66:#e9e9ec'
  ```
  Text needs "AA text"; edges/fills/focus need ≥ 3. Any FAIL must be a listed exception.

**Buttons**
- [ ] Primary count per screen = 1: `grep -cE 'btn-primary' <screen-file>` (and visually: one coral fill per view state).
- [ ] All other actions `.btn-secondary`; ≤ 2 action colours.
- [ ] Heights 44/32 (app) or 48/40 (web); side-by-side buttons same size or both `.btn-block`.
- [ ] Website: at most one coral primary per section; the hero has none (its one action is the secondary "See how it works ↓").
- [ ] Website: every waitlist CTA has the identical computed look. Probe in the browser at 1440 and 390, light and dark, EN and AR (dock open and closed):
  ```js
  [...document.querySelectorAll('.gp-btn, [data-join], #dgo, [data-gp-store="chrome"], form button[type=submit]')]
    .filter((e) => e.offsetParent).map((e) => { const s = getComputedStyle(e); return [s.backgroundColor, s.color, s.borderRadius, s.fontWeight].join(' | '); })
    .filter((v, i, a) => a.indexOf(v) === i)   // must return exactly ONE entry
  ```
- [ ] Interactive chips: visual 28px, tap target ≥ 44px (measure the `::after` box), keyboard operable.
- [ ] Header links: one `aria-current` at a time while scrolling, none on hero/footer; 2px ink rule 8px below.
- [ ] Language and theme controls share `.ctl` (same height, radius, edge, icon size); 44px tap area.
- [ ] Arrow links: shrink the row; the arrow never sits alone on a line.
- [ ] Open-dashboard / side-panel actions are icon buttons with `aria-label`.

**Controls and shape**
- [ ] Toggles use `.toggle` (on green + `#248a3d` edge + `#f4f4f5` knob; off `--gp-control`).
- [ ] Selected tab / segment / range = ink, not coral: `grep -rnE 'is-sel|aria-selected|\.sel' $P` and check colour.
- [ ] Chips use `.chip` (28px, r8, raised, hairline-strong edge, ink 12/600); selected = `.chip.sel`.
- [ ] Radius 8 controls / 12 cards; nested ≤ parent: `grep -rnE 'border-radius' $P`.
- [ ] Spacing on grid, every element (4px surfaces, 8px web tokens, section pair `--gp-wsec`/`--gp-wsec-m`, `--gp-wsp-0` only on icon-label gaps): run the guards, they list failures per file:
  website `node scripts/spacing-grid.mjs` (and `npx vitest run tests/spacing-grid.test.ts`); design system `node --test design-system/metrics/spacing.test.mjs`.
  Pages outside both guards: `grep -rnoE '(margin|padding|gap|inset|top|left|right|bottom)[a-z-]*:[^;]*[0-9]px' $P` and check each px is 0/1/2 or a multiple of the grid. New exceptions need an allowlist entry with a reason.
- [ ] Comparison cards: image + centred 2-line title + "Read more", equal size, no separator lines.

**Type and language**
- [ ] Font families used: `grep -rhoEi 'font-family:[^;]+' $P | sort | uniq -c` shows only `var(--gp-font)` / `var(--gp-font-num)` / Outfit / Alexandria / JetBrains Mono (receipt mockups excepted).
- [ ] Every EGP / ج.م is wrapped in `.gp-cur` / `.cur`: `grep -rnE 'EGP|ج\.م' $P` and check the wrapper.
- [ ] Arabic uses Western digits, MSA, untranslated "GitPrice".

**Screens and guards**
- [ ] Screenshots of each changed screen: light EN, dark EN, light AR (RTL), dark AR (RTL); text never leaves its box.
- [ ] Guard tests pass: `node --test design-system/metrics/*.test.mjs`
