import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Every public route. The a11y gate asserts ZERO WCAG 2.1 A/AA violations on
// each, in both languages (EN server-rendered, NO via the client toggle), so
// the cream/green/amber palette and the bilingual copy both stay AA.
const ROUTES = [
  "/",
  "/verify/",
  "/playground/",
  "/protocol/",
  "/tools/",
  "/why/",
  "/seal/",
  "/conformance/",
  "/trust/",
  "/register/",
  "/status/",
  "/security/",
  "/leaderboard/",
  "/hard-questions/",
  "/pricing/",
  "/docs/"
];

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function audit(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  // Surface every violation node in the failure message for fast triage.
  const summary = results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    nodes: v.nodes.map((n) => n.target.join(" "))
  }));
  expect(summary, JSON.stringify(summary, null, 2)).toEqual([]);
}

for (const route of ROUTES) {
  test(`a11y (EN): ${route}`, async ({ page }) => {
    await page.goto(route, { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await audit(page);
  });

  test(`a11y (NO): ${route}`, async ({ page }) => {
    // Start in Norwegian: the i18n island reads localStorage on load and swaps
    // every [data-i18n] node + sets <html lang="no">.
    await page.addInitScript(() => window.localStorage.setItem("tsp-lang", "no"));
    await page.goto(route, { waitUntil: "networkidle" });
    await expect(page.locator("html")).toHaveAttribute("lang", "no");
    await audit(page);
  });
}

// The language toggle itself must drive <html lang> and aria-pressed at runtime
// (a broken click handler would otherwise pass the localStorage-seeded tests).
test("language toggle drives <html lang> and aria-pressed", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const html = page.locator("html");
  const en = page.locator('[data-lang-set="en"]').first();
  const no = page.locator('[data-lang-set="no"]').first();
  await expect(html).toHaveAttribute("lang", "en");
  await expect(en).toHaveAttribute("aria-pressed", "true");

  await no.click();
  await expect(html).toHaveAttribute("lang", "no");
  await expect(no).toHaveAttribute("aria-pressed", "true");
  await expect(en).toHaveAttribute("aria-pressed", "false");

  await en.click();
  await expect(html).toHaveAttribute("lang", "en");
  await expect(en).toHaveAttribute("aria-pressed", "true");
});

// Keyboard operability smoke: the demo is useless to keyboard users if it can't
// be reached and fired without a mouse. We exercise the real key events, not clicks.
test("skip link is the first tab stop and jumps to main", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.keyboard.press("Tab");
  const focusedClass = await page.evaluate(() => document.activeElement?.className ?? "");
  expect(focusedClass).toContain("skip-link");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
});

test("EN/NO toggle is operable by Enter and Space", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const html = page.locator("html");
  await page.locator('[data-lang-set="no"]').first().focus();
  await page.keyboard.press("Enter");
  await expect(html).toHaveAttribute("lang", "no");
  await page.locator('[data-lang-set="en"]').first().focus();
  await page.keyboard.press("Space");
  await expect(html).toHaveAttribute("lang", "en");
});

test("mobile hamburger opens the nav by keyboard", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/", { waitUntil: "networkidle" });
  const toggle = page.locator("[data-nav-toggle]");
  const links = page.locator("#site-nav-links");
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(links).toHaveAttribute("data-open", "true");
});

test("tamper/reset demo controls fire by keyboard and update the live verdict", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const verdict = page.locator("#tb-verdict");
  // The verdict must be a live region so the change is announced.
  await expect(verdict).toHaveAttribute("aria-live", "polite");
  await expect(verdict).toHaveAttribute("data-state", "valid");
  await page.locator("#tb-tamper").focus();
  await page.keyboard.press("Enter");
  await expect(verdict).toHaveAttribute("data-state", "invalid");
  await page.locator("#tb-reset").focus();
  await page.keyboard.press("Enter");
  await expect(verdict).toHaveAttribute("data-state", "valid");
});
