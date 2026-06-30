// Demo signer for the live playground. The published sdk-web is verify-only
// (SDK_WEB_BOUNDARY.noSigning === true), so to *emit* real envelopes the demo
// needs its own issuer. It signs the EXACT canonical bytes the vendored verifier
// checks, so its output round-trips through verifyTrustEnvelopeV3 unchanged.
// This is a teaching/demo issuer running entirely in the browser — it is not the
// governed, registry-bound issuance path that is the commercial seal.
import * as ed from "@noble/ed25519";
import { canonicalize } from "./canonical";
import { contentHash, ledgerHash, signatureDomain } from "./envelope";
import { bytesToBase64, bytesToBase64Url } from "./base64";
import type { JwkEd25519Public, SignatureEntry, TrustEnvelopeV3 } from "./types";

const encoder = new TextEncoder();

export interface DemoSigner {
  privateKey: Uint8Array;
  publicKey: JwkEd25519Public;
  keyRef: string;
}

export async function generateDemoSigner(kid: string): Promise<DemoSigner> {
  const privateKey = ed.utils.randomPrivateKey();
  const publicBytes = await ed.getPublicKeyAsync(privateKey);
  const publicKey: JwkEd25519Public = {
    kty: "OKP",
    crv: "Ed25519",
    x: bytesToBase64Url(publicBytes),
    alg: "EdDSA",
    use: "sig",
    kid
  };
  return {
    privateKey,
    publicKey,
    keyRef: `https://verify.truststandardprotocol.com/.well-known/tsp-manifest.json#${kid}`
  };
}

// Seal a draft into a complete, real TrustEnvelope V3, in issuance order:
//   1. content.hash over the canonical content.value
//   2. Ed25519 signature over the canonical signature domain (now binds the
//      content hash, but not the ledger hash or signatures)
//   3. ledger.hash over the canonical ledger domain (now binds the signature)
// content.hash / ledger.hash / signatures on the input draft are ignored and
// overwritten. The result verifies under verifyTrustEnvelopeV3; one changed byte
// of the signed surface makes it fail, exactly like the real protocol.
export async function sealEnvelope(draft: TrustEnvelopeV3, signer: DemoSigner): Promise<TrustEnvelopeV3> {
  const envelope: TrustEnvelopeV3 = structuredClone(draft);
  envelope.content.hash = await contentHash(envelope);

  const signatureBytes = await ed.signAsync(
    encoder.encode(canonicalize(signatureDomain(envelope))),
    signer.privateKey
  );
  const signature: SignatureEntry = {
    role: "instance",
    algorithm: "ed25519",
    keyRef: signer.keyRef,
    signature: bytesToBase64(signatureBytes),
    certChain: []
  };
  envelope.signatures = [signature];
  envelope.ledger.hash = await ledgerHash(envelope);
  return envelope;
}
