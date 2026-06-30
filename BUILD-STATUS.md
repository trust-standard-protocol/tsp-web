# tsp-web — build status (Fase A)

A runnable, responsive **Astro** static site for **truststandardprotocol.com**, built from the
brand-pack design *direction* (not a lift-and-shift of the design-tool HTML export). Real design
system, real crypto, doctrine-clean copy. **Nothing was deployed, pushed, or published** — local
build + preview only.

## What's built (all pages present)

| Route | Page | Status |
|---|---|---|
| `/` | Landing (canonical, doctrine-rewritten) + live tamper band | done |
| `/verify` | Verify workbench — paste/upload → real verify | done |
| `/playground` | **Hero** Working Slice — build chain → break one byte → TrustBadge → dossier | done |
| `/protocol` | Spec tour: Envelope, Manifest, Verification, Conformance, Governance | done |
| `/eu-ai-act` | Art 12 / 14 / 15 / 19 / 50 + Annex III as evidence, not verdict | done |
| `/tools` | Verifier cores (1 signer / N verifiers) + open MCP + TrustBadge + modules | done |
| `/leaderboard` | Recompute-from-receipts ranking + 5-step wizard + **live score** | done |
| `/hard-questions` | Privacy, 6-attack threat model + residuals, honesty band | done |
| `/pricing` | Tiers + contact, **no hard numbers**; official status ≠ a tier | done |
| `/docs` | Quickstart (5 steps, Ed25519, correct package names) | **Fase A.2 stub** — full Starlight site deferred |

There is **one** canonical landing, **one** `/verify`, **one** `/playground` — no duplicate landings,
no dead `href="#"` links (every nav/footer target is a real route, from `src/data/site.ts`).

## How the demos wire to the real verifier

The live demos run the **real protocol verify**, not a reimplementation:

