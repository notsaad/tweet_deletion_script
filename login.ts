import { chromium } from "playwright";

async function saveLogin() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("https://x.com/login");
  console.log("👉 Log in manually, then press Enter here…");
  await page.waitForTimeout(60000); // gives you 60 seconds to log in

  await context.storageState({ path: "auth.json" });
  await browser.close();
}

saveLogin();
