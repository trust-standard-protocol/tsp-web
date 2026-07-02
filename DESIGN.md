# TSP Website Design Principles

The house rules for truststandardprotocol.com. Every content or design change should hold
against this document; when a change deliberately breaks a rule, say so in the PR/commit.

## 0. Accessibility first — WCAG 2 AA is the top priority

Nothing ships that fails it. WCAG 2.1 AA on every route, in both languages, verified by axe
with **zero violations** (the Playwright gate). Contrast ≥ 4.5:1 for text, visible focus,
correct heading outline (no skipped levels), keyboard-complete, screen-reader-meaningful
verdicts (state carried as text, not color alone). When accessibility and any aesthetic rule
below conflict, accessibility wins — no exceptions.

## 1. Identity

- **Transparency is what makes it live or die.** The brand is the product applied to
  itself: "don't trust us, verify us." Every design decision should make the site feel
  *checkable* — real demos, real cryptography, honest placeholders, stated limitations,
  visible boundaries. Never fake a screenshot, a dashboard, a testimonial, or a metric.
  A static placeholder that says it is one beats a fabricated live view. When something
  isn't built, isn't proven, or isn't independent yet, the site says so in plain text.
- Tone: professional, plain, editorial. No marketing fluff, no filler verbs ("elevate",
  "seamless", "empower"). Short declarative headlines that make a falsifiable claim.

## 2. Claim boundary (non-negotiable, enforced by claim-scan)

- TSP verifies **evidence integrity and chain-of-custody** — never truth, correctness,
  legality, safety, fairness, or compliance. Copy may state what TSP does *not* do as often
  as it likes; it may never round up.
- Banned as positive claims: tamper-proof, guaranteed, certified, official, qualified,
  compliant. "Tamper-evident" is the correct term.
- LexiCo AS appears only as operator/licensee (never owner of the standard, never a
  certification authority) and only in the allowlisted operator-disclosure locations.
- Payment never grants official status. The Norwegian copy must never claim more than the
  English (claim-scan is English-only — NO changes need a human boundary pass).

## 3. Color & typography

- One locked palette: navy ink on warm cream paper, rust/copper accent, muted teal for
  secondary chips, semantic green/red only for verification state. No pure black or pure
  white; no new accent colors per section; no gradients; no neon or outer glows.
- One light theme, whole page. Navy panels (footer, quote bands, receipt cards) are accents
  inside the light theme, not a theme inversion.
- Sans for UI and body, mono for protocol artifacts (hashes, package names, receipts,
  eyebrows). Emphasis via weight/italic of the same family — never a second display family.
- Long mono strings (package names, digests) wrap at natural break points
  (`word-break: normal; overflow-wrap: anywhere`), never `break-all`.

## 4. Layout rhythm

- Hero fits the initial viewport: headline ≤ 2 lines, subtext short, primary action visible.
- Vary section layout families across a page; avoid three consecutive same-shape card grids.
  Break long card runs with a full-width band, a split, or a quote.
- Eyebrow kickers are a system, but use restraint on new pages — not every section needs one.
- Cards: no cards nested inside cards. Left-accent borders are reserved for *functional*
  state (valid/invalid chain cards, boundary callouts) — not decoration.
- Spacing has rhythm: tight inside groups, generous between sections (Gestalt proximity —
  related things sit closer than unrelated things). Don't reuse one spacing value everywhere.

## 5. Interaction (affordance contract)

- **If it looks clickable, it is; if it's clickable, it looks it.** No hover transforms or
  pointer cursors on inert elements; no flat text that secretly navigates.
- **If a concept has a page, its first prominent in-text mention links there** (e.g. "EU AI
  Act" → /why, "playground" → /playground, "the Seal" → /seal). Exception: don't double-link
  when the same section already carries an explicit CTA to that page, and never link inside
  code blocks.
- Every interactive element has visible :hover feedback and a :focus-visible style. External
  links carry the ↗ signifier consistently.
- Feedback confirms action: verify buttons render a verdict, copy buttons confirm, language
  toggle reflects state (aria-pressed). Nothing happens silently.
- Fitts & Gestalt where they fit, never forced: primary actions get large, close targets
  (≥ 44px touch); related controls cluster; similarity implies same behavior (all chips act
  alike, all cards act alike). Reference: figma.com/resource-library/interaction-design/,
  /fitts-law/, /gestalt-principles/.

## 6. Art direction

- Illustration style: **stroke line-art only**, matching the footer TSP mark and the icon
  set — single stroke weight, round caps, recolored to the palette via `currentColor` or CSS
  variables. Sources must be recolorable SVG.
- Never: AI-generated raster illustrations, neon/glow renders, purple-gradient tech art,
  dark-background deck images, stock photography, decorative pills over images.
- Spot illustrations serve hierarchy (fill a hero's empty column, break a text wall), never
  decoration for its own sake. If a section reads fine without art, it doesn't get art.
- The live receipt/verify demos are the site's real "art" — prefer making a mechanism
  visible over adding a picture of one.

## 7. Copy cadence (known deliberate deviations)

- Em-dashes are house voice; external detectors flag them as an AI tell. Keep them, but
  prefer commas/colons in *new* copy when they read equally well.
- Numbered labels ("Future 01/02/03") and the eyebrow system are deliberate; don't extend
  them to new patterns without need.
- Avoid three-in-a-row aphorism endings ("X. No Y.") across sections on one page.

## 8. Accessibility & i18n gates (enforced by CI/Playwright)

- WCAG 2.1 AA on every route in both languages (axe, 0 violations). Heading levels never
  skip. Keyboard path + skip link work everywhere. No horizontal overflow at 375/768/1280.
- Every user-visible string lives in `src/i18n/*.json` — including island-rendered dynamic
  strings (`t(clientLang(), key)`) and placeholder attributes (`data-i18n-placeholder`).
  English is server-rendered; Norwegian must be complete for every new key.
- `npm run claim-scan`, `npm run build`, and `npx playwright test` green before any push;
  deploys go through the approval-gated `production` environment.