- `src/lib/tsp/` vendors the protocol's verify code — `canonical.ts` (JCS-style canonical JSON),
  `hash.ts` (SHA-256), `envelope.ts` (content/ledger/signature domains), `schema.ts`, `verify.ts`
  (`verifyTrustEnvelopeV3`), `types.ts`. This is the same surface `@trust-standard-protocol/sdk-web`
  re-exports. (Protocol-derived: header comments added + one non-cryptographic, lint-driven edit in
  `verify.ts`'s version read — no hashed/signed byte changes. Fidelity is proven by the self-test below.)
- `crypto.ts` does **real Ed25519**: native WebCrypto when supported (Chrome 137+, FF 129+, Safari 17+,
  Node 24), with an audited **`@noble/ed25519`** fallback otherwise. Cross-implementation verified.
- `sdk-web` is verify-only (`noSigning`), so `sign.ts` is a small **browser demo signer** that seals
  receipts over the **exact** canonical bytes the verifier checks → output round-trips through
  `verifyTrustEnvelopeV3`. It is a teaching issuer, clearly not the governed issuance seal.
- `/playground` exports a `{ envelope, publicKey }` bundle and "Open in /verify" hands off via
  sessionStorage — a real round-trip into the standalone verifier.

**The tamper test actually fails verification** (not a fake red state). Proven three ways:
1. `npm run verify-selftest` (Bun) — vendored verify matches all 5 upstream protocol fixture cases
   (valid / tampered / invalid-signature / missing-field / unsupported-version); demo seal round-trips
   valid; one tampered byte → `valid:false`, `contentHash:failed`.
2. Browser run on `/`, `/verify`, `/playground`: intact → `VERIFIED` (4/4 checks); break one byte →
   `FAILED` with content + ledger + signature all red. On `/playground`, breaking event 2 reports the
   chain broken at event 2 and the break **propagates downstream** (`[valid, invalid, invalid]`), the
   TrustBadge flips to "Evidence broken".
3. Chain links are checked against the **recomputed** previous ledger hash, so downstream really does
   inherit the break.

## The four content fixes (applied)

1. **Ed25519** everywhere — copy and both live demos. Zero `ECDSA`/`P-256`/`ES256` on the surface.
2. **Package names** `@trust-standard-protocol/*` (no `@tsp/*`, no `@lexitsp`).
3. **License** stated as "Apache-2.0 (open layer) + commercial TSP license (closed seal)" — no "LexiCo".
4. **Landing rewritten to doctrine** — tamper-**evident**, honest boundary line present, "no trust
   required" replaced by "without trusting the vendor". Plus: no "guarantee(s)"; "production issuance"
   → issuance (pilot / staging); the non-JS SDKs framed as **verifier cores** (1 signer / N verifiers).

## Claim-scan result

`npm run claim-scan` → **passed: zero forbidden overclaims or off-doctrine tokens** across 57 files
(`src/`, `public/`, `infra/`, README/NOTICE/DEPLOY). Hard-bans (tamper-proof, LexiCo, ECDSA, P-256,
ES256, "no trust required", production-ready/grade, production issuance, 94.14, compression, `@tsp/`,
`@lexitsp`, MIT-license, regulator-approved, guarantee) and positive compliance/truth overclaims all
return zero. The 23 `compliant`/`compliance` occurrences are all **negated boundaries** (e.g. "does
not make you compliant", "not a compliance verdict", the "what verification does not mean" list) or
`doesNotMean` enum values — the doctrine the brief requires — and are listed for transparency by the
scanner. The honest boundary line appears on the landing and on `/verify` (and elsewhere).

*Scope note:* `BUILD-PLAN.md` / `BUILD-STATUS.md` and `scripts/` are build-process docs/tooling, not
shipped site copy; they necessarily name the forbidden terms to describe the rules, so they are out of
the public-surface scan.

## Agent surface + deploy scaffolding

- Agent files present: `/llms.txt`, `/.well-known/tsp.json`, `/.well-known/security.txt`,
  `/agent/protocol.md`, `/agent/openapi.json` (placeholder), `/agent/tsp-manifest.json`. No CAPTCHA;
  core text needs no JS.
- Deploy scaffolding present but **NOT executed**: `infra/Caddyfile` (apex→site, www→redirect,
  verify.→verify, docs.→docs, agent.→static), `docker-compose.yml`, `Dockerfile`, `DEPLOY.md`,
  `.env.example`. `LICENSE` is Apache-2.0; `NOTICE` present. No secrets committed; `.env` is gitignored.
  The old `tsp-site-hel1-cloud-init.yaml` key is explicitly never reused (called out in DEPLOY/.env.example).

## Preview locally

```sh
cd tsp-web
npm ci
npm run build            # -> dist/  (static; fonts self-hosted, no Google Fonts)
npm run preview          # http://127.0.0.1:4321
npm run verify-selftest  # Bun — proves vendored verify == upstream + demo round-trip/tamper
npm run claim-scan       # zero forbidden overclaims
npm run check            # astro type-check (0 errors)
```

## Deploy later (owner runs explicitly — none done here)

See `DEPLOY.md`. Summary: provision a NEW SSH key (never the old one), harden the host (keys only,
firewall 22/80/443), `cp .env.example .env` (set `ACME_EMAIL`), `docker compose up --build -d`, point
DNS at the Hetzner host. Caddy gets certs automatically. Fase B (Fastify + Postgres = the seal) is not
in this repo.

## Decisions worth noting

- **Fresh build, not convergence** with `tsp-web-norway` (different palette/fonts + LexiCo branding).
- **Copper = primary CTA** (signals action/authorization), teal = evidence/brand surfaces — within the
  brand palette; the export used teal for actions. Taste call, kept consistent.
- **Self-test runs under Bun** (the protocol repo's own test runner) because the vendored files use
  extensionless imports (correct for Astro/Vite); the shipped site never uses Bun.
- **EN only** for now — the brand pack's EN/NO toggle was half-built; committing site-wide bilingual or
  nothing, I shipped EN-only rather than imply coverage that isn't there (auditable later).

## Status: done for Fase A

`astro build` + `astro preview` work; responsive (mobile nav collapses, grids reflow); real design
system; hero + `/verify` run the real Ed25519/JCS/TrustEnvelope v3 verify with a genuine tamper-fail
and a working round-trip; Leaderboard + all core pages present; four fixes applied; claim-scan zero;
agent + `.well-known` present; Caddy/Docker/DEPLOY scaffolding present but not executed.
**No deploy, no push, no publish.** No blockers.
