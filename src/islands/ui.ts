// Shared, XSS-safe DOM rendering for the live verify demos. Everything derived
// from user-pasted JSON is written via textContent / createElement — never
// innerHTML — because the Verify workbench parses arbitrary pasted input.
import type { VerificationResult } from "../lib/tsp";

const CHECK_LABELS: Record<keyof VerificationResult["checks"], string> = {
  schema: "Schema & shape",
  contentHash: "Content integrity (SHA-256)",
  ledgerHash: "Ledger / chain hash (SHA-256)",
  signature: "Issuer signature (Ed25519)"
};

const CHECK_ICON: Record<string, string> = { passed: "\u2713", failed: "\u2717", skipped: "\u00b7" };

const CHECK_ORDER: Array<keyof VerificationResult["checks"]> = ["schema", "contentHash", "ledgerHash", "signature"];

export function renderChecks(container: HTMLElement, result: VerificationResult): void {
  container.replaceChildren();
  for (const key of CHECK_ORDER) {
    const check = result.checks[key];
    const row = document.createElement("div");
    row.className = "check";
    row.dataset.status = check.status;

    const icon = document.createElement("span");
    icon.className = "check__icon";
    icon.textContent = CHECK_ICON[check.status] ?? "\u00b7";

    const label = document.createElement("span");
    const strong = document.createElement("strong");
    strong.textContent = CHECK_LABELS[key];
    label.append(strong);

    const detail = document.createElement("span");
    detail.className = "check__detail";
    detail.textContent = check.detail;

    row.append(icon, label, detail);
    container.append(row);
  }
}

export function applyVerdict(el: HTMLElement, result: VerificationResult): void {
  if (result.status === "valid") {
    el.dataset.state = "valid";
    el.textContent = "\u2713 VERIFIED — evidence integrity intact";
    return;
  }
  el.dataset.state = "invalid";
  el.textContent =
    result.status === "unsupported-version"
      ? "\u2717 UNSUPPORTED — not a TSP v3 receipt"
      : "\u2717 FAILED — this receipt was altered or is invalid";
}

export function tamperOneByte<T>(envelope: T): T {
  const clone = structuredClone(envelope);
  if (
    clone !== null &&
    typeof clone === "object" &&
    "content" in clone &&
    clone.content !== null &&
    typeof clone.content === "object" &&
    "value" in clone.content &&
    typeof clone.content.value === "string" &&
    clone.content.value.length > 0
  ) {
    const value = clone.content.value;
    const index = Math.floor(value.length / 2);
    const replacement = value[index] === "a" ? "e" : "a";
    clone.content.value = value.slice(0, index) + replacement + value.slice(index + 1);
  }
  return clone;
}
