// Vendored verbatim from @trust-standard-protocol/protocol (Desktop/tsp/packages/protocol/src/types.ts).
// TrustEnvelope V3 types — the normative shape the verifier and signer agree on.
export const TSP_V3_VERSION = "3.0" as const;
export const TSP_V4_DRAFT_VERSION = "4.0-draft" as const;

export type Sha256Hex = string;
export type Base64 = string;
export type ISO8601 = string;

export type ContentType = "text" | "document" | "structured";

export interface Content {
  type: ContentType;
  value: unknown;
  hash: Sha256Hex;
}

export type SourceType =
  | "legal-database"
  | "government-website"
  | "official-document"
  | "academic-paper"
  | "verified-website"
  | "model-knowledge"
  | "user-input"
  | "unknown";

export interface PrimarySource {
  type: SourceType;
  url?: string;
  title: string;
  retrieved?: ISO8601;
}

export interface Citation {
  url: string;
  paragraph: string;
  quote: string;
  retrieved: ISO8601;
}

export interface Declaration {
  primarySource: PrimarySource;
  citations: Citation[];
}

export interface Model {
  provider: string;
  name: string;
  version: string;
  temperature: number;
  contextWindow: number;
}

export type SystemPromptField =
  | { hash: Sha256Hex; text: string }
  | { hash: Sha256Hex; redacted: true; reason: string };

export interface Process {
  model: Model;
  systemPrompt: SystemPromptField;
  pipeline?: Array<{ name: string; durationMs?: number; meta?: Record<string, unknown> }>;
}

export interface Alignment {
  uncertainty: Array<{ field: string; reason: string; severity: "low" | "med" | "high" }>;
  flags?: Array<{ code: string; detail?: string }>;
  humanReviewRequired: boolean;
  policy: { id: string; version: string };
  refusal?: { reason: string };
}

export interface Timestamp {
  claimed: ISO8601;
  tsaToken: Base64;
  tsaUrl: string;
}

export interface Ledger {
  id: string;
  prevHash: Sha256Hex;
  hash: Sha256Hex;
}

export interface SignatureEntry {
  role: "instance" | "human-reviewer";
  algorithm: "ed25519";
  keyRef: string;
  signature: Base64;
  certChain: Base64[];
}

export interface ExecutionProvenance {
  spatialBoundary?: {
    gateway: string;
    toolsMounted: string[];
    toolsIsolated: boolean;
    o1ConstraintMet: boolean;
  };
  temporalBoundary?: {
    engine: string;
    tier1AnchorHash: string;
    totalContextTokens: number;
    driftDetected: boolean;
  };
  deterministicOutput?: {
    status: string;
    payloadHash: string;
  };
}

export interface TrustEnvelopeV3 {
  tsp: typeof TSP_V3_VERSION;
  content: Content;
  declaration: Declaration;
  process: Process;
  alignment: Alignment;
  timestamp: Timestamp;
  ledger: Ledger;
  signatures: SignatureEntry[];
  executionProvenance?: ExecutionProvenance;
}

export interface JwkEd25519Public {
  kty: "OKP";
  crv: "Ed25519";
  x: string;
  alg?: "EdDSA";
  use?: "sig";
  kid?: string;
}

export type CheckStatus = "passed" | "failed" | "skipped";

export interface CheckResult {
  status: CheckStatus;
  detail: string;
  evidence?: unknown;
}

export interface VerificationResult {
  valid: boolean;
  status: "valid" | "invalid" | "unsupported-version";
  protocolVersion?: string;
  checks: {
    schema: CheckResult;
    contentHash: CheckResult;
    ledgerHash: CheckResult;
    signature: CheckResult;
  };
  warnings: string[];
  meaning: "evidence-integrity";
  doesNotMean: Array<"truth" | "correctness" | "legality" | "safety" | "compliance">;
}
