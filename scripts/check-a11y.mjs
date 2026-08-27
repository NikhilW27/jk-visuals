import { chromium } from "playwright";
const b = await chromium.launch({ channel: "msedge", headless: true });

for (const rm of ["reduce", "no-preference"]) {
  const page = await b.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: rm,
  });
  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-hero-ready="true"]', { timeout: 30000 });
  await page.waitForTimeout(1200);

  const before = await page.evaluate(() => {
    const seq = performance.getEntriesByType("resource").filter(e => /\/sequence/.test(e.name));
    return { frames: seq.length, deg: document.querySelector("canvas[data-degrees]")?.dataset.degrees };
  });

  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 0.6));
  await page.waitForTimeout(600);
  const after = await page.evaluate(() => ({
    deg: document.querySelector("canvas[data-degrees]")?.dataset.degrees,
    lenis: document.documentElement.classList.contains("lenis"),
  }));

  console.log(
    `prefers-reduced-motion: ${rm.padEnd(14)} framesFetched=${String(before.frames).padStart(2)}  deg ${before.deg}->${after.deg}  lenis=${after.lenis}`,
  );
  await page.close();
}
await b.close();
