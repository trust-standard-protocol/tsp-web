// Single source of truth for site metadata and navigation. Every link here
// points to a real route — no dead `href="#"` targets anywhere on the site.
export const site = {
  name: "Trust Standard Protocol",
  short: "TSP",
  domain: "truststandardprotocol.com",
  url: "https://truststandardprotocol.com",
  tagline: "Tamper-evident evidence for what your AI did — and what it didn't.",
  description:
    "An open protocol that makes AI decision evidence durable, tamper-evident, and verifiable offline by anyone — without trusting the vendor. It does not make you compliant.",
  repo: "https://github.com/trust-standard-protocol",
  pkgScope: "@trust-standard-protocol",
  license: "Apache-2.0 (open layer) + commercial TSP license (closed seal)"
} as const;

export interface NavLink {
  href: string;
  label: string;
}

// Top navigation. Verify + Playground render as CTAs, not in this list.
export const primaryNav: NavLink[] = [
  { href: "/protocol/", label: "Protocol" },
  { href: "/tools/", label: "Tools" },
  { href: "/eu-ai-act/", label: "EU AI Act" },
  { href: "/leaderboard/", label: "Leaderboard" },
  { href: "/hard-questions/", label: "Hard Questions" },
  { href: "/pricing/", label: "Pricing" }
];

export interface FooterGroup {
  title: string;
  links: NavLink[];
}

export const footerGroups: FooterGroup[] = [
  {
    title: "Verify",
    links: [
      { href: "/verify/", label: "Verify a receipt" },
      { href: "/playground/", label: "See it work end-to-end" },
      { href: "/protocol/", label: "Protocol spec" }
    ]
  },
  {
    title: "Build",
    links: [
      { href: "/tools/", label: "Tools & verifier cores" },
      { href: "/docs/", label: "Docs" },
      { href: "/agent/protocol.md", label: "Agent surface" }
    ]
  },
  {
    title: "Trust",
    links: [
      { href: "/hard-questions/", label: "Hard questions" },
      { href: "/eu-ai-act/", label: "EU AI Act" },
      { href: "/leaderboard/", label: "Leaderboard" },
      { href: "/pricing/", label: "Pricing" }
    ]
  }
];
