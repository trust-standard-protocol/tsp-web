// One-off diagnostic: dump full axe violation detail (incl. contrast colors +
// ratios) for every route, both languages, to stdout as JSON. Not part of the
// gate — that's tests/a11y.spec.ts. Requires a preview server on :4321.
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const BASE = process.env.BASE || "http://127.0.0.1:4321";
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
const ROUTES = [
  "/", "/verify/", "/playground/", "/protocol/", "/tools/", "/why/",
  "/seal/", "/conformance/", "/trust/", "/register/", "/status/", "/security/",
  "/leaderboard/", "/hard-questions/", "/pricing/", "/docs/"
];

const browser = await chromium.launch();
const out = {};
for (const lang of ["en", "no"]) {
  for (const route of ROUTES) {
    const ctx = await browser.newContext();
    if (lang === "no") await ctx.addInitScript(() => window.localStorage.setItem("tsp-lang", "no"));
    const page = await ctx.newPage();
    await page.goto(BASE + route, { waitUntil: "networkidle" });
    const res = await new AxeBuilder({ page }).withTags(TAGS).analyze();
    const key = `${lang} ${route}`;
    out[key] = res.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({
        target: n.target.join(" "),
        data: (n.any || []).map((c) => c.data).filter(Boolean)
      }))
    }));
    await ctx.close();
  }
}
await browser.close();
console.log(JSON.stringify(out, null, 2));
