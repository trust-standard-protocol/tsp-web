// Hero live-verify card. Runs the real vendored Ed25519 verify against the same
// bundled, self-tested fixture as the landing tamper-band — intact verifies,
// one tampered byte fails. The card is server-rendered in the valid state; this
// island only flips data-state on #hero-verify (+ the verdict) from the actual
// cryptographic result, and CSS reveals the matching .hv-ok / .hv-bad copy.
import { verifyTrustEnvelopeV3 } from "../lib/tsp";
import type { JwkEd25519Public, TrustEnvelopeV3 } from "../lib/tsp";
import { tamperOneByte } from "./ui";
import sampleEnvelope from "../lib/tsp/fixtures/v3/valid-envelope.json";
import sampleKey from "../lib/tsp/fixtures/v3/valid-public-key.jwk.json";

const root = document.getElementById("hero-verify");
if (root) {
  const baseEnvelope = sampleEnvelope as TrustEnvelopeV3;
  const publicKey = sampleKey as JwkEd25519Public;

  const verdict = document.getElementById("hv-verdict");
  const tamperBtn = document.getElementById("hv-tamper") as HTMLButtonElement | null;
  const resetBtn = document.getElementById("hv-reset") as HTMLButtonElement | null;

  let current: TrustEnvelopeV3 = structuredClone(baseEnvelope);

  async function run() {
    const result = await verifyTrustEnvelopeV3(current, { publicKey });
    const state = result.status === "valid" ? "valid" : "invalid";
    root!.dataset.state = state;
    if (verdict) verdict.dataset.state = state;
  }

  tamperBtn?.addEventListener("click", () => {
    current = tamperOneByte(current);
    void run();
  });
  resetBtn?.addEventListener("click", () => {
    current = structuredClone(baseEnvelope);
    void run();
  });

  void run();
}
