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

// Deep in the hero the face keeps swaying, but must stay in the top band and
// never wrap back toward 0.
await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.9));
await page.waitForTimeout(900);
const deep = [];
for (let i = 0; i < 20; i += 1) {
  deep.push(await readout());
  await page.waitForTimeout(200);
}
const peak = Math.max(...deep);
const trough = Math.min(...deep);
console.log(
  peak >= 125 && trough > 70
    ? `PASS  sways in the top band deep in the hero (${trough}-${peak})`
    : `FAIL  reads ${trough}-${peak} deep in the hero`,
);

// The sway must never park the face on one frame.
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(700);
const idle = [];
for (let i = 0; i < 16; i += 1) {
  idle.push(await readout());
  await page.waitForTimeout(200);
}
console.log(
  new Set(idle).size > 3
    ? `PASS  face animates while the page is still (${Math.min(...idle)}-${Math.max(...idle)})`
    : `FAIL  face is static at rest`,
);

await browser.close();
