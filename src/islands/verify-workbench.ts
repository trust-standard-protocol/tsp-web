// Full /verify workbench. Re-runs the real vendored TSP verify in the browser
// against a pasted/uploaded receipt + issuer public key (or a {envelope,
// publicKey} bundle exported from the playground). Nothing is uploaded anywhere.
import { verifyTrustEnvelopeV3 } from "../lib/tsp";
import type { JwkEd25519Public, TrustEnvelopeV3 } from "../lib/tsp";
import { applyVerdict, renderChecks, setInvalidVerdict, tamperOneByte } from "./ui";
import sampleEnvelope from "../lib/tsp/fixtures/v3/valid-envelope.json";
import sampleKey from "../lib/tsp/fixtures/v3/valid-public-key.jwk.json";

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const envEl = document.getElementById("vf-envelope");
const keyEl = document.getElementById("vf-key");
const verdictEl = document.getElementById("vf-verdict");
const checksEl = document.getElementById("vf-checks");
const warnEl = document.getElementById("vf-warnings");

if (
  envEl instanceof HTMLTextAreaElement &&
  keyEl instanceof HTMLTextAreaElement &&
  verdictEl &&
  checksEl &&
  warnEl
) {
  const elEnv = envEl;
  const elKey = keyEl;
  const elVerdict = verdictEl;
  const elChecks = checksEl;
  const elWarn = warnEl;

  const verifyBtn = document.getElementById("vf-verify");
  const sampleBtn = document.getElementById("vf-sample");
  const tamperBtn = document.getElementById("vf-tamper");
  const clearBtn = document.getElementById("vf-clear");
  const fileEl = document.getElementById("vf-file");

  const idle = (text: string) => {
    elVerdict.dataset.state = "idle";
    elVerdict.textContent = text;
    elChecks.replaceChildren();
    elWarn.textContent = "";
  };

  const invalid = (text: string) => {
    setInvalidVerdict(elVerdict, text);
    elChecks.replaceChildren();
    elWarn.textContent = "";
  };

  // Accept either two fields (envelope + key JWK) or a single pasted bundle
  // { "envelope": {...}, "publicKey": {...} } in the envelope field.
  function readInputs(): { envelope: unknown; publicKey: unknown } | { error: string } {
    let parsedEnvelope: unknown;
    try {
      parsedEnvelope = JSON.parse(elEnv.value);
    } catch (error) {
      return { error: `Receipt is not valid JSON — ${messageOf(error)}` };
    }
    if (
      parsedEnvelope !== null &&
      typeof parsedEnvelope === "object" &&
      "envelope" in parsedEnvelope &&
      "publicKey" in parsedEnvelope
    ) {
      return { envelope: parsedEnvelope.envelope, publicKey: parsedEnvelope.publicKey };
    }
    if (elKey.value.trim() === "") {
      return { error: "Paste the issuer public key (JWK), or a { envelope, publicKey } bundle in the receipt box." };
    }
    try {
      return { envelope: parsedEnvelope, publicKey: JSON.parse(elKey.value) };
    } catch (error) {
      return { error: `Public key is not valid JSON — ${messageOf(error)}` };
    }
  }

  async function verify() {
    const inputs = readInputs();
    if ("error" in inputs) {
      invalid(inputs.error);
      return;
    }
    // The verifier validates the key at the crypto layer (import / decode);
    // a malformed key surfaces as a failed signature check, never a crash.
    const publicKey = inputs.publicKey as JwkEd25519Public;
    try {
      const result = await verifyTrustEnvelopeV3(inputs.envelope, { publicKey });
      renderChecks(elChecks, result);
      applyVerdict(elVerdict, result);
      elWarn.textContent = result.warnings.join(" ");
    } catch (error) {
      invalid(`Verification error — ${messageOf(error)}`);
    }
  }

  const loadSample = () => {
    elEnv.value = JSON.stringify(sampleEnvelope, null, 2);
    elKey.value = JSON.stringify(sampleKey, null, 2);
    idle("Sample loaded. Press Verify, or break a byte first.");
  };

  verifyBtn?.addEventListener("click", () => void verify());
  sampleBtn?.addEventListener("click", loadSample);
  clearBtn?.addEventListener("click", () => {
    elEnv.value = "";
    elKey.value = "";
    idle("Cleared. Paste a receipt or load a sample.");
  });
  tamperBtn?.addEventListener("click", () => {
    let parsed: TrustEnvelopeV3;
    try {
      parsed = JSON.parse(elEnv.value) as TrustEnvelopeV3;
    } catch (error) {
      invalid(`Can't tamper — receipt is not valid JSON (${messageOf(error)}).`);
      return;
    }
    elEnv.value = JSON.stringify(tamperOneByte(parsed), null, 2);
    void verify();
  });
  if (fileEl instanceof HTMLInputElement) {
    fileEl.addEventListener("change", async () => {
      const file = fileEl.files?.[0];
      if (!file) return;
      elEnv.value = await file.text();
      idle("File loaded. Press Verify.");
    });
  }

  // Seamless round-trip from the playground: it stashes a { envelope, publicKey }
  // bundle in sessionStorage, then navigates here. Load and verify it once.
  const handoff = sessionStorage.getItem("tsp_verify_bundle");
  if (handoff) {
    sessionStorage.removeItem("tsp_verify_bundle");
    try {
      const bundle: unknown = JSON.parse(handoff);
      if (bundle !== null && typeof bundle === "object" && "envelope" in bundle && "publicKey" in bundle) {
        elEnv.value = JSON.stringify(bundle.envelope, null, 2);
        elKey.value = JSON.stringify(bundle.publicKey, null, 2);
        void verify();
      }
    } catch {
      /* ignore a malformed handoff */
    }
  }
}
