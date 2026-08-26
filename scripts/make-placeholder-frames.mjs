/**
 * Procedural stand-in for rotation.mp4.
 *
 * Renders a rotating figure lit by a red and a cyan rim light against
 * near-black, matching the shape and weight of the real footage so the hero
 * motion can be judged before the clip exists. Throw it away the moment
 * `npm run frames` has run.
 *
 *   npm run frames:placeholder
 */
import { mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { writeManifest } from "./manifest.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const SETS = [
  {
    key: "desktop",
    dir: "/sequence",
    outDir: path.join(ROOT, "public", "sequence"),
    width: 900,
    height: 900,
    count: 72,
    quality: 82,
  },
  {
    key: "mobile",
    dir: "/sequence-mobile",
    outDir: path.join(ROOT, "public", "sequence-mobile"),
    width: 540,
    height: 720,
    count: 48,
    quality: 78,
  },
];

const RED = [224, 57, 43];
const CYAN = [43, 196, 224];

const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);

function sdCircle(px, py, cx, cy, r) {
  const dx = px - cx;
  const dy = py - cy;
  return Math.sqrt(dx * dx + dy * dy) - r;
}

function sdCapsule(px, py, ax, ay, bx, by, r) {
  const pax = px - ax;
  const pay = py - ay;
  const bax = bx - ax;
  const bay = by - ay;
  const denom = bax * bax + bay * bay;
  let h = denom === 0 ? 0 : (pax * bax + pay * bay) / denom;
  h = h < 0 ? 0 : h > 1 ? 1 : h;
  const dx = pax - bax * h;
  const dy = pay - bay * h;
  return Math.sqrt(dx * dx + dy * dy) - r;
}

/** Polynomial smooth-min, so the joins read as one body. */
function smin(a, b, k) {
  const h = Math.max(0, k - Math.abs(a - b)) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}

/** Torso profile in image-height units: shoulders, waist, hips. */
const SPINE = [
  [-0.13, 0.172],
  [-0.09, 0.168],
  [-0.02, 0.152],
  [0.05, 0.14],
  [0.13, 0.142],
  [0.22, 0.153],
  [0.33, 0.164],
  [0.45, 0.172],
];

/**
 * Signed distance to the figure at rotation `theta`, in units where
 * 1.0 == image height and the origin is the image centre. Roughly a
 * half-body portrait: head, neck, shoulders, arms, cropped at the hips.
 */
function figureSD(u, v, geo) {
  const { w, sway, headShift } = geo;
  // Compress x to fake the change in silhouette width as the body turns.
  const x = (u - sway) / w;

  // Head and neck join tightly, so the neck still reads at the silhouette.
  let d = sdCircle(x, v, headShift, -0.345, 0.077);
  d = smin(d, sdCapsule(x, v, headShift * 0.6, -0.288, 0, -0.155, 0.034), 0.02);

  let body = sdCircle(x, v, 0, SPINE[0][0], SPINE[0][1]);
  for (let i = 1; i < SPINE.length; i += 1) {
    body = smin(body, sdCircle(x, v, 0, SPINE[i][0], SPINE[i][1]), 0.06);
  }
  d = smin(d, body, 0.022);

  d = smin(d, sdCapsule(x, v, -0.158, -0.12, -0.196, 0.26, 0.048), 0.035);
  d = smin(d, sdCapsule(x, v, 0.158, -0.12, 0.196, 0.26, 0.048), 0.035);

  // Re-metricate approximately after the x compression.
  return d * w;
}

const RIM = 0.021;
const GLOW = 0.07;

