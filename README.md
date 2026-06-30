# tsp-web

The canonical public website for **[truststandardprotocol.com](https://truststandardprotocol.com)** —
a clean, responsive, static **Astro** site. Boring, old, stable, agent-readable.

TSP makes AI decision evidence durable, tamper-evident, and verifiable offline — by anyone, without
trusting the vendor. It does **not** make you compliant, prove a model is correct, or confer official status.

## What's here

- **Real verify, vendored.** `src/lib/tsp/` is the protocol's verify code (canonical JSON, SHA-256
  hashes, schema, `verifyTrustEnvelopeV3`) — the same surface `@trust-standard-protocol/sdk-web`
  re-exports — plus an Ed25519 layer (native WebCrypto with an `@noble/ed25519` fallback) and a
  browser demo signer. The live demos run this, not a reimplementation.
- **Hero demo** (`/playground`): build a real chain of signed receipts, verify it, break one byte,
  watch verification fail. Export a dossier that round-trips into `/verify`.
- **Verify** (`/verify`): paste/upload a receipt + public key (or a playground bundle) → real verify.
- Pages: Landing, Protocol, EU AI Act, Tools, Leaderboard, Hard Questions, Pricing, Docs (Fase A.2 stub).
- Agent surface: `/llms.txt`, `/.well-known/tsp.json`, `/.well-known/security.txt`, `/agent/*`.
- Deploy scaffolding (built, NOT executed): `infra/Caddyfile`, `docker-compose.yml`, `Dockerfile`, `DEPLOY.md`.

## Scripts

```sh
npm ci
npm run dev             # local dev server (127.0.0.1)
npm run build           # static build -> dist/
npm run preview         # serve the build (127.0.0.1:4321)
npm run check           # astro type-check
npm run verify-selftest # prove vendored verify matches upstream fixtures + demo round-trip (Bun)
npm run claim-scan      # zero forbidden overclaims
```

## License

Open layer: **Apache-2.0** (see `LICENSE`, `NOTICE`). The closed seal — issuance tooling, commercial
operator modules, and official status — is under a separate **commercial TSP license** and is not in
this repo. Marks (TSP, Trust Standard Protocol, TrustEnvelope, TrustBadge) are controlled.

## Status

See `BUILD-STATUS.md`. Nothing here has been deployed, pushed, or published — local build + preview only.
