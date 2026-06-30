# tsp-web — build plan (Fase A)

Canonical public site for **truststandardprotocol.com**. Clean, responsive **Astro**
static site in a NEW repo (`Desktop/tsp-web`), separate from the protocol repo
(`Desktop/tsp`). Brand-pack design *direction* converted to real production code — not a
lift-and-shift of the design-tool HTML export. Philosophy: **boring, old, stable,
agent-readable.**

## Decisions (locked, with the why)

1. **Fresh build, not convergence.** Build from scratch on a tokenized design system.
   The `tsp-web-norway` Astro site uses a different palette/fonts (Funnel/Geist) and
   LexiCo branding — not the brand-pack aesthetic the brief mandates. I reuse only its
   *ideas* (claim-lint approach, content-as-data discipline), not its code/styles.

2. **Real crypto, vendored from the protocol.** The verify path
   (`canonicalize` JCS, `sha256Hex`, `contentHash`, `ledgerHash`, `signatureDomain`,
   `verifyTrustEnvelopeV3`, schema validation, types) is vendored **verbatim** from
   `Desktop/tsp/packages/protocol/src` into `src/lib/tsp/`. This is the exact code
   `@trust-standard-protocol/sdk-web` re-exports — the live demos run the real protocol
   verify, not a reimplementation.

3. **Ed25519 backend = native WebCrypto with `@noble/ed25519` fallback.** The protocol's
   `crypto.ts` uses native `crypto.subtle` Ed25519 (verified working in Node 24 against
   the shipped fixture). Browser-native Ed25519 is now broad (Chrome 137+, FF 129+,
   Safari 17+) but not universal, and the brief flags it may be unreliable. So the
   vendored `crypto.ts` prefers native and falls back to the vetted `@noble/ed25519`.
   It is **real Ed25519 + JCS + TrustEnvelopeV3**, matching the protocol exactly.

4. **`sdk-web` is verify-only** (`noSigning: true`). The Working Slice needs to *emit*
   real envelopes, so a small **demo signer** (`src/lib/tsp/sign.ts`) generates an
   Ed25519 keypair and signs the **exact** `canonicalize(signatureDomain(envelope))`
   bytes the verifier checks. Same canonical bytes + same hash chain ⇒ the shipped
   verifier returns `valid` on intact, `invalid` on a one-byte tamper. Verified.

5. **IA: one canonical landing + one `/verify` + one `/playground`.** Hybrid is the
   canonical home model. No duplicate landings, no `href="#"` dead links.

## Stack

- **Astro** static (`output: 'static'`), no UI framework. Interactivity = Astro islands
  (vanilla TS modules, hydrated `client:*`).
- **Self-hosted IBM Plex Sans + IBM Plex Mono** (perf/privacy/EU optics — no Google Fonts).
- **Design tokens** in `:root` (palette, spacing, radius, type scale), mobile-first
  responsive (the export was desktop-fixed).
- **npm** (boring, universal). Dep surface: `astro`, `@noble/ed25519` only.

## Design system (brand-pack palette, IBM Plex)

teal `#15403d` · copper `#9c5a2e` · amber `#d99a5e`/`#e0a45e` · cream bg `#e7e1d2` ·
card `#faf8f1` · ink `#1a1815`/`#211c17` · success `#1c7d5a` · error `#b5402f`.
Preserve a11y: skip-link, `:focus-visible`, `prefers-reduced-motion`, aria roles.

## Pages (one canonical each)

- **Landing** `/` — hero (doctrine-rewritten), 3-step idea, live tamper band → playground,
  EU AI Act strip, open-vs-seal split, governed-not-granted close. Honest boundary line.
- **Verify** `/verify` — paste/upload envelope (+ public key or bundle) → **real** verify,
  per-check results, "Load sample", tamper toggle, boundary.
- **Working Slice / Playground** `/playground` — **HERO demo**: build a real AI-event
  chain → ⚡ break one byte → real fail → TrustBadge → export dossier (round-trips into
  /verify). Wired to vendored real verify + demo signer.
- **Protocol** `/protocol` — Envelope, Manifest, Verification, Conformance, Threat model.
- **EU AI Act** `/eu-ai-act` — Art 12/14/19/50 as **evidence, not verdict**.
- **Tools** `/tools` — SDKs framed as **verifier cores** (1 signer / N verifiers) + MCP
  server/proxy + TrustBadge. `@trust-standard-protocol/*` names.
- **Leaderboard** `/leaderboard` — recompute-from-receipts ranking (Verifiability 0.40 /
  Coverage 0.35 / Human-oversight 0.25 → Art 14) + 5-step enroll wizard + live score.
- **Hard Questions** `/hard-questions` — honest objections + threat model.
- **Pricing** `/pricing` — tiers + "contact", **no hard numbers** (not validated).

## Agent surface

`/llms.txt`, `/.well-known/tsp.json`, `/.well-known/security.txt`, and `/agent/` with
`openapi.json` (placeholder), `tsp-manifest.json`, `protocol.md`. No CAPTCHA; core text
needs no JS.

## Deploy scaffolding (built, NOT executed)

`infra/Caddyfile` (apex→site, verify.→verify, docs.→docs, agent.→static), `docker-compose.yml`,
`DEPLOY.md`, `.env.example`. Apache-2.0 `LICENSE`. No secrets; never reuse the old
`tsp-site-hel1-cloud-init.yaml` key.

## The four content fixes (applied everywhere)

1. **Ed25519**, never ECDSA/P-256/ES256 — copy + both live demos (real verify).
2. Package names `@trust-standard-protocol/*` (not `@tsp/*` / `@lexitsp`).
3. License: "Apache-2.0 (open layer) + commercial TSP license (closed seal)" — no "LexiCo".
4. Landing rewritten to doctrine: tamper-**evident**; boundary line; drop "no trust required".
   Minor: no "guarantee(s)"; "production issuance"→staging; SDKs = verifier cores.

## Claim-scan (zero forbidden overclaims)

`scripts/claim-scan.mjs` scans all source/public copy. **Hard-ban (anywhere):**
tamper-proof, LexiCo, ECDSA, P-256/P256, ES256, "no trust required", production-ready,
production-grade, "production issuance", 94.14, AOE-compression, `@tsp/`, `@lexitsp`,
"MIT license", guarantee(s/d). **Overclaim patterns:** "is/fully/makes you compliant",
"EU AI Act compliant", "ensures/satisfies compliance", "proves truth/legal/neutral".
**Allowed spans:** the *negated* honest-boundary sentences (e.g. "does **not** make you
compliant", "what verification does **not** mean") are carved out — they are the doctrine,
the opposite of an overclaim. Report = 0 forbidden + boundary present.

## Verification / DoD

- `astro build` + `astro preview` work; responsive; real design system.
- Hero Working-Slice + /verify run the **real** Ed25519/JCS/TrustEnvelopeV3 verify;
  tamper → real fail; export → /verify round-trips. (Node round-trip proven pre-build.)
- Leaderboard + all core pages present. Four fixes applied. Claim-scan = 0.
- Agent files + `.well-known` present; Caddy/Docker/DEPLOY present, NOT executed.
- `BUILD-STATUS.md` written. **No deploy, no push, no publish.**

## Phases

1. Foundation: scaffold, design system, vendor verify lib + crypto, prove round-trip.
2. Pages: Landing, Protocol, EU AI Act, Tools, Hard Questions, Pricing.
3. Demos: Verify, Working Slice (hero), Leaderboard.
4. Agent + Deploy scaffolding.
5. Verification: claim-scan, build/preview/responsive, BUILD-STATUS.
