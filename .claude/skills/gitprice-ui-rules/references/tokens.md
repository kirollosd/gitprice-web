# GitPrice tokens (GP-407 Coral, round 3)

Copied from `design-system/colors_and_type.css` and DESIGN.md "UI rules (GP-407 round 3)". If this file and the CSS disagree, the CSS wins; fix this file.

Ratios are WCAG 2.x contrast, "on ground / on raised", light first then dark.

## App and extension colours (`:root`, `[data-gp="app"]`)

| Token | Light | Dark | Measured (ground / raised) | Use |
|---|---|---|---|---|
| `--gp-surface` | `#f4f4f5` | `#0a0a0b` | ground | page, panel; lightest value in the system |
| `--gp-surface-raised` | `#e9e9ec` | `#141416` | raised | cards, best-price row, thumb slot, chips |
| `--gp-ink` | `#0a0a0b` | `#f4f4f5` | 18.00 / 16.33 · 18.00 / 16.73 | text, savings (bold), selected tab/chip |
| `--gp-ink-muted` | `#5e5e66` | `#9a9aa3` | 5.84 / 5.30 · 7.09 / 6.59 | labels, timestamps |
| `--gp-hairline` | `#dcdce0` | `#232327` | decorative, exempt | dividers, skeletons; never text or a control edge |
| `--gp-hairline-strong` | `#c4c4ca` | `#3a3a40` | decorative, exempt | list-row rule, chip border |
| `--gp-control` | `#71717a` | `#71717a` | 4.39 / 3.98 · 4.09 / 3.80 | input border, toggle-off track, secondary-button edge |
| `--gp-accent` | `#c8261a` | `#ff6f63` | 5.09 / 4.62 · 7.26 / 6.75 | coral text, links, focus ring |
| `--gp-fill` | `#ff5a4e` | `#ff5a4e` | — | the ONE primary fill, g-mark |
| `--gp-on-fill` | `#0a0a0b` | `#0a0a0b` | ink on coral 6.43 | text on coral fill |
| `--gp-on-accent` | `#f4f4f5` | `#0a0a0b` | on `#c8261a` 5.09 | text on a `--gp-accent` fill |
| `--gp-on` | `#34c759` | `#34c759` | 2.01 / 1.83 · 8.91 / 8.28; knob on it 2.01 | toggle-on track (exception, compensated) |
| `--gp-on-edge` | `#248a3d` | `#248a3d` | 3.99 / 3.62 · n/a | 1px inset edge on the on-track |
| `--gp-on-text` | `#166534` | `#4ade80` | 6.48 / 5.88 · 11.35 / 10.55 | green words: on / enabled / success; never money |
| `--gp-knob` | `#f4f4f5` | `#f4f4f5` | on green 2.01, on control 4.39 | toggle knob, both states |
| `--gp-knob-shadow` | `0 1px 2px rgb(10 10 11 / 0.24)` | `0 1px 2px rgb(10 10 11 / 0.4)` | — | knob lift |
| `--gp-warn-bg` | `#fbefd0` | `#3a2a08` | tint | warning/danger box fill |
| `--gp-warn-text` | `#5c3d00` | `#f2d48a` | on warn-bg 8.64 · 9.61; ground/raised 9.00 / 8.16 · 13.72 / 12.75 | warning/danger text |
| `--gp-warn-edge` | `#d99a1f` | `#a87a1c` | on warn-bg 2.13 · 3.60 | 1px edge (box identified by glyph + word) |
| `--gp-warn-glyph` | `#f2b84b` | `#f2b84b` | dot / glyph only | never text, never a fill |
| `--gp-danger` / `--gp-danger-fill` / `--gp-on-danger-fill` | aliases of warn-text / warn-bg / warn-text | same | — | legacy names |
| `--gp-confidence-high` | `#0a0a0b` | `#f4f4f5` | as ink | filled dot |
| `--gp-confidence-medium` | `#8a5a00` | `#f2d48a` | 5.39 / 4.89 · 13.72 / 12.75 | half dot |
| `--gp-confidence-low` | `#5e5e66` | `#9a9aa3` | as ink-muted | hollow ring |
| `--gp-shadow-toast` | `0 6px 20px rgb(10 10 11 / 0.12)` | `0 6px 20px rgb(10 10 11 / 0.4)` | — | the one lifted element |
| chip | raised + `#c4c4ca` edge, ink | raised + `#3a3a40` edge, ink | ink on raised 16.33 · 16.73 | `.chip` |

