import { chromium } from "playwright";
const b = await chromium.launch({ channel: "msedge", headless: true });
const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
await page.waitForSelector('[data-hero-ready="true"]');
await page.waitForTimeout(1200);

const ids = await page.evaluate(() => [...document.querySelectorAll("[id]")].map((e) => e.id));
console.log("anchor targets on page:", ids.filter((i) => i !== "_R_"));

for (const label of ["View Work", "Get in Touch"]) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  // Sample scroll position over time: a smooth scroll shows intermediate
  // values, a hard jump goes straight to the destination.
  const samples = [];
  const stop = setInterval(async () => {}, 0);
  clearInterval(stop);

  await page.getByRole("link", { name: label }).click();
  for (let i = 0; i < 14; i += 1) {
    samples.push(await page.evaluate(() => Math.round(window.scrollY)));
    await page.waitForTimeout(100);
  }
  const unique = [...new Set(samples)];
  const moved = samples[samples.length - 1] !== 0;
  console.log(
    `"${label}" -> ${moved ? "MOVED" : "NOTHING"}  final=${samples[samples.length - 1]}  steps=${unique.length}  ${unique.length > 3 ? "(eased)" : "(hard jump)"}`,
  );
  console.log(`   ${samples.join(" ")}`);
}
await b.close();
