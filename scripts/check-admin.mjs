/**
 * End-to-end check of the admin flow: gate, wrong password, sign in, edit,
 * save, public page reflects it, sign out.
 */
import { chromium } from "playwright";

const URL = process.env.SHOT_URL ?? "http://localhost:3000";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "letmein-local-dev";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

const ok = (label, pass, extra = "") =>
  console.log(`${pass ? "PASS" : "FAIL"}  ${label}${extra ? `  ${extra}` : ""}`);

// 1. Gate
await page.goto(`${URL}/admin`, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(600);
ok("unauthenticated /admin shows login", await page.locator('input[name="password"]').count() === 1);
ok("no admin panel leaked", await page.getByText("Video URL").count() === 0);

// 2. Wrong password
await page.fill('input[name="password"]', "definitely-wrong");
await page.getByRole("button", { name: /sign in/i }).click();
await page.waitForTimeout(1600);
ok("wrong password rejected", await page.getByText(/incorrect password/i).count() === 1);

// 3. Correct password
await page.fill('input[name="password"]', PASSWORD);
await page.getByRole("button", { name: /sign in/i }).click();
await page.waitForSelector("text=Video URL", { timeout: 15000 });
ok("correct password signs in", true);
ok("store mode shown", (await page.getByText(/storing to/i).count()) === 1,
   (await page.getByText(/storing to/i).first().textContent())?.trim());

// 4. Reorder + edit
const firstTitleBefore = await page.locator('input[id^="title-"]').first().inputValue();
await page.getByRole("button", { name: /move .* down/i }).first().click();
await page.waitForTimeout(300);
const firstTitleAfter = await page.locator('input[id^="title-"]').first().inputValue();
ok("reorder moves the first item", firstTitleBefore !== firstTitleAfter,
   `${firstTitleBefore} -> ${firstTitleAfter}`);

const marker = `Renamed ${Date.now()}`;
await page.locator('input[id^="title-"]').first().fill(marker);
await page.fill("#about-years", "8");

// 5. Save
await page.getByRole("button", { name: /save changes/i }).click();
await page.waitForTimeout(3000);
const saved = await page.getByText(/work items live/i).count() === 1;
ok("save reports success", saved);

// 6. Public page reflects it
const site = await context.newPage();
await site.goto(URL, { waitUntil: "domcontentloaded" });
await site.waitForSelector('[data-hero-ready="true"]', { timeout: 30000 });
await site.waitForTimeout(800);
const body = await site.evaluate(() => document.body.innerText);
ok("public page shows the renamed item", body.includes(marker));
ok("public page shows the new years value", /\b8\s*yrs/i.test(body.replace(/\s+/g, " ")));
await site.close();

// 7. Sign out
await page.getByRole("button", { name: /sign out/i }).click();
await page.waitForTimeout(1800);
ok("sign out returns to login", await page.locator('input[name="password"]').count() === 1);

console.log(errors.length ? `\nconsole errors: ${errors.slice(0, 4).join(" | ")}` : "\nno console errors");
await browser.close();