## Website (`[data-gp="web"]`)

| Token | Light | Dark |
|---|---|---|
| `--gp-web-ground` | `#F4F4F5` | `#0A0A0B` |
| `--gp-web-raised` | `#E9E9EC` | `#141416` |
| `--gp-web-slab` | `#E9E9EC` (= raised; a card in a slab uses ground) | `#1A1A1D` |
| `--gp-web-ink` | `#0A0A0B` | `#F4F4F5` |
| `--gp-web-body` | `#3A3A40` (10.27 / 9.32) | `#C9C9CF` (12.00 / 11.16) |
| `--gp-web-mute` | `#5E5E66` | `#9A9AA3` |
| `--gp-web-dim` | `#C4C4CA` | `#3A3A40` |
| `--gp-web-line` | `#DCDCE0` | `#232327` |
| `--gp-web-fill` / `--gp-web-on-fill` | `#FF5A4E` / `#0A0A0B` | same |
| `--gp-web-acc` | `#C8261A` | `#FF6F63` |
| `--gp-web-save` | `#0A0A0B` | `#F4F4F5` |
| `--gp-web-dark` | `#0A0A0B` | `#060607` |
| `--gp-web-on-dark` / `--gp-web-on-dark-mute` | `#F4F4F5` / `#A3A3AB` | same |
| `--gp-web-onfd` | `#0A0A0B` | `#0A0A0B` |
| `--gp-web-logo` | `#0A0A0B` | `#F4F4F5` |

## Scales

- App spacing `--gp-sp-*` (4px grid): 1=4 2=8 3=12 4=16 5=20 6=24 8=32 10=40 12=48 16=64.
- Web spacing `--gp-wsp-*` (8px grid): 1=8 2=16 3=24 4=32 5=40 6=48 8=64 10=80 12=96 16=128; 0=4 only for an icon-label gap. Section rhythm: `--gp-wsec` 128 / `--gp-wsec-m` 64 (phone).
- Radius: `--gp-r-xs` 4 (marks, control inside a control), `--gp-r-sm` 8 (thumbnail), `--gp-r-control` 8 (buttons, inputs, chips, tabs, badge), `--gp-r-card` 12 (cards, panels, rows, toasts), `--gp-r-lg` 16 (OS sheets only), `--gp-r-round` 999px (toggle, knob, dots only). `--gp-r-pill` is a deprecated alias of round.
- Buttons app: `--gp-btn-h` 44 / `--gp-btn-px` 16; compact `--gp-btn-h-sm` 32 / `--gp-btn-px-sm` 12 (dense extension rows and badge only); `--gp-btn-gap` 8.
- Buttons web: `--gp-wbtn-h` 48 / `--gp-wbtn-px` 24; compact (header, menu, dock) `--gp-wbtn-h-sm` 40 / `--gp-wbtn-px-sm` 16 with a 44px tap area. Every waitlist CTA is the same coral primary.
- Web controls (components.css): `.ctl` 36 (34 phone), radius 8, 1px `--gp-control`, 18px icon, 44 tap; `.seg` segments 40 (44 phone), inner radius 4; `.tag-beta` 24 high, radius 8; `.navlink` active rule 2px ink, 8px below; interactive `.chip` 28 visual / 44 tap.
- Targets: `--gp-target` 44, `--gp-target-badge` 32 (24 min), `--gp-thumb` 40. Chip 28 high. Toggle 44 x 26, knob 20.
- Type (app): display 24/700, title 18/700, headline 15/600, body 15/400, body-compact 14/400, caption 13/400, price 16/600 (mono). Chip 12/600. Line height 1.4 (RTL 1.6).
- Fonts (only these; Fustat, Noto Sans Arabic, Sora, Karla are gone): `--gp-font` `'Outfit', 'Alexandria', system-ui, ...` (RTL: Alexandria first); `--gp-font-num` `'JetBrains Mono', ui-monospace, ...`.

## Never used

- Light text on coral fill (2.79).
- Amber `#f2b84b` as text on light (1.62).
- Solid amber fill for any warning.
- `#fff`, `#000`, `white`, `black`, `rgba(0,0,0,a)` shadows (use `rgb(10 10 11 / a)`).
- The retired orange danger `#b54708` / `#ffa94d`.
- Legacy `[data-gp="light"]` block (mint/navy, Sora/Karla, `rgba(15,23,42,a)` shadows): kept for shipped extension code until migration; never copy from it.
