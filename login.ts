import { chromium } from "playwright";
import * as path from "path";

export async function saveLogin() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("https://x.com/login");
  console.log("👉 Log in manually in the browser window...");
  console.log("⏳ You have 60 seconds to complete login...");
  await page.waitForTimeout(60000); // gives you 60 seconds to log in

  const authPath = path.join(__dirname, "auth.json");
  await context.storageState({ path: authPath });
  console.log(`✅ Login saved to ${authPath}`);
  await browser.close();
}

// Allow running directly
if (require.main === module) {
  saveLogin();
}
