/** Verifies the hero rotation is capped and never wraps past the sweep. */
import { chromium } from "playwright";

const URL = process.env.SHOT_URL ?? "http://localhost:3000";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(URL, { waitUntil: "domcontentloaded" });
await page.waitForSelector('[data-hero-ready="true"]', { timeout: 30000 });
await page.waitForTimeout(1200);

const seq = await page.evaluate(() =>
  performance.getEntriesByType("resource").filter((e) => /\/sequence/.test(e.name)),
);
console.log(
  `frames fetched: ${seq.length}  (${Math.round(
    seq.reduce((s, e) => s + (e.transferSize || e.encodedBodySize || 0), 0) / 1024,
  )} KB)`,
);

// The visible counter is gone; the canvas exposes its angle as a data
// attribute instead.
const readout = async () =>
  Number(
    (await page.evaluate(
      () => document.querySelector("canvas[data-degrees]")?.dataset.degrees,
    )) ?? -1,
  );

const marks = [0, 0.25, 0.5, 0.75, 1, 1.5, 2, 3];
const seen = [];
for (const m of marks) {
  await page.evaluate((f) => window.scrollTo(0, window.innerHeight * f), m);
  await page.waitForTimeout(650);
  seen.push(`${m}vh:${await readout()}deg`);
}
console.log(seen.join("  "));

const max = Math.max(...seen.map((s) => Number(s.split(":")[1].replace("deg", ""))));
console.log(max <= 130 ? `PASS  never exceeds 130 (peak ${max})` : `FAIL  peak ${max}`);

// Deep scroll must hold, not wrap back toward 0, and not drift on its own.
await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.9));
await page.waitForTimeout(900);
const held = await readout();
console.log(
  held === 130 ? `PASS  holds at 130 deep in the hero` : `FAIL  reads ${held}`,
);

// The subject turns only on scroll: with the page still, he must not move.
const idle = [];
for (let i = 0; i < 12; i += 1) {
  idle.push(await readout());
  await page.waitForTimeout(200);
}
console.log(
  new Set(idle).size === 1
    ? `PASS  still while the page is still (${idle[0]} deg)`
    : `FAIL  drifts on its own (${Math.min(...idle)}-${Math.max(...idle)})`,
);

await browser.close();
