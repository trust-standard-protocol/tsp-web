// Compact "break one byte" demo for the landing. Runs the real vendored verify
// against a bundled sample receipt — intact verifies, one tampered byte fails.
import { verifyTrustEnvelopeV3 } from "../lib/tsp";
import type { JwkEd25519Public, TrustEnvelopeV3 } from "../lib/tsp";
import { applyVerdict, renderChecks, tamperOneByte } from "./ui";
import sampleEnvelope from "../lib/tsp/fixtures/v3/valid-envelope.json";
import sampleKey from "../lib/tsp/fixtures/v3/valid-public-key.jwk.json";

const root = document.getElementById("tamper-band");
if (root) {
  // Our own bundled, self-tested fixtures — shapes are known and proven valid.
  const baseEnvelope = sampleEnvelope as TrustEnvelopeV3;
  const publicKey = sampleKey as JwkEd25519Public;

  const jsonEl = document.getElementById("tb-json") as HTMLElement;
  const checksEl = document.getElementById("tb-checks") as HTMLElement;
  const verdictEl = document.getElementById("tb-verdict") as HTMLElement;
  const verifyBtn = document.getElementById("tb-verify") as HTMLButtonElement;
  const tamperBtn = document.getElementById("tb-tamper") as HTMLButtonElement;
  const resetBtn = document.getElementById("tb-reset") as HTMLButtonElement;

  let current: TrustEnvelopeV3 = structuredClone(baseEnvelope);

  const show = (envelope: TrustEnvelopeV3) => {
    jsonEl.textContent = JSON.stringify(envelope, null, 2);
  };

  async function run() {
    const result = await verifyTrustEnvelopeV3(current, { publicKey });
    renderChecks(checksEl, result);
    applyVerdict(verdictEl, result);
  }

  verifyBtn.addEventListener("click", () => void run());
  tamperBtn.addEventListener("click", () => {
    current = tamperOneByte(current);
    show(current);
    void run();
  });
  resetBtn.addEventListener("click", () => {
    current = structuredClone(baseEnvelope);
    show(current);
    void run();
  });

  show(current);
  void run();
}
