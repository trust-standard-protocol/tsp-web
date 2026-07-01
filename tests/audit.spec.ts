import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";

// NO dictionary, loaded at runtime (loader-agnostic — no JSON import attribute).
const no: unknown = JSON.parse(readFileSync(new URL("../src/i18n/no.json", import.meta.url), "utf8"));

// Audit suite — real behavioural assertions for the interactive islands (driven
// with the REAL vendored Ed25519 verify), bilingual data-i18n integrity, console
// cleanliness, and responsive overflow. These assert observable behaviour, not
// plumbing: a broken verdict, a missing NO translation, a console error, or a
// mobile overflow each fails a specific test here.

const PUBLIC_ROUTES = [
  "/", "/verify/", "/playground/", "/protocol/", "/tools/", "/why/", "/seal/",
  "/conformance/", "/trust/", "/register/", "/status/", "/security/",
  "/leaderboard/", "/hard-questions/", "/pricing/", "/docs/"
];

/** Narrowing guard so dot-path access is type-checked, not asserted. */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/** Resolve a dot-path (numeric segments for arrays) against a JSON dict. */
function resolve(dict: unknown, path: string): unknown {
  let node: unknown = dict;
  for (const seg of path.split(".")) {
    if (!isRecord(node)) return undefined;
    node = node[seg];
  }
  return node;
}

// ---- Hero live-verify card (#hero-verify): real Ed25519, valid -> break -> reset.
test("hero live-verify flips valid -> invalid -> valid on real crypto", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const card = page.locator("#hero-verify");
  const verdict = page.locator("#hv-verdict");
  await expect(card).toHaveAttribute("data-state", "valid");
  await page.locator("#hv-tamper").click();
  await expect(card).toHaveAttribute("data-state", "invalid");
  await expect(verdict).toHaveAttribute("data-state", "invalid");
  await page.locator("#hv-reset").click();
  await expect(card).toHaveAttribute("data-state", "valid");
  await expect(verdict).toHaveAttribute("data-state", "valid");
});

// ---- Landing tamper-band (#tamper-band): verdict + per-check states are real.
test("tamper-band breaks the seal and marks failed checks", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const verdict = page.locator("#tb-verdict");
  await expect(verdict).toHaveAttribute("data-state", "valid");
  await page.locator("#tb-tamper").click();
  await expect(verdict).toHaveAttribute("data-state", "invalid");
  // At least the content-hash check must fail when a byte changes.
  await expect(page.locator('#tb-checks .check[data-status="failed"]').first()).toBeVisible();
  await page.locator("#tb-reset").click();
  await expect(verdict).toHaveAttribute("data-state", "valid");
  await expect(page.locator('#tb-checks .check[data-status="failed"]')).toHaveCount(0);
});

// ---- Verify workbench (/verify): sample valid, tamper fails, bad JSON graceful.
test("verify workbench: sample verifies, tamper fails, bad JSON is graceful", async ({ page }) => {
  await page.goto("/verify/", { waitUntil: "networkidle" });
  await page.locator("#vf-sample").click();
  await page.locator("#vf-verify").click();
  await expect(page.locator("#vf-verdict")).toHaveAttribute("data-state", "valid");
  await expect(page.locator('#vf-checks .check[data-status="passed"]')).toHaveCount(4);

  await page.locator("#vf-tamper").click();
  await expect(page.locator("#vf-verdict")).toHaveAttribute("data-state", "invalid");

  await page.locator("#vf-envelope").fill("{not valid json");
  await page.locator("#vf-key").fill("");
  await page.locator("#vf-verify").click();
  await expect(page.locator("#vf-verdict")).toHaveAttribute("data-state", "invalid");
  await expect(page.locator("#vf-verdict")).toContainText("not valid JSON");
});

// ---- Verify workbench XSS: pasted HTML/script payloads never execute or inject.
test("verify workbench renders pasted payloads as inert text (no XSS)", async ({ page }) => {
  await page.goto("/verify/", { waitUntil: "networkidle" });
  await page.locator("#vf-envelope").fill('<img src=x onerror="window.__tspXssAudit=1">');
  await page.locator("#vf-key").fill("");
  await page.locator("#vf-verify").click();
  await expect(page.locator("#vf-verdict")).toHaveAttribute("data-state", "invalid");
  const escaped = await page.evaluate(() => ({
    flag: "__tspXssAudit" in window,
    injectedImg: document.querySelectorAll('img[src="x"]').length,
    onerrorEls: document.querySelectorAll("[onerror]").length
  }));
  expect(escaped.flag).toBe(false);
  expect(escaped.injectedImg).toBe(0);
  expect(escaped.onerrorEls).toBe(0);
});

