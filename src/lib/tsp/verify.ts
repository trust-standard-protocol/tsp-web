// Vendored from @trust-standard-protocol/protocol (verify.ts). The verification
// orchestration is byte-for-byte the protocol's: schema -> contentHash ->
// ledgerHash -> Ed25519 signature, over the same canonical domains. The only
// edits versus upstream are local-lint conformance in the non-cryptographic
// protocol-version read (uses `in`-narrowing instead of an inline cast) and a
// named post-validation cast — neither changes a single hashed/signed byte.
import { canonicalize } from "./canonical";
import { contentHash, ledgerHash, signatureDomain } from "./envelope";
import { verifyEd25519Signature } from "./crypto";
import { validateTrustEnvelopeV3Shape } from "./schema";
import { TSP_V3_VERSION, type CheckResult, type JwkEd25519Public, type TrustEnvelopeV3, type VerificationResult } from "./types";

const encoder = new TextEncoder();

const pass = (detail: string): CheckResult => ({ status: "passed", detail });
const fail = (detail: string, evidence?: unknown): CheckResult => ({ status: "failed", detail, evidence });
const skipped = (detail: string): CheckResult => ({ status: "skipped", detail });

const baseResult = (status: VerificationResult["status"], protocolVersion?: string): Omit<VerificationResult, "checks" | "warnings"> => ({
  valid: status === "valid",
  status,
  protocolVersion,
  meaning: "evidence-integrity",
  doesNotMean: ["truth", "correctness", "legality", "safety", "compliance"]
});

function getProtocolVersion(envelope: unknown): string | undefined {
  if (typeof envelope === "object" && envelope !== null && "tsp" in envelope) {
    const value = envelope.tsp;
    return typeof value === "string" ? value : undefined;
  }
  return undefined;
}

export async function verifyTrustEnvelopeV3(
  envelope: unknown,
  options: { publicKey: JwkEd25519Public }
): Promise<VerificationResult> {
  const protocolVersion = getProtocolVersion(envelope);
  const checks: VerificationResult["checks"] = {
    schema: skipped("not checked"),
    contentHash: skipped("not checked"),
    ledgerHash: skipped("not checked"),
    signature: skipped("not checked")
  };

  if (protocolVersion !== TSP_V3_VERSION) {
    checks.schema = fail(`unsupported protocol version: ${protocolVersion ?? "missing"}`);
    return {
      ...baseResult("unsupported-version", protocolVersion),
      checks,
      warnings: ["only local TSP v3.0 verification is implemented in packages/protocol"]
    };
  }

  const schemaErrors = validateTrustEnvelopeV3Shape(envelope);
  if (schemaErrors.length > 0) {
    checks.schema = fail(`schema validation failed: ${schemaErrors.join("; ")}`, schemaErrors);
    return {
      ...baseResult("invalid", protocolVersion),
      checks,
      warnings: []
    };
  }
  checks.schema = pass("schema is well-formed");

  // Safe: shape just passed validateTrustEnvelopeV3Shape above.
  const typedEnvelope = envelope as TrustEnvelopeV3;
  const expectedContentHash = await contentHash(typedEnvelope);
  checks.contentHash =
    expectedContentHash === typedEnvelope.content.hash
      ? pass("content hash matches canonical content value")
      : fail("content hash mismatch", { claimed: typedEnvelope.content.hash, computed: expectedContentHash });

  const expectedLedgerHash = await ledgerHash(typedEnvelope);
  checks.ledgerHash =
    expectedLedgerHash === typedEnvelope.ledger.hash
      ? pass("ledger hash matches canonical envelope without ledger.hash")
      : fail("ledger hash mismatch", { claimed: typedEnvelope.ledger.hash, computed: expectedLedgerHash });

  const signature = typedEnvelope.signatures[0];
  try {
    const ok = await verifyEd25519Signature({
      publicKey: options.publicKey,
      signatureBase64: signature.signature,
      data: encoder.encode(canonicalize(signatureDomain(typedEnvelope)))
    });
    checks.signature = ok ? pass("ed25519 signature verifies over canonical signature domain") : fail("ed25519 signature invalid");
  } catch (error) {
    checks.signature = fail("ed25519 signature verification failed", String(error));
  }

  const valid = Object.values(checks).every((check) => check.status === "passed");
  return {
    ...baseResult(valid ? "valid" : "invalid", protocolVersion),
    valid,
    checks,
    warnings: ["local-only verification: no network, hosted issuer, registry, revocation, TSA, DANE, or licensing checks are performed"]
  };
}
