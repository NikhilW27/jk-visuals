/**
 * Screenshots the hero across breakpoints and scroll positions.
 * Uses the installed Edge/Chrome rather than downloading a browser.
 *
 *   npm run shots                 # all breakpoints, scroll 0
 *   npm run shots -- --scroll     # also captures mid-rotation and hand-off
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const OUT = process.env.SHOT_DIR ?? path.resolve("shots");
const URL = process.env.SHOT_URL ?? "http://localhost:3000";
const WITH_SCROLL = process.argv.includes("--scroll");

const VIEWPORTS = [
  { name: "360-mobile", width: 360, height: 780 },
  { name: "414-mobile-lg", width: 414, height: 896 },
  { name: "768-tablet", width: 768, height: 1024 },
  { name: "1280-laptop", width: 1280, height: 800 },
  { name: "1440-desktop", width: 1440, height: 900 },
  { name: "2560-ultrawide", width: 2560, height: 1200 },
];

mkdirSync(OUT, { recursive: true });

let browser;
for (const channel of ["msedge", "chrome", undefined]) {
  try {
    browser = await chromium.launch({ channel, headless: true });
    console.log(`Browser: ${channel ?? "bundled chromium"}`);
    break;
  } catch {
    /* try the next one */
  }
}
if (!browser) {
  console.error(
    "No browser available. Install one with: npx playwright install chromium",
  );
  process.exit(1);
}

for (const vp of VIEWPORTS) {
  const page = await browser.newPage({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
  });

  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto(URL, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-hero-ready="true"]', { timeout: 30000 });
  // Let the staggered entrance settle.
  await page.waitForTimeout(1400);

  const shot = async (suffix) => {
    const file = path.join(OUT, `${vp.name}${suffix}.png`);
    await page.screenshot({ path: file });
    return path.basename(file);
  };

  const made = [await shot("")];

  if (WITH_SCROLL) {
    // Mid-rotation: roughly a quarter turn in.
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 0.45));
    await page.waitForTimeout(700);
    made.push(await shot("-turned"));

    // Hand-off: the subject should be fading and scaling, not cutting.
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.15));
    await page.waitForTimeout(700);
    made.push(await shot("-handoff"));
  }

  const which = await page.evaluate(() => {
    const seq = performance
      .getEntriesByType("resource")
      .filter((e) => /\/sequence/.test(e.name));
    return {
      set: seq.some((e) => e.name.includes("sequence-mobile"))
        ? "mobile"
        : "desktop",
      frames: seq.length,
      bytes: Math.round(
        seq.reduce((s, e) => s + (e.transferSize || e.encodedBodySize || 0), 0) /
          1024,
      ),
    };
  });

  console.log(
    `${vp.name.padEnd(16)} ${which.set.padEnd(8)} ${String(which.frames).padStart(3)} frames  ${String(which.bytes).padStart(5)} KB  -> ${made.join(", ")}` +
      (errors.length ? `\n  ERRORS: ${errors.slice(0, 3).join(" | ")}` : ""),
  );

  await page.close();
}

await browser.close();
console.log(`\nShots in ${OUT}`);
