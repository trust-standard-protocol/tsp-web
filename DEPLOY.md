# Deploying tsp-web (Fase A) — reference only, NOT executed by the build

> This file documents how the owner deploys later. **Nothing here has been run.**
> No SSH, no push, no publish was performed building this site.

## What ships

- A static Astro build (`dist/`) — apex site + `/verify`, `/playground`, `/protocol`,
  `/eu-ai-act`, `/tools`, `/leaderboard`, `/hard-questions`, `/pricing`, `/docs`.
- Machine-readable surfaces: `/llms.txt`, `/.well-known/tsp.json`,
  `/.well-known/security.txt`, `/agent/*`.
- No backend, no database (that is Fase B).

## Stack

- **Astro** (static) · **Caddy** (auto-HTTPS) · **Docker Compose** · **Hetzner** host.
- Caddy maps subdomains: apex → site, `www` → redirect, `verify.` → `/verify`,
  `docs.` → Starlight (Fase A.2), `agent.` → static agent files. See `infra/Caddyfile`.

## Build + preview locally (safe, no network)

```sh
npm ci
npm run build       # -> dist/
npm run preview     # http://127.0.0.1:4321
npm run verify-selftest   # proves the vendored verify matches upstream fixtures (Bun)
npm run claim-scan        # zero forbidden overclaims
```

## Deploy (owner runs this explicitly — do NOT run unprompted)

1. **Provision a NEW SSH deploy key.** Never reuse the old
   `tsp-site-hel1-cloud-init.yaml` key — treat it as compromised/exposed.
2. Harden the host: SSH keys only, no root/password login, non-root deploy user.
   Firewall open only on 22/80/443. Postgres/Redis never public (none in Fase A).
3. On the host:
   ```sh
   cp .env.example .env   # set ACME_EMAIL; keep .env out of git
   docker compose up --build -d
   ```
   Caddy obtains certificates from Let's Encrypt automatically.
4. DNS: point apex + `www` + `verify.` + `docs.` + `agent.` A records at the host.
5. Verify: hit `https://truststandardprotocol.com/` and `/.well-known/tsp.json`,
   then run the live tamper demo on `/playground` and `/verify`.

## Fase B (only after willingness-to-pay is validated)

Fastify API + Postgres + dashboard = the seal. Add backups (pg_dump) and Uptime
monitoring then — not before. None of it is in this repo.

## Guardrails

- No secrets in git. `.env` is gitignored; ship `.env.example` only.
- Deploy is outward-facing and hard to reverse — the owner confirms it explicitly.
- The live demos run the real Ed25519 / JCS / TrustEnvelope v3 verify; the tamper
  test actually fails verification (proven by `npm run verify-selftest`).
