// Public barrel for the vendored Trust Standard Protocol verify/sign library.
// The verify path (canonicalize, hashes, signature domains, schema, orchestration)
// is the protocol's real code, the same surface @trust-standard-protocol/sdk-web
// re-exports. sign.ts adds a browser demo issuer the published sdk-web omits.
export { canonicalize } from "./canonical";
export { sha256Hex } from "./hash";
export { contentHash, ledgerHash, ledgerDomain, signatureDomain } from "./envelope";
export { validateTrustEnvelopeV3Shape } from "./schema";
export { importEd25519PublicKey, verifyEd25519Signature } from "./crypto";
export { verifyTrustEnvelopeV3 } from "./verify";
export { generateDemoSigner, sealEnvelope } from "./sign";
export type { DemoSigner } from "./sign";
export {
  TSP_V3_VERSION,
  TSP_V4_DRAFT_VERSION
} from "./types";
export type {
  Alignment,
  CheckResult,
  Content,
  Declaration,
  JwkEd25519Public,
  Ledger,
  Process,
  SignatureEntry,
  TrustEnvelopeV3,
  VerificationResult
} from "./types";

// Honest boundary, mirrored from sdk-web's SDK_WEB_BOUNDARY. Verification proves
// evidence integrity only — never truth, correctness, legality, safety, or compliance.
export const TSP_VERIFY_BOUNDARY = {
  meaning: "evidence-integrity",
  doesNotMean: ["truth", "correctness", "legality", "safety", "compliance"] as const,
  localOnly: true,
  noNetworkCalls: true,
  noSigningInVerifier: true
};
