// Builds the TSP logo asset system from the master PNG (cream background, no
// alpha) using sharp, in the deep-navy palette. Outputs to public/:
//   tsp-logo.png             web full lockup (navy ink, flattened on cream)
//   tsp-logo-transparent.png navy lockup keyed to alpha (luminance threshold), trimmed
//   tsp-logo-light.png       knockout/reverse (cream strokes) for dark surfaces
//   og.png                   1200x630 social card (cream + navy rule + navy logo + tagline)
//
// Ink is reclassified per-pixel by hue after the cream is keyed to alpha:
//   cool/green frame + icons -> navy  (#1d3a5f); warm copper chain -> cooled slate
//   (#3d6188); charcoal "TSP" / neutral -> kept. Alpha (anti-aliasing) is preserved.
// The master is interim; a fully vectorised SVG logo is the eventual quality step.
// The master PNG is an owner-local asset, not in the repo — point TSP_LOGO_MASTER at it.
// Run: TSP_LOGO_MASTER=/path/to/tsp-logo-primary.png node scripts/build-brand.mjs
import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const SRC = process.env.TSP_LOGO_MASTER;
if (!SRC) {
  console.error("build-brand: set TSP_LOGO_MASTER to the master logo PNG (owner-local asset, not in the repo). Outputs in public/ are committed, so this script only needs to run when the master changes.");
  process.exit(1);
}
const PUB = resolve(here, "../public");
const CREAM_BG = "#e7e1d2"; // darkest brand cream (matches site body bg)
const CREAM_INK = [244, 241, 232];
const NAVY = [29, 58, 95];   // #1d3a5f primary accent
const SLATE = [61, 97, 136]; // #3d6188 cooled copper
const NAVY_HEX = "#1d3a5f";
const AMBER_HEX = "#8a4f28"; // restrained warm secondary (og tagline)

// --- key the cream background to transparency -------------------------------
const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info; // channels === 4 after ensureAlpha
const HI = 236; // luminance >= HI -> background (fully transparent)
const LO = 200; // luminance <= LO -> ink (fully opaque); feather between

const keyed = Buffer.from(data);
for (let i = 0; i < keyed.length; i += channels) {
  const lum = 0.299 * keyed[i] + 0.587 * keyed[i + 1] + 0.114 * keyed[i + 2];
  keyed[i + 3] = lum >= HI ? 0 : lum <= LO ? 255 : Math.round((255 * (HI - lum)) / (HI - LO));
}

// --- recolor green-brand ink -> navy palette (alpha preserved) --------------
const navy = Buffer.from(keyed);
for (let i = 0; i < navy.length; i += channels) {
  if (navy[i + 3] === 0) continue;
  const r = navy[i], g = navy[i + 1], b = navy[i + 2];
  if (g - r >= 6 && b - r >= -4) {           // cool / green family -> navy
    navy[i] = NAVY[0]; navy[i + 1] = NAVY[1]; navy[i + 2] = NAVY[2];
  } else if (r - g >= 8 && r - b >= 18) {     // warm copper -> cooled slate
    navy[i] = SLATE[0]; navy[i + 1] = SLATE[1]; navy[i + 2] = SLATE[2];
  }                                           // charcoal "TSP" / neutral -> keep
}

const transparentTrimmed = await sharp(navy, { raw: { width, height, channels } }).png().trim().toBuffer();

// public/tsp-logo-transparent.png (navy lockup, for cream surfaces)
writeFileSync(`${PUB}/tsp-logo-transparent.png`, await sharp(transparentTrimmed).resize({ width: 760 }).png().toBuffer());

// public/tsp-logo.png (navy lockup flattened on cream, with breathing room)
const pad = Math.round((await sharp(transparentTrimmed).metadata()).width * 0.08);
writeFileSync(
  `${PUB}/tsp-logo.png`,
  await sharp(transparentTrimmed)
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .flatten({ background: CREAM_BG })
    .resize({ width: 640 })
    .png()
    .toBuffer()
);

// public/tsp-logo-light.png (reverse/knockout: cream strokes for dark surfaces)
const knock = Buffer.from(keyed);
for (let i = 0; i < knock.length; i += channels) {
  if (knock[i + 3] > 0) {
    knock[i] = CREAM_INK[0];
    knock[i + 1] = CREAM_INK[1];
    knock[i + 2] = CREAM_INK[2];
  }
}
writeFileSync(
  `${PUB}/tsp-logo-light.png`,
  await sharp(knock, { raw: { width, height, channels } }).png().trim().resize({ width: 760 }).png().toBuffer()
);

// --- og.png social card ------------------------------------------------------
const OG_W = 1200;
const OG_H = 630;
const logoW = 560;
const ogLogo = await sharp(transparentTrimmed).resize({ width: logoW }).png().toBuffer();
const logoMeta = await sharp(ogLogo).metadata();
const logoH = logoMeta.height;
const logoTop = 96;
const logoLeft = Math.round((OG_W - logoW) / 2);

const textTop = logoTop + logoH + 64;
const overlay = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_W}" height="${OG_H}">
    <rect width="${OG_W}" height="10" fill="${NAVY_HEX}"/>
    <text x="${OG_W / 2}" y="${textTop}" text-anchor="middle" font-family="'IBM Plex Sans', Helvetica, Arial, sans-serif" font-size="40" font-weight="700" letter-spacing="-0.5" fill="#1a1815">Proof an AI decision happened — and nobody changed it.</text>
    <text x="${OG_W / 2}" y="${textTop + 56}" text-anchor="middle" font-family="'IBM Plex Mono', ui-monospace, monospace" font-size="23" letter-spacing="3" fill="${AMBER_HEX}">VERIFIABLE AI EVIDENCE · ED25519 · OFFLINE · APACHE-2.0</text>
  </svg>`
);

writeFileSync(
  `${PUB}/og.png`,
  await sharp({ create: { width: OG_W, height: OG_H, channels: 4, background: CREAM_BG } })
    .composite([
      { input: ogLogo, top: logoTop, left: logoLeft },
      { input: overlay, top: 0, left: 0 }
    ])
    .png()
    .toBuffer()
);

console.log("navy brand assets written to public/: tsp-logo.png, tsp-logo-transparent.png, tsp-logo-light.png, og.png");
console.log(`logo trimmed render: ${logoW}x${logoH}`);
