/** Nav behaviour and hero pointer parallax. */
import { chromium } from "playwright";

const URL = process.env.SHOT_URL ?? "http://localhost:3000";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const ok = (l, p, e = "") => console.log(`${p ? "PASS" : "FAIL"}  ${l}${e ? `  ${e}` : ""}`);

const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(URL, { waitUntil: "domcontentloaded" });
await page.waitForSelector('[data-hero-ready="true"]', { timeout: 30000 });
await page.waitForTimeout(1500);

const navTop = () => page.evaluate(() => Math.round(document.querySelector("header").getBoundingClientRect().top));
const plateT = () => page.evaluate(() => document.querySelector(".hero-plate").style.transform);

ok("nav visible at rest", (await navTop()) === 0);

// Parallax: move the pointer to opposite corners and compare the plate.
await page.mouse.move(200, 200);
await page.waitForTimeout(900);
const a = await plateT();
await page.mouse.move(1240, 760);
await page.waitForTimeout(900);
const b = await plateT();
ok("plate reacts to the pointer", Boolean(a) && Boolean(b) && a !== b);
ok("plate tilts in 3D", /rotate[XY]/.test(b), b.slice(0, 96));

// Nav hides going down, returns going up.
await page.evaluate(() => window.scrollTo(0, 900));
await page.waitForTimeout(900);
const down = await navTop();
await page.evaluate(() => window.scrollTo(0, 400));
await page.waitForTimeout(900);
const up = await navTop();
ok("nav retreats on scroll down", down < 0, `top ${down}px`);
ok("nav returns on scroll up", up === 0, `top ${up}px`);

// Anchors still resolve through Lenis.
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(700);
await page.getByRole("link", { name: "Services", exact: true }).click();
await page.waitForTimeout(2200);
const atServices = await page.evaluate(() => {
  const r = document.querySelector("#services").getBoundingClientRect();
  return Math.abs(r.top) < 220;
});
ok("nav link eases to its section", atServices);

// Reduced motion must not parallax.
const rm = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
await rm.goto(URL, { waitUntil: "domcontentloaded" });
await rm.waitForSelector('[data-hero-ready="true"]', { timeout: 30000 });
await rm.waitForTimeout(1200);
await rm.mouse.move(200, 200);
await rm.waitForTimeout(500);
const rmA = await rm.evaluate(() => document.querySelector(".hero-plate").style.transform);
await rm.mouse.move(1240, 760);
await rm.waitForTimeout(700);
const rmB = await rm.evaluate(() => document.querySelector(".hero-plate").style.transform);
ok("reduced motion: no parallax", rmA === rmB, `"${rmA}"`);

await browser.close();
