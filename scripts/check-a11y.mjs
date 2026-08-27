/**
 * Reduced-motion behaviour: Lenis must not run, and the hero portrait must
 * still be served.
 */
import { chromium } from "playwright";

const URL = process.env.SHOT_URL ?? "http://localhost:3000";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const ok = (l, p, e = "") =>
  console.log(`${p ? "PASS" : "FAIL"}  ${l}${e ? `  ${e}` : ""}`);

for (const reducedMotion of ["reduce", "no-preference"]) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion,
  });
  await page.goto(URL, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[data-hero-ready="true"]', { timeout: 30000 });
  await page.waitForTimeout(1500);

  const state = await page.evaluate(() => ({
    lenis: document.documentElement.classList.contains("lenis"),
    portrait: Boolean(document.querySelector("#top img")),
  }));

  const label = `prefers-reduced-motion: ${reducedMotion}`.padEnd(38);
  if (reducedMotion === "reduce") {
    ok(`${label}Lenis disabled`, state.lenis === false);
  } else {
    ok(`${label}Lenis running`, state.lenis === true);
  }
  ok(`${" ".repeat(38)}portrait served`, state.portrait);

  await page.close();
}

await browser.close();
