/**
 * Samples the real palette off the extracted frames so the page tokens are
 * literally lit by the same source as the hero.
 *
 *   npm run palette
 *
 * Prints hex values to paste into the @theme block in src/app/globals.css.
 *
 * Note on method: rim-lit pixels carry the right *hue* but sit at whatever
 * lightness the lighting happened to land on, which is usually too dark to
 * use as UI accent. So the hue and channel balance come from the footage and
 * the lightness is normalised to something legible on near-black.
 */
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "public", "sequence");

const files = existsSync(DIR)
  ? readdirSync(DIR).filter((f) => f.endsWith(".webp"))
  : [];
if (files.length === 0) {
  console.error("No frames yet. Run `npm run frames` first.");
  process.exit(1);
}

// Spread the samples across the full turn so both rim lights are represented.
const picks = [0, 0.17, 0.33, 0.5, 0.67, 0.83]
  .map((t) => files[Math.floor(t * files.length)])
  .filter(Boolean);

const px = [];
for (const file of picks) {
  const { data, info } = await sharp(path.join(DIR, file))
    .resize(180, 180, { fit: "inside" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += info.channels) {
    px.push([data[i], data[i + 1], data[i + 2]]);
  }
}

const hex = (p) =>
  "#" +
  p.map((n) => Math.round(n).toString(16).padStart(2, "0")).join("");
const lum = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
const sat = ([r, g, b]) => {
  const mx = Math.max(r, g, b);
  return mx === 0 ? 0 : (mx - Math.min(r, g, b)) / mx;
};
const mean = (list) => {
  const s = list.reduce((a, p) => [a[0] + p[0], a[1] + p[1], a[2] + p[2]], [0, 0, 0]);
  return s.map((n) => n / list.length);
};
const topBy = (list, score, frac) =>
  [...list].sort((a, b) => score(b) - score(a)).slice(0, Math.max(1, Math.floor(list.length * frac)));

/** Hue and channel balance from the footage, lightness set to `peak`. */
function accent(list, peak) {
  if (list.length < 50) return null;
  const bright = topBy(list, lum, 0.15);
  const chromatic = topBy(bright, sat, 0.4);
  const avg = mean(chromatic);
  const mx = Math.max(...avg);
  if (mx <= 0) return null;
  return avg.map((n) => Math.min(255, (n / mx) * peak));
}

const reds = px.filter((p) => p[0] > p[1] * 1.25 && p[0] > p[2] * 1.2 && sat(p) > 0.3);
const cyans = px.filter((p) => p[2] > p[0] * 1.2 && p[1] > p[0] * 1.05 && sat(p) > 0.25);
const neutrals = px.filter((p) => sat(p) < 0.16);
const brightNeutrals = neutrals.filter((p) => lum(p) > 140);

const darkest = [...px].sort((a, b) => lum(a) - lum(b));
const ink = mean(darkest.slice(0, Math.floor(darkest.length * 0.12)));
const inkLift = mean(
  darkest.slice(Math.floor(darkest.length * 0.3), Math.floor(darkest.length * 0.45)),
);

const signal = accent(reds, 224);
const cyan = accent(cyans, 224);
const bone = brightNeutrals.length > 200 ? mean(topBy(brightNeutrals, lum, 0.2)) : null;

const rows = [
  ["--color-ink", hex(ink), "sampled"],
  ["--color-ink-lift", hex(inkLift), "sampled"],
  ["--color-bone", bone ? hex(bone) : "#f5f3ef", bone ? "sampled" : "kept (no bright neutrals in frame)"],
  ["--color-signal", signal ? hex(signal) : "#e0392b", signal ? "sampled hue, normalised" : "kept (too few red pixels)"],
  ["--color-cyan", cyan ? hex(cyan) : "#2bc4e0", cyan ? "sampled hue, normalised" : "kept (too few cyan pixels)"],
];

console.log(`Sampled ${px.length.toLocaleString("en-US")} pixels from ${picks.length} frames.`);
console.log(`  red-lit ${reds.length}   cyan-lit ${cyans.length}   neutral ${neutrals.length}\n`);
console.log("Paste into the @theme block in src/app/globals.css:\n");
for (const [k, v, note] of rows) {
  console.log(`  ${k}: ${v};`.padEnd(34) + `/* ${note} */`);
}