function renderFrame(width, height, theta) {
  const buf = Buffer.allocUnsafe(width * height * 3);

  const w = 0.66 + 0.34 * Math.abs(Math.cos(theta));
  const geo = {
    w,
    sway: 0.012 * Math.sin(theta),
    headShift: 0.022 * Math.sin(theta),
  };

  // Lights are fixed in the room, so in screen space they sweep with -theta.
  // They sit opposite one another, so both rims read on every frame.
  const aR = -theta + 2.55;
  const aC = aR + Math.PI;
  const rdx = Math.cos(aR);
  const rdy = Math.sin(aR);
  const cdx = Math.cos(aC);
  const cdy = Math.sin(aC);

  const eps = 1.1 / height;
  const cx = width / 2;
  const cy = height / 2;

  // Faint background wash from the same two sources.
  const bgRx = 0.31 * Math.cos(aR);
  const bgRy = 0.2 * Math.sin(aR) - 0.05;
  const bgCx = 0.31 * Math.cos(aC);
  const bgCy = 0.2 * Math.sin(aC) - 0.05;

  let o = 0;
  for (let py = 0; py < height; py += 1) {
    const v = (py - cy) / height;
    for (let px = 0; px < width; px += 1) {
      const u = (px - cx) / height;

      const dR = Math.hypot(u - bgRx, v - bgRy);
      const dC = Math.hypot(u - bgCx, v - bgCy);
      const washR = Math.exp(-(dR * dR) / 0.08) * 15;
      const washC = Math.exp(-(dC * dC) / 0.08) * 12;

      let r = 10 + washR * 0.85 + washC * 0.1;
      let g = 10 + washR * 0.12 + washC * 0.55;
      let b = 11 + washR * 0.1 + washC * 0.8;

      const d = figureSD(u, v, geo);

      if (d < 0) {
        // Interior sits darker than the backdrop: a silhouette.
        r = 7;
        g = 7;
        b = 9;
      }

      if (d > -RIM && d < GLOW) {
        const dx =
          (figureSD(u + eps, v, geo) - figureSD(u - eps, v, geo)) / (2 * eps);
        const dy =
          (figureSD(u, v + eps, geo) - figureSD(u, v - eps, geo)) / (2 * eps);
        const len = Math.hypot(dx, dy) || 1;
        const nx = dx / len;
        const ny = dy / len;

        const lr = Math.max(0, nx * rdx + ny * rdy);
        const lc = Math.max(0, nx * cdx + ny * cdy);

        let amount;
        if (d <= 0) {
          amount = Math.pow(clamp01(1 + d / RIM), 1.45);
        } else {
          amount = Math.exp(-d / (GLOW * 0.4)) * 0.5;
        }

        const ir = Math.pow(lr, 1.25) * amount;
        const ic = Math.pow(lc, 1.25) * amount * 0.9;

        r += RED[0] * ir + CYAN[0] * ic;
        g += RED[1] * ir + CYAN[1] * ic;
        b += RED[2] * ir + CYAN[2] * ic;
      }

      // Sensor noise, so it does not read as vector art.
      const n = (Math.random() - 0.5) * 5;
      buf[o] = Math.max(0, Math.min(255, r + n)) | 0;
      buf[o + 1] = Math.max(0, Math.min(255, g + n)) | 0;
      buf[o + 2] = Math.max(0, Math.min(255, b + n)) | 0;
      o += 3;
    }
  }
  return buf;
}

const manifest = {
  source: "placeholder",
  generatedAt: new Date().toISOString(),
};

for (const set of SETS) {
  rmSync(set.outDir, { recursive: true, force: true });
  mkdirSync(set.outDir, { recursive: true });

  const started = Date.now();
  for (let i = 0; i < set.count; i += 1) {
    const theta = (i / set.count) * Math.PI * 2;
    const raw = renderFrame(set.width, set.height, theta);
    const name = `frame-${String(i + 1).padStart(3, "0")}.webp`;
    await sharp(raw, {
      raw: { width: set.width, height: set.height, channels: 3 },
    })
      .webp({ quality: set.quality, effort: 4 })
      .toFile(path.join(set.outDir, name));
  }
  console.log(
    `[${set.key}] ${set.count} frames in ${((Date.now() - started) / 1000).toFixed(1)}s`,
  );

  manifest[set.key] = {
    dir: set.dir,
    count: set.count,
    width: set.width,
    height: set.height,
    ext: "webp",
  };
}

const out = await writeManifest(ROOT, manifest);
console.log(`Manifest -> ${path.relative(ROOT, out)}`);
