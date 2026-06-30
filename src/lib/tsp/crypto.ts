// Ed25519 verification for the vendored TSP verifier.
//
// The protocol's own crypto.ts uses native WebCrypto Ed25519. We keep that exact
// path when the runtime supports it (Chrome 137+, Firefox 129+, Safari 17+,
// Node 24) and fall back to the audited, dependency-free @noble/ed25519 when it
// does not. Both are real RFC 8032 Ed25519 over the identical canonical bytes, so
// a signature produced by either verifies under the other (proven cross-impl in
// scripts/verify-selftest.mjs). This is "real Ed25519 + JCS + TrustEnvelope V3",
// never a bespoke reimplementation.
import * as ed from "@noble/ed25519";
import { base64ToBytes, base64UrlToBytes } from "./base64";
import type { JwkEd25519Public } from "./types";

const ED25519 = { name: "Ed25519" } as const;

// A valid Ed25519 public key (RFC 8037 §A.2) used only to probe native support.
const NATIVE_PROBE_KEY: JwkEd25519Public = {
  kty: "OKP",
  crv: "Ed25519",
  x: "11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo"
};

let nativeSupport: Promise<boolean> | null = null;

function supportsNativeEd25519(): Promise<boolean> {
  if (nativeSupport === null) {
    nativeSupport = (async () => {
      try {
        await crypto.subtle.importKey("jwk", NATIVE_PROBE_KEY, ED25519, false, ["verify"]);
        return true;
      } catch {
        return false;
      }
    })();
  }
  return nativeSupport;
}

export async function importEd25519PublicKey(jwk: JwkEd25519Public): Promise<CryptoKey> {
  return crypto.subtle.importKey("jwk", jwk, ED25519, false, ["verify"]);
}

export async function verifyEd25519Signature(params: {
  publicKey: JwkEd25519Public;
  signatureBase64: string;
  data: Uint8Array;
}): Promise<boolean> {
  const signature = base64ToBytes(params.signatureBase64);
  if (await supportsNativeEd25519()) {
    const key = await importEd25519PublicKey(params.publicKey);
    return crypto.subtle.verify(ED25519, key, signature as BufferSource, params.data as BufferSource);
  }
  const publicKey = base64UrlToBytes(params.publicKey.x);
  return ed.verifyAsync(signature, params.data, publicKey);
}
