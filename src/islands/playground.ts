// Working Slice playground — the hero demo. Builds a real chain of signed
// TrustEnvelope v3 receipts in the browser (demo signer), verifies each with the
// vendored protocol verifier, lets you break one byte and watch it fail, renders
// a TrustBadge from the live result, and exports a dossier that round-trips into
// /verify. Every signature/hash is real Ed25519 + JCS — not a mock.
//
// Chain semantics: the single-envelope verifier checks each receipt's own
// integrity + signature. The cross-receipt link is a demo-level check that
// compares receipt[i].ledger.prevHash to the RECOMPUTED ledger hash of
// receipt[i-1]. So tampering event k both fails k's own verification AND breaks
// the link from k+1 (whose prevHash no longer matches k's real hash) — broken
// state then propagates downstream, which is the honest behaviour.
import { generateDemoSigner, ledgerHash, sealEnvelope, verifyTrustEnvelopeV3 } from "../lib/tsp";
import type { DemoSigner, JwkEd25519Public, TrustEnvelopeV3, VerificationResult } from "../lib/tsp";
import { clientLang, t } from "../i18n";
import { icon, renderChecks, tamperOneByte } from "./ui";

const GENESIS = "0".repeat(64);

interface EventSpec {
  title: string;
  value: string;
  humanReviewRequired: boolean;
}

const SCENARIO: EventSpec[] = [
  {
    title: "AI recommendation",
    value:
      "Loan application A-2291: onboarding assistant recommends MANUAL REVIEW — debt-to-income 0.62 exceeds the 0.45 policy threshold.",
    humanReviewRequired: true
  },
  {
    title: "Human override",
    value:
      "Analyst R-77 override: APPROVE WITH CONDITIONS (additional collateral). Reviewed the AI recommendation and the applicant file.",
    humanReviewRequired: true
  },
  {
    title: "Decision issued",
    value:
      "Decision issued for A-2291: APPROVED WITH CONDITIONS under credit-policy v4.2. Applicant notified; evidence sealed.",
    humanReviewRequired: false
  }
];

function draftFor(spec: EventSpec, index: number, prevHash: string): TrustEnvelopeV3 {
  const claimed = `2026-06-30T10:0${index}:00Z`;
  return {
    tsp: "3.0",
    content: { type: "text", value: spec.value, hash: "" },
    declaration: {
      primarySource: {
        type: "official-document",
        url: "https://northbank.example/policy/credit-v4",
        title: "Northbank credit policy v4.2",
        retrieved: claimed
      },
      citations: []
    },
    process: {
      model: { provider: "northbank-ai", name: "loan-onboarding-assist", version: "2026.04", temperature: 0, contextWindow: 8192 },
      systemPrompt: { hash: GENESIS, redacted: true, reason: "internal onboarding policy prompt" }
    },
    alignment: {
      uncertainty: [],
      humanReviewRequired: spec.humanReviewRequired,
      policy: { id: "credit-policy", version: "4.2.0" }
    },
    timestamp: { claimed, tsaToken: "__demo_no_tsa__", tsaUrl: "https://placeholder.invalid/no-tsa" },
    ledger: { id: `019789d6-4c00-7000-8000-00000000000${index + 1}`, prevHash, hash: "" },
    signatures: []
  };
}

const el = (id: string) => document.getElementById(id);

