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

// Open the first work item.
await page.locator("#work li button").first().click();
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
const shown = await page.locator("#work li").count();
ok("filter narrows the grid", shown > 0 && shown < 9, `${shown} of 9 shown`);
await page.getByRole("button", { name: "All", exact: true }).click();
await page.waitForTimeout(700);

// Contact form validation, then a valid submit with no Resend key configured.
await page.locator("#contact").scrollIntoViewIfNeeded();
await page.waitForTimeout(700);
await page.fill('textarea[name="message"]', "Testing the form.");
await page.fill('input[name="name"]', "Test Person");
await page.fill('input[name="email"]', "not-an-email");
// Bypass native validation so the server-side checks are what is tested.
// React re-renders the form after each submit, so this is re-applied.
const relaxValidation = () =>
  page.evaluate(() => {
    document.querySelectorAll("#contact form").forEach((f) => f.setAttribute("novalidate", ""));
    document.querySelectorAll("#contact input, #contact textarea").forEach((el) => {
      el.removeAttribute("required");
      if (el.getAttribute("type") === "email") el.setAttribute("type", "text");
    });
  });

await relaxValidation();
await page.getByRole("button", { name: /send enquiry/i }).click();
await page.waitForTimeout(4000);
ok("invalid email is rejected server-side",
   (await page.getByText(/email does not look right/i).count()) === 1);

await relaxValidation();
await page.fill('input[name="email"]', "someone@example.com");
await page.getByRole("button", { name: /send enquiry/i }).click();
await page.waitForTimeout(4000);
ok("unconfigured Resend degrades to a clear message",
   (await page.getByText(/not connected yet/i).count()) === 1);

console.log(errors.length ? `\nconsole errors: ${errors.slice(0, 4).join(" | ")}` : "\nno console errors");
await browser.close();
