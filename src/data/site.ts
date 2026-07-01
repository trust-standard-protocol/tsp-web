// Single source of truth for site metadata and navigation. Every link here
// points to a real route — no dead `href="#"` targets anywhere on the site.
// Display labels are localized via the i18n key (see src/i18n); the label here
// is the English default that is also server-rendered.
export const site = {
  name: "Trust Standard Protocol",
  short: "TSP",
  domain: "truststandardprotocol.com",
  url: "https://truststandardprotocol.com",
  tagline: "The truth of the record — not a judgment of the outcome.",
  description:
    "An open protocol for verifiable AI evidence. It preserves and verifies what actually happened inside an instrumented boundary — authentic, tamper-evident, and checkable by anyone, offline. It does not judge whether the output was correct, safe, or compliant.",
  repo: "https://github.com/trust-standard-protocol",
  pkgScope: "@trust-standard-protocol",
  license: "Apache-2.0 (open layer) + commercial TSP license (closed seal)"
} as const;

export interface NavLink {
  href: string;
  label: string;
  i18n?: string;
}

// Top navigation (KANONISK IA): the journey + the open/paid split. Verify +
// Playground render as CTAs (in SiteHeader), not in this list; GitHub is the
// external link. Hard questions / Docs / Trust / Security / Status live in the footer.
export const primaryNav: NavLink[] = [
  { href: "/protocol/", label: "Protocol", i18n: "chrome.nav.protocol" },
  { href: "/why/", label: "Why", i18n: "chrome.nav.why" },
  { href: "/tools/", label: "Tools", i18n: "chrome.nav.tools" },
  { href: "/seal/", label: "Seal", i18n: "chrome.nav.seal" },
  { href: "/conformance/", label: "Conformance", i18n: "chrome.nav.conformance" },
  { href: "/leaderboard/", label: "Leaderboard", i18n: "chrome.nav.leaderboard" },
  { href: "/pricing/", label: "Pricing", i18n: "chrome.nav.pricing" }
];

export interface FooterGroup {
  title: string;
  i18n?: string;
  links: NavLink[];
}

// Footer — four groups mirroring the canonical IA. The fix vs. the old footer:
// Leaderboard + Pricing live under Seal (the paid/product layer), NOT under
// Documentation; Why and Hard questions sit under Protocol; the open free layer
// (Verify · Playground · Tools · Docs) is its own group; Company & Agents carries
// governance + the machine surface. Every href is a real route on this site.
export const footerGroups: FooterGroup[] = [
  {
    title: "Protocol",
    i18n: "chrome.footer.g_protocol",
    links: [
      { href: "/protocol/", label: "Protocol spec", i18n: "chrome.footer.f_protocol" },
      { href: "/why/", label: "Why", i18n: "chrome.footer.f_why" },
      { href: "/hard-questions/", label: "Hard questions", i18n: "chrome.footer.f_hardq" }
    ]
  },
  {
    title: "Open layer",
    i18n: "chrome.footer.g_open",
    links: [
      { href: "/verify/", label: "Verify a receipt", i18n: "chrome.footer.f_verify" },
      { href: "/playground/", label: "Playground", i18n: "chrome.footer.f_playground" },
      { href: "/tools/", label: "Tools & verifier cores", i18n: "chrome.footer.f_tools" },
      { href: "/docs/", label: "Docs", i18n: "chrome.footer.f_docs" }
    ]
  },
  {
    title: "Seal",
    i18n: "chrome.footer.g_seal",
    links: [
      { href: "/seal/", label: "Seal", i18n: "chrome.footer.f_seal" },
      { href: "/conformance/", label: "Conformance", i18n: "chrome.footer.f_conformance" },
      { href: "/register/", label: "Register", i18n: "chrome.footer.f_register" },
      { href: "/leaderboard/", label: "Leaderboard", i18n: "chrome.footer.f_leaderboard" },
      { href: "/pricing/", label: "Pricing", i18n: "chrome.footer.f_pricing" }
    ]
  },
  {
    title: "Company & Agents",
    i18n: "chrome.footer.g_company",
    links: [
      { href: "/trust/", label: "Trust", i18n: "chrome.footer.f_trust" },
      { href: "/security/", label: "Security", i18n: "chrome.footer.f_security" },
      { href: "/status/", label: "Status", i18n: "chrome.footer.f_status" },
      { href: "/llms.txt", label: "llms.txt", i18n: "chrome.footer.f_llms" },
      { href: "/.well-known/tsp.json", label: ".well-known/tsp.json", i18n: "chrome.footer.f_tspjson" },
      { href: "/.well-known/security.txt", label: "security.txt", i18n: "chrome.footer.f_securitytxt" },
      { href: "/agent/protocol.md", label: "Agent surface", i18n: "chrome.footer.f_agent" }
    ]
  }
];
