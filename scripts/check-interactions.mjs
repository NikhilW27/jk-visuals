/**
 * Lightbox and contact form behaviour, including keyboard access.
 */
import { chromium } from "playwright";

const URL = process.env.SHOT_URL ?? "http://localhost:3000";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

const ok = (label, pass, extra = "") =>
  console.log(`${pass ? "PASS" : "FAIL"}  ${label}${extra ? `  ${extra}` : ""}`);

await page.goto(URL, { waitUntil: "domcontentloaded" });
await page.waitForSelector('[data-hero-ready="true"]', { timeout: 30000 });
await page.waitForTimeout(900);

// No iframe should exist before the lightbox is opened.
ok("no iframe loaded up front", (await page.locator("iframe").count()) === 0);

await page.locator("#work").scrollIntoViewIfNeeded();
await page.waitForTimeout(900);

// Open a work item. Only the front card opens the lightbox; the others
// bring themselves forward first.
const firstCard = await page.evaluate(() => {
  const card = document.querySelector('#work [data-reel][data-focused="true"]');
  if (!card) return null;
  const r = card.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
});
ok("a front card is on screen", Boolean(firstCard));
await page.mouse.click(firstCard.x, firstCard.y);
await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
await page.waitForTimeout(700);
ok("lightbox opens", (await page.locator('[role="dialog"]').count()) === 1);
ok("iframe loads only now", (await page.locator("iframe").count()) === 1);
ok(
  "iframe points at the reel embed",
  /instagram\.com\/reel\/.+\/embed/.test((await page.locator("iframe").getAttribute("src")) ?? ""),
);
ok("focus moved into the dialog", await page.evaluate(() =>
  Boolean(document.querySelector('[role="dialog"]')?.contains(document.activeElement))));
ok("page scroll is locked", await page.evaluate(() =>
  document.documentElement.classList.contains("scroll-locked")));

const titleBefore = await page.locator('[role="dialog"] h2').textContent();
await page.keyboard.press("ArrowRight");
await page.waitForTimeout(700);
const titleAfter = await page.locator('[role="dialog"] h2').textContent();
ok("arrow key pages to the next film", titleBefore !== titleAfter, `${titleBefore} -> ${titleAfter}`);

await page.keyboard.press("Escape");
await page.waitForTimeout(700);
ok("escape closes", (await page.locator('[role="dialog"]').count()) === 0);
ok("iframe torn down", (await page.locator("iframe").count()) === 0);
ok("scroll unlocked", await page.evaluate(() =>
  !document.documentElement.classList.contains("scroll-locked")));

// Category filter.
await page.getByRole("button", { name: "Wedding", exact: true }).click();
await page.waitForTimeout(900);
const shown = await page.locator("#work [data-reel]").count();
ok("filter narrows the wall", shown > 0 && shown < 27, shown + " cards of 27");
await page.getByRole("button", { name: "All", exact: true }).click();
await page.waitForTimeout(700);

// Contact form: validates, then hands the enquiry to WhatsApp pre-filled.
// window.open is stubbed so the assertion can read the URL that was built.
await page.addInitScript(() => {
  window.__waUrl = null;
  window.open = (url) => {
    window.__waUrl = String(url);
    return null;
  };
});
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForSelector('[data-hero-ready="true"]', { timeout: 30000 });
await page.locator("#contact").scrollIntoViewIfNeeded();
await page.waitForTimeout(800);

// Short number must be rejected before anything opens.
await page.fill('input[name="name"]', "Test Person");
await page.fill('input[name="phone"]', "12345");
await page.fill('textarea[name="message"]', "Two hours, outdoor mandap.");
await page.getByRole("button", { name: /send on whatsapp/i }).click();
await page.waitForTimeout(600);
ok("short mobile number is rejected",
   (await page.getByText(/full mobile number/i).count()) === 1);
ok("nothing opened for an invalid number",
   (await page.evaluate(() => window.__waUrl)) === null);

// Valid submission hands off to WhatsApp with every field carried across.
await page.fill('input[name="phone"]', "9876543210");
await page.selectOption('select[name="eventType"]', "Wedding");
await page.fill('input[name="date"]', "2026-08-28");
await page.getByRole("button", { name: /send on whatsapp/i }).click();
await page.waitForTimeout(700);

const waUrl = await page.evaluate(() => window.__waUrl);
ok("opens a wa.me link", Boolean(waUrl && waUrl.startsWith("https://wa.me/")));
const decoded = waUrl ? decodeURIComponent(waUrl.split("?text=")[1] ?? "") : "";
for (const [field, expected] of [
  ["name", "Test Person"],
  ["mobile", "9876543210"],
  ["event", "Wedding"],
  ["date", "28/08/2026"],
  ["details", "Two hours, outdoor mandap."],
]) {
  ok("message carries the " + field, decoded.includes(expected), expected);
}
ok("confirmation shown",
   (await page.getByText(/press send there to finish/i).count()) === 1);
ok("values kept after hand-off",
   (await page.locator('input[name="name"]').inputValue()) === "Test Person");

console.log(errors.length ? `\nconsole errors: ${errors.slice(0, 4).join(" | ")}` : "\nno console errors");
await browser.close();