const root = el("playground");
if (root) {
  const chainEl = el("pg-chain");
  const verdictEl = el("pg-verdict");
  const badgeEl = el("pg-badge");
  const noteEl = el("pg-note");
  const buildBtn = el("pg-build");
  const verifyBtn = el("pg-verify");
  const breakBtn = el("pg-break");
  const resetBtn = el("pg-reset");
  const exportBtn = el("pg-export");
  const breakSelect = el("pg-target") as HTMLSelectElement | null;

  let signer: DemoSigner | null = null;
  let chain: TrustEnvelopeV3[] = [];
  let results: VerificationResult[] = [];
  let broken: boolean[] = [];

  function setVerdict(state: string, text: string) {
    if (!verdictEl) return;
    verdictEl.dataset.state = state;
    if (state === "valid") verdictEl.replaceChildren(icon("check", 16, 90), document.createTextNode(text));
    else if (state === "invalid") verdictEl.replaceChildren(icon("x", 16, 90), document.createTextNode(text));
    else verdictEl.textContent = text;
  }

  function setNote(text: string) {
    if (noteEl) noteEl.textContent = text;
  }

  async function build() {
    setNote("Generating an Ed25519 demo key and sealing three chained receipts…");
    signer = await generateDemoSigner("playground-001");
    chain = [];
    let prevHash = GENESIS;
    for (let i = 0; i < SCENARIO.length; i++) {
      const sealed = await sealEnvelope(draftFor(SCENARIO[i], i, prevHash), signer);
      chain.push(sealed);
      prevHash = sealed.ledger.hash;
    }
    results = [];
    broken = [];
    renderChain();
    renderBadge();
    setVerdict("idle", "Chain built and signed. Verify it, then try breaking a byte.");
    setNote("Three receipts, each linking to the previous receipt's ledger hash (prevHash → hash).");
    if (breakSelect) {
      breakSelect.replaceChildren();
      SCENARIO.forEach((spec, i) => {
        const opt = document.createElement("option");
        opt.value = String(i);
        opt.textContent = `Event ${i + 1} — ${spec.title}`;
        breakSelect.append(opt);
      });
      breakSelect.value = "1";
    }
  }

  function renderChain() {
    if (!chainEl) return;
    chainEl.replaceChildren();
    chain.forEach((envelope, i) => {
      const result = results[i];
      const isBroken = broken[i] === true;
      const card = document.createElement("article");
      card.className = "card chain-card";
      if (result) card.dataset.state = isBroken ? "invalid" : "valid";

      const head = document.createElement("div");
      head.className = "chain-card__head";
      const title = document.createElement("strong");
      title.textContent = `Event ${i + 1} — ${SCENARIO[i].title}`;
      const chip = document.createElement("span");
      chip.className = "chip";
      if (result) {
        chip.classList.add(isBroken ? "chip--bad" : "chip--ok");
        chip.textContent = isBroken ? "broken" : "verified";
      } else {
        chip.textContent = "sealed";
      }
      head.append(title, chip);

      const body = document.createElement("p");
      body.className = "muted";
      body.style.fontSize = "var(--fs-small)";
      body.textContent = typeof envelope.content.value === "string" ? envelope.content.value : JSON.stringify(envelope.content.value);

      const meta = document.createElement("p");
      meta.className = "mono";
      meta.style.fontSize = "var(--fs-micro)";
      meta.style.color = "var(--ink-muted)";
      meta.textContent = `ledger …${envelope.ledger.id.slice(-4)} · hash ${envelope.ledger.hash.slice(0, 16)}… · prev ${envelope.ledger.prevHash === GENESIS ? "genesis" : `${envelope.ledger.prevHash.slice(0, 12)}…`}`;

      card.append(head, body, meta);

      if (result) {
        const checks = document.createElement("div");
        checks.className = "checks";
        checks.style.marginTop = "0.6rem";
        renderChecks(checks, result);
        card.append(checks);
      }

      const link = document.createElement("button");
      link.type = "button";
      link.className = "btn btn-quiet";
      link.style.marginTop = "0.7rem";
      link.textContent = "Open this receipt in /verify ↗";
      link.addEventListener("click", () => openInVerify(envelope));
      card.append(link);

      chainEl.append(card);
    });
  }

  async function verify() {
    if (!signer || chain.length === 0) {
      setVerdict("invalid", "Build the chain first.");
      return;
    }
    const key: JwkEd25519Public = signer.publicKey;
    results = await Promise.all(chain.map((envelope) => verifyTrustEnvelopeV3(envelope, { publicKey: key })));
    const recomputed = await Promise.all(chain.map((envelope) => ledgerHash(envelope)));

    broken = [];
    let chainBroken = false;
    for (let i = 0; i < chain.length; i++) {
      const linkOk = i === 0 ? chain[0].ledger.prevHash === GENESIS : chain[i].ledger.prevHash === recomputed[i - 1];
      if (!results[i].valid || !linkOk) chainBroken = true;
      broken[i] = chainBroken;
    }

    renderChain();
    renderBadge();

    const firstBroken = broken.findIndex((b) => b);
    if (firstBroken === -1) {
      setVerdict("valid", "Chain VERIFIED — every receipt's integrity and signature check out, links intact.");
      setNote("All three receipts verify offline against the demo public key. This is the real protocol verify.");
    } else {
      setVerdict("invalid", `Chain BROKEN at event ${firstBroken + 1} — its evidence, and everything chained after it, can no longer be trusted.`);
      setNote("One altered byte changes the content hash, which breaks the ledger hash and the signature — and the next receipt's prevHash no longer matches the real hash, so the break propagates downstream.");
    }
  }

  function breakByte() {
    if (chain.length === 0) {
      setVerdict("invalid", "Build the chain first.");
      return;
    }
    const index = breakSelect ? Number(breakSelect.value) : 1;
    chain[index] = tamperOneByte(chain[index]);
    setNote(`Flipped one byte of event ${index + 1}'s content. Re-verifying…`);
    void verify();
  }

  function renderBadge() {
    if (!badgeEl) return;
    const allValid = results.length > 0 && broken.every((b) => !b);
    badgeEl.dataset.state = allValid ? "valid" : "invalid";
    badgeEl.replaceChildren();

    const mark = document.createElement("span");
    mark.className = "trustbadge__mark";
    mark.appendChild(icon(allValid ? "check" : "x", 16, 95));

    const text = document.createElement("span");
    const label = document.createElement("strong");
    label.textContent = allValid ? "Evidence verified" : "Evidence broken";
    const sub = document.createElement("small");
    sub.textContent = allValid
      ? "TrustEnvelope v3 · Ed25519 · integrity only"
      : "verification failed — do not rely on this receipt";
    text.append(label, document.createElement("br"), sub);

    badgeEl.append(mark, text);
  }

  function openInVerify(envelope: TrustEnvelopeV3) {
    if (!signer) return;
    const bundle = { envelope, publicKey: signer.publicKey };
    sessionStorage.setItem("tsp_verify_bundle", JSON.stringify(bundle));
    window.location.href = "/verify/";
  }

  function exportDossier() {
    if (!signer || chain.length === 0) return;
    const dossier = {
      kind: "tsp-demo-dossier",
      note: t(clientLang(), "islands.playground.dossier_note"),
      publicKey: signer.publicKey,
      chain
    };
    const blob = new Blob([JSON.stringify(dossier, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "tsp-demo-dossier.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  buildBtn?.addEventListener("click", () => void build());
  verifyBtn?.addEventListener("click", () => void verify());
  breakBtn?.addEventListener("click", breakByte);
  resetBtn?.addEventListener("click", () => void build());
  exportBtn?.addEventListener("click", exportDossier);

  void build();
}
