/** Coverflow behaviour: paging, bringing a card forward, drag, keyboard. */
import { chromium } from "playwright";

const URL = process.env.SHOT_URL ?? "http://localhost:3000";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
const ok = (l, p, e = "") => console.log(`${p ? "PASS" : "FAIL"}  ${l}${e ? `  ${e}` : ""}`);

await page.goto(URL, { waitUntil: "domcontentloaded" });
await page.waitForSelector('[data-hero-ready="true"]', { timeout: 30000 });
await page.evaluate(() => {
  const el = document.querySelector(".coverflow-stage");
  window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top - 200);
});
await page.waitForTimeout(2500);

const frontIndex = () =>
  page.evaluate(() => {
    const cards = [...document.querySelectorAll("#work [data-reel]")];
    return cards.findIndex((c) => c.dataset.focused === "true");
  });
const counter = () =>
  page.evaluate(() =>
    document.querySelector(".coverflow-stage").parentElement.querySelector(".tabular-nums").textContent.trim(),
  );

ok("exactly one card is front", (await page.evaluate(() =>
  [...document.querySelectorAll("#work [data-reel]")].filter((c) => c.dataset.focused === "true").length)) === 1);
ok("opens centred, not at an edge", (await frontIndex()) === 4, `index ${await frontIndex()}`);
ok("counter matches", (await counter()).startsWith("05"), await counter());

// Cards either side must actually be turned, and the front one square on.
const angles = await page.evaluate(() => {
  const cards = [...document.querySelectorAll("#work [data-reel]")];
  const read = (i) => (cards[i].style.transform.match(/rotateY\(([-\d.]+)deg\)/) ?? [])[1];
  return { left: read(3), front: read(4), right: read(5) };
});
ok("front card is square to camera", Number(angles.front) === 0, `${angles.front}deg`);
ok("neighbours are turned", Number(angles.left) > 0 && Number(angles.right) < 0,
   `L ${angles.left} / R ${angles.right}`);

// Paging.
await page.getByRole("button", { name: /next/i }).click();
await page.waitForTimeout(900);
ok("next advances", (await frontIndex()) === 5, `index ${await frontIndex()}`);
await page.getByRole("button", { name: /prev/i }).click();
await page.waitForTimeout(900);
ok("prev goes back", (await frontIndex()) === 4);

// Clicking an off-centre card brings it forward rather than opening.
const side = await page.evaluate(() => {
  const cards = [...document.querySelectorAll("#work [data-reel]")];
  const r = cards[5].getBoundingClientRect();
  return { x: r.left + r.width * 0.5, y: r.top + r.height * 0.5 };
});
await page.mouse.click(side.x, side.y);
await page.waitForTimeout(1000);
ok("side card comes forward, no lightbox",
   (await frontIndex()) === 5 && (await page.locator('[role="dialog"]').count()) === 0);

// Drag.
const before = await frontIndex();
const stage = await page.evaluate(() => {
  const r = document.querySelector(".coverflow-stage").getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
});
await page.mouse.move(stage.x, stage.y);
await page.mouse.down();
await page.mouse.move(stage.x - 320, stage.y, { steps: 12 });
await page.mouse.up();
await page.waitForTimeout(1100);
ok("drag moves through the set", (await frontIndex()) > before, `${before} -> ${await frontIndex()}`);

// Keyboard.
await page.evaluate(() => {
  document.querySelector('#work [data-reel][data-focused="true"]').focus();
});
const kbBefore = await frontIndex();
await page.keyboard.press("ArrowRight");
await page.waitForTimeout(900);
ok("arrow key moves the fan", (await frontIndex()) === kbBefore + 1);

console.log(errors.length ? `\nerrors: ${errors.slice(0, 3).join(" | ")}` : "\nno page errors");
await browser.close();
