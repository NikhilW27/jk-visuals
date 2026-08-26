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

const readout = async () =>
  Number((await page.evaluate(() => document.body.innerText.match(/(\d{3})\s*°/)?.[1])) ?? -1);

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

// Deep scroll must hold, not wrap back toward 0.
await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.9));
await page.waitForTimeout(700);
const held = await readout();
console.log(held === 130 ? `PASS  holds at 130 deep in the hero` : `FAIL  reads ${held} deep in the hero`);

await browser.close();