// ---- Playground (/playground): build a real signed chain, verify, break, reset.
test("playground builds a signed chain, verifies, then breaks", async ({ page }) => {
  await page.goto("/playground/", { waitUntil: "networkidle" });
  // Auto-builds on load; the chain renders three receipts and a badge.
  await expect(page.locator("#pg-chain > *")).toHaveCount(3);
  await expect(page.locator("#pg-badge")).not.toBeEmpty();
  await page.locator("#pg-verify").click();
  await expect(page.locator("#pg-verdict")).toHaveAttribute("data-state", "valid");
  await page.locator("#pg-break").click();
  await expect(page.locator("#pg-verdict")).toHaveAttribute("data-state", "invalid");
});

// ---- Leaderboard (/leaderboard): score + tier recompute from the sliders.
test("leaderboard recomputes score and tier from inputs", async ({ page }) => {
  await page.goto("/leaderboard/", { waitUntil: "networkidle" });
  const setAll = (v: number) =>
    page.evaluate((val) => {
      for (const id of ["lb-verif", "lb-cover", "lb-oversight"]) {
        const el = document.getElementById(id);
        if (el instanceof HTMLInputElement) {
          el.value = String(val);
          el.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
    }, v);
  await setAll(100);
  await expect(page.locator("#lb-score")).toHaveText("100.0");
  await expect(page.locator("#lb-tier")).toHaveText("Charter");
  await setAll(10);
  await expect(page.locator("#lb-score")).toHaveText("10.0");
  await expect(page.locator("#lb-tier")).toHaveText("Not yet listed");
});

// ---- i18n integrity: in NO, EVERY [data-i18n] node swaps to its NO dict value.
// Catches a missing NO key (silent EN fallback) or a broken swap on any page.
for (const route of PUBLIC_ROUTES) {
  test(`i18n NO swap is complete on ${route}`, async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem("tsp-lang", "no"));
    await page.goto(route, { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("lang", "no");
    const nodes = await page.$$eval("[data-i18n]", (els) =>
      els.map((e) => ({ key: e.getAttribute("data-i18n") ?? "", text: e.textContent ?? "" }))
    );
    const mismatches = nodes.filter((n) => {
      const v = resolve(no, n.key);
      return typeof v === "string" && n.text !== v;
    });
    expect(mismatches, JSON.stringify(mismatches.slice(0, 10), null, 2)).toEqual([]);
  });
}

// ---- Console + network cleanliness on every public route.
for (const route of PUBLIC_ROUTES) {
  test(`no console errors or failed requests on ${route}`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error") errors.push(`console: ${m.text()}`); });
    page.on("response", (r) => { if (r.status() >= 400) errors.push(`http ${r.status()}: ${r.url()}`); });
    page.on("requestfailed", (r) => errors.push(`failed: ${r.url()}`));
    await page.goto(route, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    expect(errors, JSON.stringify(errors, null, 2)).toEqual([]);
  });
}

// ---- Responsive: no horizontal overflow at mobile / tablet / desktop.
const RESPONSIVE_PAGES = ["/", "/why/", "/seal/", "/verify/", "/pricing/", "/protocol/", "/leaderboard/"];
const WIDTHS = [375, 768, 1280];
for (const route of RESPONSIVE_PAGES) {
  for (const width of WIDTHS) {
    test(`no horizontal overflow on ${route} @${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route, { waitUntil: "networkidle" });
      const overflow = await page.evaluate((vw) => document.documentElement.scrollWidth - vw, width);
      expect(overflow, `scrollWidth exceeds viewport by ${overflow}px`).toBeLessThanOrEqual(1);
    });
  }
}

// ---- The nav CTA arrow must survive a language toggle (regression: the " →"
// was inside the data-i18n node and got dropped on the first swap).
test("nav CTA keeps its arrow after a language toggle", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const cta = page.locator(".nav-cta").first();
  await expect(cta).toContainText("→");
  await page.locator('[data-lang-set="no"]').first().click();
  await page.locator('[data-lang-set="en"]').first().click();
  await expect(cta).toContainText("→");
});
