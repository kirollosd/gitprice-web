# Tally form styling (owner task)

The site embeds Tally form `NEXT_PUBLIC_TALLY_FORM_ID` (`ODdMyk` today) on Home (twice: hero and closing band) and on Sellers (twice). The embed URL is
`https://tally.so/embed/<id>?transparentBackground=1&hideTitle=1&dynamicHeight=1&lang=<en|ar>`.
The code cannot style inside the iframe, so match the `WebWaitlistForm/*` masters in the Tally dashboard (Design tab, then Custom CSS on a paid plan).

## Settings

| Setting | Value |
|---|---|
| Page background | transparent (the embed already sets `transparentBackground=1`) |
| Form title / cover / logo | none (`hideTitle=1`) |
| Font | Fustat (Latin), Noto Sans Arabic for Arabic; Tally can only load Google Fonts, so pick the nearest and note the gap below |
| Text colour | ink `#111816` |
| Muted / note colour | `#56605c` |
| Input | one field, label "Email", border `#b8c2bd` (hairline-strong), radius 12, background `#ffffff`, text ink |
| Input focus ring | 2px `#0b7a68`, 2px offset |
| Button | full width, background `#111816`, text `#ffffff`, radius 999, height 44+ |
| Error text | `#c0392b` |
| Dark mode | the site follows the OS theme but Tally does not know it (see gaps) |

## CSS (Custom CSS box)

```css
:root { --gp-ink:#111816; --gp-muted:#56605c; --gp-line:#b8c2bd; --gp-accent:#0b7a68; --gp-danger:#c0392b; }
body { color: var(--gp-ink); }
input[type="email"], input[type="text"] {
  border: 1px solid var(--gp-line); border-radius: 12px; min-height: 44px; background: #fff; color: var(--gp-ink);
}
input:focus-visible { outline: 2px solid var(--gp-accent); outline-offset: 2px; box-shadow: none; }
button[type="submit"] {
  width: 100%; min-height: 44px; border-radius: 999px; background: var(--gp-ink); color: #fff; font-weight: 600; border: 0;
}
[role="alert"], [class*="error"] { color: var(--gp-danger); }
```

Tally's generated class names change; check them in the dashboard and adjust the selectors above.

## States and copy to set in Tally

| Master | Where it lives in Tally | Text (from `web.component.webWaitlistForm.*`) |
|---|---|---|
| empty | the form | Email label "Email"; button "Join the waitlist"; note under the button "One email when we launch. No spam." |
| submitting | Tally's own busy state | Button "Joining…" (Tally shows its own spinner; the label may not be editable) |
| joined | Thank-you page | Title "You’re on the list"; body "We’ll email you once, when GitPrice launches." with an ink check |
| error | Tally's inline validation | "Enter a full email address, like name@example.com." in danger colour |
| failed | Tally's submit error | "We couldn’t add you just now. Check your connection and try again." and button "Try again" |
| already-joined | Not reachable | needs "You’re already on the list" / "This email joined earlier. We’ll write when we launch."; Tally cannot detect duplicates unless "Limit one submission per email" is on, and then it shows its own message |

The page itself already shows a hosted-form link (`https://tally.so/r/<id>`) if the script fails or does not define `Tally` within 5 s.

## Gaps Tally cannot reach

- Exact font files (Fustat, self-hosted woff2) cannot be loaded inside the Tally iframe.
- Dark theme: the iframe cannot read the site theme. Use a transparent background and ink colours that work on both, or accept a light form on the dark ground.
- RTL: Tally lays the form out right to left only when its language is Arabic. `lang=ar` is passed; verify the field, label and button mirror.
- The `submitting` label "Joining…", the `already-joined` state and the ink check icon cannot be matched exactly.
- Native focus rings, field heights and error placement follow Tally's markup, so a pixel match with the Sketch masters is not guaranteed.
- Seller forms: the Sellers page uses the same form ID, so the form's own button says "Join the waitlist", not "Join the seller waitlist", and its note and thank-you say GitPrice, not seller access (`web.sellers.prelaunch.hero.waitlist.note`, `web.sellers.prelaunchJoined.hero.waitlist.body`). The page-level caption under the form carries the seller note.

## Open items for the owner

1. **Arabic form.** Both locales use the same form ID with `lang=<locale>`. Decide between a separate Arabic Tally form (needs an env var and a code change) or Tally's translation feature (Arabic copy from `i18n/ar.json`, Modern Standard Arabic).
2. **Seller form.** Decide whether sellers get their own Tally form (same env-var question) so the labels and thank-you text can be seller-specific.
3. **Seller access destination.** "Get seller access" links to the Chrome Web Store listing because there is no seller URL. Confirm, or provide a seller destination.
