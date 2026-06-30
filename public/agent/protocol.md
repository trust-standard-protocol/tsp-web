# Trust Standard Protocol — agent summary

TSP wraps an AI-mediated event into a signed, hashed, chained record (a **TrustEnvelope v3**) that
anyone can verify offline. It reports **evidence integrity** — never truth, correctness, legality,
safety, or compliance.

## What a verifier checks

1. **Schema** — the envelope is a well-formed TrustEnvelope v3.
2. **Content integrity** — `content.hash` == SHA-256 of the canonical (sorted-key) JSON of `content.value`.
3. **Ledger / chain hash** — `ledger.hash` == SHA-256 of the canonical ledger domain (which binds the signatures).
4. **Signature** — the `Ed25519` signature verifies over the canonical signature domain, against the issuer's public key.

All four must pass for `valid: true`. Change one byte of the signed surface and verification fails.

## Canonicalization

Deterministic JSON: object keys sorted; strings escaped per JSON; numbers minimal; no whitespace.
This is the byte-exact serialization all TSP implementations agree on.

## Algorithms

- Signature: **Ed25519** (EdDSA). Keys are OKP JWKs (`{ "kty":"OKP","crv":"Ed25519","x":"…" }`).
- Hash: **SHA-256**.

## Packages

Scope `@trust-standard-protocol`. One signer (`sdk-js`); the other SDKs are **verifier cores**
(`sdk-web`, `sdk-python`, `sdk-go`, `sdk-rust`, `sdk-java`, `sdk-csharp`). Open layer: Apache-2.0.

## Boundary

Verification reports evidence state. Official issuer status is a governed grant — never resolved by
verification alone, never granted by payment. A person decides whether to trust, escalate, audit, or reject.

See also: `/.well-known/tsp.json`, `/agent/tsp-manifest.json`, `/agent/openapi.json`.
