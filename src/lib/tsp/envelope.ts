// Vendored verbatim from @trust-standard-protocol/protocol (envelope.ts).
// Defines the canonical domains the signature and the two hashes are taken over.
// signatureDomain excludes ledger.hash and signatures; ledgerDomain includes the
// signatures (so the ledger hash binds the signatures) but still excludes ledger.hash.
import { canonicalize } from "./canonical";
import { sha256Hex } from "./hash";
import type { TrustEnvelopeV3 } from "./types";

export function signatureDomain(envelope: TrustEnvelopeV3): Record<string, unknown> {
  const domain: Record<string, unknown> = {
    tsp: envelope.tsp,
    content: envelope.content,
    declaration: envelope.declaration,
    process: envelope.process,
    alignment: envelope.alignment,
    timestamp: { claimed: envelope.timestamp.claimed, tsaUrl: envelope.timestamp.tsaUrl },
    ledger: { id: envelope.ledger.id, prevHash: envelope.ledger.prevHash }
  };
  if (envelope.executionProvenance !== undefined) {
    domain.executionProvenance = envelope.executionProvenance;
  }
  return domain;
}

export function ledgerDomain(envelope: TrustEnvelopeV3): Record<string, unknown> {
  const domain: Record<string, unknown> = {
    tsp: envelope.tsp,
    content: envelope.content,
    declaration: envelope.declaration,
    process: envelope.process,
    alignment: envelope.alignment,
    timestamp: envelope.timestamp,
    signatures: envelope.signatures,
    ledger: { id: envelope.ledger.id, prevHash: envelope.ledger.prevHash }
  };
  if (envelope.executionProvenance !== undefined) {
    domain.executionProvenance = envelope.executionProvenance;
  }
  return domain;
}

export async function contentHash(envelope: TrustEnvelopeV3): Promise<string> {
  return sha256Hex(canonicalize(envelope.content.value));
}

export async function ledgerHash(envelope: TrustEnvelopeV3): Promise<string> {
  return sha256Hex(canonicalize(ledgerDomain(envelope)));
}
