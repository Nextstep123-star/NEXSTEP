// ============================================================
// NEXTSTEP — screenshot capture of all views
// Drives the running SPA (http://127.0.0.1:5173) via global go()
// Run: node shoot.mjs
// ============================================================
import { chromium } from "playwright-core";
import fs from "fs";

const URL = "http://127.0.0.1:5173/";
const OUT = "screenshots";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

// A saved path so roadmap-list has something to show (a real program id from DB)
const SEED_PATHS = JSON.stringify([{
  id: "p_demo01",
  name: "วิศวะคอม ในฝัน",
  programId: "31920102220201A-0",
  programName: "วท.บ.",
  uni: "มหาวิทยาลัยเทคโนโลยีราชมงคลกรุงเทพ",
  track: "sci_math",
  createdAt: Date.now(),
}]);

// [view, label, viewport, prep] — prep runs in page before capture
const SHOTS = [
  ["auth",         "01-auth-welcome",   { w: 440, h: 900 }, null],
  ["onboarding",   "02-onboarding-1",   { w: 440, h: 900 }, `startOnboarding();`],
  ["create-path",  "03-dashboard",      { w: 1440, h: 950 }, null],
  ["news-page",    "04-news",           { w: 1440, h: 950 }, null],
  ["calendar",     "05-calendar",       { w: 1440, h: 950 }, null],
  ["career",       "06-career-path",    { w: 1440, h: 950 }, null],
  ["universities", "07-universities",   { w: 1440, h: 950 }, null],
  ["roadmap-list", "08-roadmap",        { w: 1440, h: 950 }, null],
  ["name-path",    "09-name-path",      { w: 440, h: 900 }, null],
  ["track",        "10-track",          { w: 440, h: 900 }, null],
  ["profile",      "11-profile",        { w: 1440, h: 950 }, null],
  ["settings",     "12-settings",       { w: 1440, h: 950 }, null],
  ["create-path",  "13-dashboard-mobile", { w: 420, h: 900 }, null],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });

  for (const [view, label, vp, prep] of SHOTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    try {
      // seed localStorage before app boots
      await page.addInitScript((paths) => {
        try {
          localStorage.setItem("nextstep_paths", paths);
          localStorage.setItem("nextstep_main", "p_demo01");
          localStorage.setItem("nextstep_theme", "dark");
        } catch (e) {}
      }, SEED_PATHS);

      await page.goto(URL, { waitUntil: "networkidle" });
      // wait out the splash (≈1.9s) + a bit
      await sleep(2600);

      // enter guest mode so internal views render, then navigate
      await page.evaluate((v) => {
        try {
          if (typeof state !== "undefined") { state.guest = true; }
          if (v === "onboarding") return; // prep handles it
          if (typeof go === "function") go(v);
        } catch (e) {}
      }, view);
      await sleep(400);

      if (prep) {
        await page.evaluate((code) => { try { eval(code); } catch (e) {} }, prep);
        await sleep(600);
      }

      // give async views (fetch from Supabase) time to fill
      await sleep(1600);

      await page.screenshot({ path: `${OUT}/${label}.png`, fullPage: false });
      console.log(`✓ ${label}.png (${vp.w}×${vp.h})`);
    } catch (e) {
      console.error(`✗ ${label}: ${e.message}`);
    } finally {
      await ctx.close();
    }
  }

  await browser.close();
  console.log("\nDone. Screenshots in ./screenshots/");
}
main().catch((e) => { console.error("Fatal:", e.message); process.exit(1); });
