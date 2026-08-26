import { mkdirSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const OUT = process.env.SHOT_DIR ?? path.resolve("shots/sections");
const URL = process.env.SHOT_URL ?? "http://localhost:3000";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ channel: "msedge", headless: true });
const sizes = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

for (const size of sizes) {
  const page = await browser.newPage({
    viewport: { width: size.width, height: size.height },
  });
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto(URL, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-hero-ready="true"]', { timeout: 30000 });
  await page.waitForTimeout(1200);

  for (const id of ["work", "services", "about", "instagram", "contact"]) {
    const el = await page.$(`#${id}`);
    if (!el) {
      console.log(`${size.name}: #${id} MISSING`);
      continue;
    }
    // Align the section to the top of the viewport, not just "into view",
    // so the capture shows it the way a visitor arrives at it.
    await page.evaluate((sel) => {
      const node = document.querySelector(sel);
      if (node) window.scrollTo(0, window.scrollY + node.getBoundingClientRect().top);
    }, `#${id}`);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, `${size.name}-${id}.png`) });
  }

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, `${size.name}-footer.png`) });

  console.log(
    `${size.name}: captured${errors.length ? `  ERRORS: ${errors.slice(0, 3).join(" | ")}` : "  no console errors"}`,
  );
  await page.close();
}
await browser.close();
console.log(`shots in ${OUT}`);
