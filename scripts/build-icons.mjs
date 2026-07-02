// Copies the chosen line-art icons into src/icons/, normalizing each so it is
// themeable via `currentColor` and sized by the <Icon> component (not baked into
// the file):
//   - stroke="black" | stroke="#15403d"  -> stroke="currentColor"
//   - strip baked stroke-width            (the component sets weight per use)
//   - strip root width/height             (the component sets the render size)
// Two sources feed the set:
//   1. The original dark-green line-art set (brand graphics folder).
//   2. Brand pack (6) line-art, vendored repo-local under scripts/brand6-icons/
//      (the colored .red/.copper/.amber variants' intent is applied at use-site
//      via `currentColor` + CSS color, so only the base glyphs are normalized).
//
// Run: node scripts/build-icons.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(here, "../src/icons");

// Source 1: original dark-green set (chosen by shape from the 84 icons).
const SRC_DIR = "C:/Users/Administrator/Desktop/gamma-media-for-meg/graphics";
const MAP = {
  check: "TL7R9bGZ98OxXoF2pYFH",         // checkmark
  lock: "Aug9Lwp4f5Kv9Ac5qak6ud",        // padlock
  registry: "106kJTlNZGHZUwIL7Tgh",      // database / public ledger
  "shield-lock": "Ca9lM0IzVTHi1n6XwtBy", // shield + lock (tamper-evident)
  eye: "VHeI9s1Ccwe5TMOVMIuB",           // eye in shield (private / inspection)
  search: "cZ83sbUUer9IJonnnfxB",        // magnifier (anyone can check)
  bolt: "ieDMrdF2uruqDR6htQtVaH",        // lightning bolt (break a byte)
  warning: "063a773953f145fe81e3",       // alert triangle
  "seal-rosette": "sLmf3m06SEQAxoFLNxXs", // large scalloped award seal (hero spot art)
  gavel: "dWM4wY6JRSQQQaaZjVCme5",         // gavel (accountability — /trust hero spot)
  gauge: "JKQZKFkhExvs4da9KfZm"            // dial/gauge (operational status — /status hero spot)
};

// Source 2: brand pack (6), vendored repo-local for reproducibility.
const SRC_DIR_6 = resolve(here, "brand6-icons");
const MAP_6 = {
  receipt: "jAFUUP3monLvjTzPZv2T",          // torn receipt (signed receipts)
  "badge-check": "JTZDSwgmT5QAhSzTBx8uWa",  // shield + check (portable verification)
  medal: "7koatBpdZbqOaQNHf3Lq",            // rosette / medal (governed official status)
  code: "FWMQkLiEkyLcqPpp4jMEh2",           // </> brackets (developers)
  "clipboard-check": "5slD6DP7VIK3E9IDFG6O",// clipboard checklist (scoped review)
  auditor: "NVpbQOM2xGorFg9MZefG",          // person + magnifier (auditors)
  handshake: "C5XJhV9KpUsLbLx7ssxXYi"       // handshake (partners)
};

function normalize(svg) {
  let s = svg;
  s = s.replace(/stroke="black"/g, 'stroke="currentColor"');
  s = s.replace(/stroke="#15403d"/gi, 'stroke="currentColor"');
  s = s.replace(/\s*stroke-width="45(?:\.0)?"/g, "");
  // drop root width/height (keep viewBox)
  s = s.replace(/(<svg\b[^>]*?)\s+width="[\d.]+"\s+height="[\d.]+"/, "$1");
  return s.trim() + "\n";
}

mkdirSync(OUT_DIR, { recursive: true });
let count = 0;
for (const [srcDir, map] of [[SRC_DIR, MAP], [SRC_DIR_6, MAP_6]]) {
  for (const [name, hash] of Object.entries(map)) {
    const raw = readFileSync(`${srcDir}/${hash}.svg`, "utf8");
    writeFileSync(`${OUT_DIR}/${name}.svg`, normalize(raw), "utf8");
    console.log(`icon: ${name}.svg  <-  ${hash}.svg`);
    count++;
  }
}
console.log(`Wrote ${count} icons to src/icons/`);
