/**
 * Pulls a poster frame out of each Instagram reel listed in
 * scripts/reels.json, because Instagram does not expose thumbnails without an
 * API token.
 *
 *   npm run thumbs             # skips reels already fetched
 *   npm run thumbs -- --force  # re-fetch everything
 *   npm run thumbs -- --clean  # delete the downloaded clips afterwards
 *
 * Downloads each reel to a scratch dir, probes it locally (Instagram withholds
 * duration and dimensions from yt-dlp without auth), extracts a frame past the
 * intro, and writes public/work/<shortcode>.webp. Also writes
 * scripts/reels.meta.json, used to seed the content store.
 *
 * Requires yt-dlp:  pip install yt-dlp
 */
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public", "work");
const SCRATCH = path.join(os.tmpdir(), "jk-reels");
const FORCE = process.argv.includes("--force");

/** Frame taken this far into the clip, to clear intro fades and black frames. */
const SEEK_FRACTION = 0.16;
const THUMB_W = 540;
const THUMB_H = 960;

function findBinary(name) {
  const probe = (cmd) => {
    try {
      return spawnSync(cmd, ["-version"], { stdio: "ignore" }).status === 0;
    } catch {
      return false;
    }
  };
  if (process.env.FFMPEG_PATH && name === "ffmpeg" && probe(process.env.FFMPEG_PATH)) {
    return process.env.FFMPEG_PATH;
  }
  if (probe(name)) return name;
  const local = process.env.LOCALAPPDATA;
  if (local) {
    const pkgs = path.join(local, "Microsoft", "WinGet", "Packages");
    if (existsSync(pkgs)) {
      for (const dir of readdirSync(pkgs)) {
        if (!/ffmpeg/i.test(dir)) continue;
        for (const inner of readdirSync(path.join(pkgs, dir))) {
          const candidate = path.join(pkgs, dir, inner, "bin", `${name}.exe`);
          if (existsSync(candidate) && probe(candidate)) return candidate;
        }
      }
    }
  }
  return null;
}

const ffmpeg = findBinary("ffmpeg");
const ffprobe = findBinary("ffprobe");
if (!ffmpeg || !ffprobe) {
  console.error("ffmpeg/ffprobe not found. See the README.");
  process.exit(1);
}

const reels = JSON.parse(
  readFileSync(path.join(ROOT, "scripts", "reels.json"), "utf8"),
);

mkdirSync(OUT, { recursive: true });
mkdirSync(SCRATCH, { recursive: true });

const meta = [];
const failed = [];

for (const [i, url] of reels.entries()) {
  const tag = `[${i + 1}/${reels.length}]`;
  const shortcode = url.match(/\/reel\/([^/?]+)/)?.[1];
  if (!shortcode) {
    console.log(`${tag} skipped, no shortcode: ${url}`);
    failed.push(url);
    continue;
  }

  const thumb = path.join(OUT, `${shortcode}.webp`);
  const video = path.join(SCRATCH, `${shortcode}.mp4`);

  if (existsSync(thumb) && !FORCE) {
    console.log(`${tag} ${shortcode} already fetched`);
    continue;
  }

  if (!existsSync(video)) {
    const dl = spawnSync(
      "python",
      [
        "-m", "yt_dlp",
        "--no-warnings", "--no-progress",
        "-f", "mp4",
        "-o", video,
        url,
      ],
      { encoding: "utf8" },
    );
    if (!existsSync(video)) {
      console.log(`${tag} ${shortcode} FAILED to download`);
      console.log(`    ${(dl.stderr ?? "").trim().slice(-220)}`);
      failed.push(url);
      continue;
    }
  }

  // Probe the downloaded file rather than the Instagram metadata, which comes
  // back as NA without an authenticated session.
  const probe = spawnSync(
    ffprobe,
    [
      "-v", "error",
      "-select_streams", "v:0",
      "-show_entries", "stream=width,height:format=duration",
      "-of", "json",
      video,
    ],
    { encoding: "utf8" },
  );

  let width = 0;
  let height = 0;
  let duration = 0;
  try {
    const json = JSON.parse(probe.stdout ?? "{}");
    width = Number(json.streams?.[0]?.width) || 0;
    height = Number(json.streams?.[0]?.height) || 0;
    duration = Number(json.format?.duration) || 0;
  } catch {
    /* handled below */
  }

  if (!duration) {
    console.log(`${tag} ${shortcode} FAILED to probe local file`);
    failed.push(url);
    continue;
  }

  const seek = Math.max(0.4, duration * SEEK_FRACTION);
  const run = spawnSync(
    ffmpeg,
    [
      "-y",
      "-ss", seek.toFixed(2),
      "-i", video,
      "-frames:v", "1",
      "-vf",
      `scale=${THUMB_W}:${THUMB_H}:force_original_aspect_ratio=increase,crop=${THUMB_W}:${THUMB_H}`,
      "-c:v", "libwebp",
      "-quality", "80",
      thumb,
    ],
    { stdio: ["ignore", "ignore", "pipe"] },
  );

  if (run.status !== 0 || !existsSync(thumb)) {
    console.log(`${tag} ${shortcode} FAILED to extract frame`);
    failed.push(url);
    continue;
  }

  const kb = Math.round(statSync(thumb).size / 1024);
  meta.push({
    shortcode,
    url,
    duration: Number(duration.toFixed(2)),
    width,
    height,
    thumbnail: `/work/${shortcode}.webp`,
    frameAt: Number(seek.toFixed(2)),
  });
  console.log(
    `${tag} ${shortcode}  ${duration.toFixed(1)}s  ${width}x${height}  frame@${seek.toFixed(1)}s  ${kb}KB`,
  );
}

writeFileSync(
  path.join(ROOT, "scripts", "reels.meta.json"),
  `${JSON.stringify(meta, null, 2)}\n`,
  "utf8",
);

console.log(`\n${meta.length}/${reels.length} thumbnails -> public/work`);
if (failed.length) console.log(`failed: ${failed.join(", ")}`);
if (process.argv.includes("--clean")) {
  rmSync(SCRATCH, { recursive: true, force: true });
  console.log("scratch clips deleted");
}
