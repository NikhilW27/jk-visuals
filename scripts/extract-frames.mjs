/**
 * Extracts the hero frame sequences from rotation.mp4.
 *
 *   npm run frames            # expects ./rotation.mp4
 *   npm run frames -- path/to/clip.mp4
 *
 * Writes public/sequence (desktop, square) and public/sequence-mobile
 * (portrait), then regenerates src/lib/sequence-manifest.ts.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, rmSync, mkdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { writeManifest } from "./manifest.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** ffmpeg is often installed but not yet on PATH in an already-open shell. */
function findBinary(name) {
  const probe = (cmd) => {
    try {
      const r = spawnSync(cmd, ["-version"], { stdio: "ignore" });
      return r.status === 0;
    } catch {
      return false;
    }
  };

  if (process.env.FFMPEG_PATH && probe(process.env.FFMPEG_PATH)) {
    return process.env.FFMPEG_PATH;
  }
  if (probe(name)) return name;

  const local = process.env.LOCALAPPDATA;
  if (local) {
    const pkgs = path.join(local, "Microsoft", "WinGet", "Packages");
    if (existsSync(pkgs)) {
      for (const dir of readdirSync(pkgs)) {
        if (!/ffmpeg/i.test(dir)) continue;
        const outer = path.join(pkgs, dir);
        for (const inner of readdirSync(outer)) {
          const candidate = path.join(outer, inner, "bin", `${name}.exe`);
          if (existsSync(candidate) && probe(candidate)) return candidate;
        }
      }
    }
  }
  return null;
}

const ffmpeg = findBinary("ffmpeg");
const ffprobe = findBinary("ffprobe");

if (!ffmpeg) {
  console.error(
    "ffmpeg not found.\n" +
      "  Install:  winget install --id Gyan.FFmpeg -e --source winget\n" +
      "  Then reopen your terminal, or set FFMPEG_PATH to ffmpeg.exe.",
  );
  process.exit(1);
}

const source = path.resolve(ROOT, process.argv[2] ?? "rotation.mp4");
if (!existsSync(source)) {
  console.error(
    `Source clip not found: ${source}\n` +
      "Drop rotation.mp4 in the project root, or pass a path:\n" +
      "  npm run frames -- ../footage/orbit.mp4",
  );
  process.exit(1);
}

/** Probe the source so the crop maths work for any resolution, not just 1080p. */
function probeSize() {
  if (!ffprobe) return { width: 1920, height: 1080, probed: false };
  const r = spawnSync(
    ffprobe,
    [
      "-v", "error",
      "-select_streams", "v:0",
      "-show_entries", "stream=width,height:format=duration",
      "-of", "json",
      source,
    ],
    { encoding: "utf8" },
  );
  try {
    const json = JSON.parse(r.stdout ?? "{}");
    const w = Number(json.streams?.[0]?.width);
    const h = Number(json.streams?.[0]?.height);
    const duration = Number(json.format?.duration);
    if (!w || !h) return { width: 1920, height: 1080, duration: 0, probed: false };
    return { width: w, height: h, duration: duration || 0, probed: true };
  } catch {
    return { width: 1920, height: 1080, duration: 0, probed: false };
  }
}

const { width: SRC_W, height: SRC_H, duration: SRC_DURATION, probed } = probeSize();

/**
 * Frame counts are targets, not a fixed fps, so swapping in a clip of any
 * length still yields the same payload and the same rotation smoothness.
 * A hardcoded fps would silently double the download for a 20s clip.
 * Override with:  npm run frames -- --frames=96
 */
const FRAMES_FLAG = process.argv.find((a) => a.startsWith("--frames="));
const TARGET_DESKTOP = Number(FRAMES_FLAG?.split("=")[1]) || 72;
const TARGET_MOBILE = Math.round(TARGET_DESKTOP * (2 / 3));

