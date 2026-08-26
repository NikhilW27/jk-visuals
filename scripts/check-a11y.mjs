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
    return { frames: seq.length, deg: document.body.innerText.match(/(\d{3})°/)?.[1], cue: document.body.innerText.match(/SCROLL TO ROTATE|REDUCED MOTION/i)?.[0] };
  });

  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 0.6));
  await page.waitForTimeout(600);
  const after = await page.evaluate(() => ({
    deg: document.body.innerText.match(/(\d{3})°/)?.[1],
    lenis: document.documentElement.classList.contains("lenis"),
  }));

  console.log(
    `prefers-reduced-motion: ${rm.padEnd(14)} framesFetched=${String(before.frames).padStart(2)}  deg ${before.deg}->${after.deg}  lenis=${after.lenis}  cue="${before.cue}"`,
  );
  await page.close();
}
await b.close();
