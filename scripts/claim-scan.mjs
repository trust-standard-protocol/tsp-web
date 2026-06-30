#!/usr/bin/env node
// Claim scan for the TSP public site. Fails on forbidden overclaims and on
// off-doctrine tokens. The honest boundary — stated as a NEGATION ("does not
// make you compliant", "what verification does not mean") — is the doctrine the
// site must carry, so the scan targets POSITIVE overclaims and hard-banned
// tokens, not the bare words "compliant"/"compliance". For transparency it also
// lists every compliant/compliance occurrence with context so a reviewer can see
// each one is a negated boundary, never a claim.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const SCAN_DIRS = ["src", "public", "infra"];
const SCAN_ROOT_FILES = [
  "README.md",
  "NOTICE",
  "DEPLOY.md",
  "package.json",
  "astro.config.mjs",
  ".env.example",
  "docker-compose.yml",
  "Dockerfile"
];
const SCAN_EXT = new Set([".astro", ".ts", ".js", ".mjs", ".css", ".md", ".json", ".txt", ".svg", ".yml", ".yaml", ".html", ""]);
const IGNORE_DIRS = new Set(["node_modules", "dist", ".astro", ".git"]);
// BUILD-PLAN.md / BUILD-STATUS.md are build-process docs (not shipped site copy)
// and necessarily name the forbidden terms to describe the four content fixes,
// so they are intentionally out of scope. scripts/ (incl. this scanner's own
// token list) is likewise not part of the public surface.
// Hard-banned tokens — must not appear anywhere on the public surface.
const HARD_BANS = [
  { id: "tamper-proof", re: /tamper[\s-]?proof/gi, hint: "use tamper-evident" },
  { id: "LexiCo", re: /\bLexiCo\b/gi, hint: "internal holding brand — keep off the marketing site" },
  { id: "ECDSA", re: /\bECDSA\b/gi, hint: "TSP signs with Ed25519" },
  { id: "P-256", re: /\bP-?256\b/gi, hint: "TSP signs with Ed25519, not P-256" },
  { id: "ES256", re: /\bES256\b/gi, hint: "TSP signs with Ed25519 (EdDSA), not ES256" },
  { id: "secp256", re: /secp256/gi, hint: "TSP signs with Ed25519" },
  { id: "no-trust-required", re: /no trust required/gi, hint: 'use "without trusting the vendor"' },
  { id: "production-ready", re: /production[\s-](ready|grade)/gi, hint: "avoid release-maturity overclaims" },
  { id: "production-issuance", re: /production issuance/gi, hint: "use issuance (pilot / staging)" },
  { id: "guarantee", re: /\bguarantee[sd]?\b/gi, hint: "use property / secures / supports — never guarantee" },
  { id: "aoe-94.14", re: /\b94\.14\b/gi, hint: "off-scope AOE/compression claim" },
  { id: "compression", re: /\bcompression\b/gi, hint: "off-scope AOE compression claim" },
  { id: "tsp-scope", re: /@tsp\//gi, hint: "use @trust-standard-protocol/" },
  { id: "lexitsp-scope", re: /@lexitsp\b/gi, hint: "use @trust-standard-protocol/" },
  { id: "mit-license", re: /\bMIT[\s-]?licen[sc]/gi, hint: "TSP is Apache-2.0 + commercial, not MIT" },
  { id: "apache-mit", re: /Apache\s*\/\s*MIT|MIT\s*\/\s*Apache/gi, hint: "no dual Apache/MIT posture" },
  { id: "regulator-approved", re: /regulator[\s-]approved/gi, hint: "TSP must not imply regulator approval" }
];

// Positive compliance / truth overclaims — the negated forms are allowed and not matched here.
const OVERCLAIMS = [
  { id: "is-compliant", re: /\b(?:is|are|you'?re|makes you|made you|become[s]?)\s+(?:fully\s+)?compliant\b/gi },
  { id: "fully-compliant", re: /\bfully compliant\b/gi },
  { id: "eu-ai-act-compliant", re: /\bEU AI Act compliant\b/gi },
  { id: "ensures-compliance", re: /\b(?:ensures?|achieves?|satisfies?|delivers?|grants?)\s+(?:the\s+)?(?:EU AI Act\s+)?compliance\b/gi },
  { id: "compliance-guaranteed", re: /\bcompliance\s+(?:is\s+)?guaranteed\b/gi },
  { id: "proves-truth", re: /\bproves?\s+(?:truth|it'?s\s+true|the\s+truth)\b/gi },
  { id: "proves-legal", re: /\bproves?\s+(?:legal|legality|it'?s\s+legal|neutral|neutrality)\b/gi },
  { id: "legally-compliant-positive", re: /(?<!not\s)(?<!never\s)\bmakes?\s+(?:it|you)\s+legally compliant\b/gi }
];

function collect(target, out) {
  let stat;
  try {
    stat = statSync(target);
  } catch {
    return;
  }
  if (stat.isDirectory()) {
    const base = target.split(sep).pop();
    if (IGNORE_DIRS.has(base)) return;
    for (const entry of readdirSync(target)) collect(join(target, entry), out);
    return;
  }
  if (SCAN_EXT.has(extname(target))) out.push(target);
}

const files = [];
for (const dir of SCAN_DIRS) collect(join(root, dir), files);
for (const f of SCAN_ROOT_FILES) collect(join(root, f), files);

function lineOf(text, index) {
  return text.slice(0, index).split("\n").length;
}

const findings = [];
const boundaryUses = [];

for (const file of files) {
  const rel = relative(root, file).split(sep).join("/");
  const text = readFileSync(file, "utf8");

  for (const ban of HARD_BANS) {
    ban.re.lastIndex = 0;
    let m;
    while ((m = ban.re.exec(text)) !== null) {
      findings.push({ rel, line: lineOf(text, m.index), id: ban.id, match: m[0], hint: ban.hint });
    }
  }
  for (const rule of OVERCLAIMS) {
    rule.re.lastIndex = 0;
    let m;
    while ((m = rule.re.exec(text)) !== null) {
      findings.push({ rel, line: lineOf(text, m.index), id: rule.id, match: m[0], hint: "positive overclaim" });
    }
  }
  // Transparency: list compliant/compliance occurrences (expected only as negated boundaries).
  const boundaryRe = /.{0,28}complian(?:t|ce).{0,12}/gi;
  let b;
  while ((b = boundaryRe.exec(text)) !== null) {
    boundaryUses.push({ rel, line: lineOf(text, b.index), context: b[0].replace(/\s+/g, " ").trim() });
  }
}

console.log(`claim-scan: scanned ${files.length} files.`);

if (boundaryUses.length > 0) {
  console.log(`\nboundary uses of "compliant/compliance" (${boundaryUses.length}) — must all be negations:`);
  for (const u of boundaryUses) console.log(`  ${u.rel}:${u.line}  …${u.context}…`);
}

if (findings.length > 0) {
  console.error(`\n${findings.length} forbidden finding(s):`);
  for (const f of findings) console.error(`  ${f.rel}:${f.line}  [${f.id}] "${f.match}" — ${f.hint}`);
  process.exit(1);
}

console.log("\nclaim-scan passed: zero forbidden overclaims or off-doctrine tokens.");