/** ffmpeg emits roughly duration*fps frames, so solve for fps. */
function fpsFor(target) {
  if (!SRC_DURATION) return target / 10; // assume the brief's 10s clip
  return Math.min(30, Math.max(0.5, target / SRC_DURATION));
}

const desktopFps = fpsFor(TARGET_DESKTOP);
const mobileFps = fpsFor(TARGET_MOBILE);

console.log(
  `Source: ${path.basename(source)} ${SRC_W}x${SRC_H}` +
    `${SRC_DURATION ? ` ${SRC_DURATION.toFixed(1)}s` : ""}` +
    `${probed ? "" : " (assumed)"}`,
);
console.log(
  `Target: ~${TARGET_DESKTOP} desktop / ~${TARGET_MOBILE} mobile frames`,
);

// Both crops are centred on the source. Cropping the width is what drops the
// watermark in the bottom-right corner.
const squareSide = SRC_H;
const squareX = Math.max(0, Math.round((SRC_W - squareSide) / 2));
const portraitW = Math.round((SRC_H * 3) / 4);
const portraitX = Math.max(0, Math.round((SRC_W - portraitW) / 2));

const SETS = [
  {
    key: "desktop",
    dir: "/sequence",
    outDir: path.join(ROOT, "public", "sequence"),
    fps: desktopFps,
    filter: `fps=${desktopFps.toFixed(4)},crop=${squareSide}:${squareSide}:${squareX}:0,scale=900:900`,
    quality: 82,
    width: 900,
    height: 900,
  },
  {
    key: "mobile",
    dir: "/sequence-mobile",
    outDir: path.join(ROOT, "public", "sequence-mobile"),
    fps: mobileFps,
    filter: `fps=${mobileFps.toFixed(4)},crop=${portraitW}:${SRC_H}:${portraitX}:0,scale=540:720`,
    quality: 78,
    width: 540,
    height: 720,
  },
];

const manifest = {
  source: path.basename(source),
  generatedAt: new Date().toISOString(),
};

for (const set of SETS) {
  rmSync(set.outDir, { recursive: true, force: true });
  mkdirSync(set.outDir, { recursive: true });

  const args = [
    "-y",
    "-i", source,
    "-vf", set.filter,
    "-c:v", "libwebp",
    "-quality", String(set.quality),
    "-compression_level", "6",
    path.join(set.outDir, "frame-%03d.webp"),
  ];

  console.log(`\n[${set.key}] ${set.filter}`);
  const run = spawnSync(ffmpeg, args, { stdio: ["ignore", "ignore", "pipe"] });
  if (run.status !== 0) {
    console.error(run.stderr?.toString().split("\n").slice(-20).join("\n"));
    process.exit(1);
  }

  const files = readdirSync(set.outDir).filter((f) => f.endsWith(".webp"));
  const bytes = files.reduce(
    (sum, f) => sum + statSync(path.join(set.outDir, f)).size,
    0,
  );
  console.log(
    `[${set.key}] ${files.length} frames, ${(bytes / 1024 / 1024).toFixed(2)} MB`,
  );

  manifest[set.key] = {
    dir: set.dir,
    count: files.length,
    width: set.width,
    height: set.height,
    ext: "webp",
  };
}

// A JPEG still for the Open Graph card. Committed, because the OG route
// reads it off disk and sharp is only a dev dependency.
const OG_SOURCE = path.join(ROOT, "public", "sequence", "frame-001.webp");
if (existsSync(OG_SOURCE)) {
  const ogPath = path.join(ROOT, "public", "og-frame.jpg");
  await sharp(OG_SOURCE)
    .resize(760, 760, { fit: "cover" })
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(ogPath);
  const kb = (statSync(ogPath).size / 1024).toFixed(0);
  console.log('OG still  -> ' + path.relative(ROOT, ogPath) + '  ' + kb + ' KB');
}

const out = await writeManifest(ROOT, manifest);
console.log(`\nManifest -> ${path.relative(ROOT, out)}`);
