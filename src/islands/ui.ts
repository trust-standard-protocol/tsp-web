// Shared, XSS-safe DOM rendering for the live verify demos. Everything derived
// from user-pasted JSON is written via textContent / createElement — never
// innerHTML — because the Verify workbench parses arbitrary pasted input.
// Status icons are line-art SVGs built from trusted, static geometry via
// createElementNS (same shapes as src/icons/check|x|dash.svg), kept decorative
// (aria-hidden) with the pass/fail/skip state carried as a visually-hidden word
// so screen-reader users still get the verdict once the glyph is a picture.
import type { VerificationResult } from "../lib/tsp";
import { clientLang, t } from "../i18n";

const CHECK_LABEL_KEYS: Record<keyof VerificationResult["checks"], string> = {
  schema: "islands.checks.schema",
  contentHash: "islands.checks.content_hash",
  ledgerHash: "islands.checks.ledger_hash",
  signature: "islands.checks.signature"
};

const CHECK_ORDER: Array<keyof VerificationResult["checks"]> = ["schema", "contentHash", "ledgerHash", "signature"];

const SVG_NS = "http://www.w3.org/2000/svg";
// Same coordinate system + geometry as the inlined SVG icons in src/icons/.
const ICON_PATHS: Record<"check" | "x" | "dash", string[]> = {
  check: ["M 1020,185.751 L 336.729,869.541", "M 4,536.143 L 336.729,869.541"],
  x: ["M 224,224 L 800,800", "M 800,224 L 224,800"],
  dash: ["M 300,512 L 724,512"]
};
const STATUS_ICON: Record<string, keyof typeof ICON_PATHS> = { passed: "check", failed: "x", skipped: "dash" };
const STATUS_WORD_KEYS: Record<string, string> = {
  passed: "islands.checks.passed",
  failed: "islands.checks.failed",
  skipped: "islands.checks.skipped"
};

export function icon(name: keyof typeof ICON_PATHS, size: number, weight: number): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "tsp-icon");
  svg.setAttribute("viewBox", "-51.5 -51.5 1127 1127");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", String(weight));
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  for (const d of ICON_PATHS[name]) {
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", d);
    svg.appendChild(path);
  }
  return svg;
}

export function renderChecks(container: HTMLElement, result: VerificationResult): void {
  const lang = clientLang();
  container.replaceChildren();
  for (const key of CHECK_ORDER) {
    const check = result.checks[key];
    const row = document.createElement("div");
    row.className = "check";
    row.dataset.status = check.status;

    const iconWrap = document.createElement("span");
    iconWrap.className = "check__icon";
    iconWrap.appendChild(icon(STATUS_ICON[check.status] ?? "dash", 13, 110));
    const state = document.createElement("span");
    state.className = "visually-hidden";
    state.textContent = `${t(lang, STATUS_WORD_KEYS[check.status] ?? STATUS_WORD_KEYS.skipped)}: `;
    iconWrap.appendChild(state);

    const label = document.createElement("span");
    const strong = document.createElement("strong");
    strong.textContent = t(lang, CHECK_LABEL_KEYS[key]);
    label.append(strong);

    const detail = document.createElement("span");
    detail.className = "check__detail";
    detail.textContent = check.detail;

    row.append(iconWrap, label, detail);
    container.append(row);
  }
}

/** Invalid verdict: red cross icon + message (state="invalid"). Shared with the
 *  workbench's input-error path so both render the same line-art mark. */
export function setInvalidVerdict(el: HTMLElement, text: string): void {
  el.dataset.state = "invalid";
  el.replaceChildren(icon("x", 16, 90), document.createTextNode(text));
}

export function applyVerdict(el: HTMLElement, result: VerificationResult): void {
  const lang = clientLang();
  if (result.status === "valid") {
    el.dataset.state = "valid";
    el.replaceChildren(icon("check", 16, 90), document.createTextNode(t(lang, "islands.verdict.valid")));
    return;
  }
  setInvalidVerdict(
    el,
    result.status === "unsupported-version" ? t(lang, "islands.verdict.unsupported") : t(lang, "islands.verdict.invalid")
  );
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
