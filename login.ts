import { chromium } from "playwright";
import * as path from "path";
import * as fs from "fs";

const CONFIG_PATH = path.join(__dirname, "config.json");

export interface Config {
  userHandle: string;
}

export function getConfig(): Config | null {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
    }
  } catch {
    // ignore
  }
  return null;
}

export function saveConfig(config: Config): void {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

export async function saveLogin() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto("https://x.com/login");
  console.log("👉 Log in manually in the browser window...");
  console.log("⏳ You have 60 seconds to complete login...");
  await page.waitForTimeout(60000); // gives you 60 seconds to log in

  // Try to extract the username from the page
  let userHandle = "";
  try {
    // Navigate to home to find the profile link
    await page.goto("https://x.com/home");
    await page.waitForTimeout(3000);

    // Look for the profile link which contains the username
    const profileLink = page.locator('a[data-testid="AppTabBar_Profile_Link"]');
    if ((await profileLink.count()) > 0) {
      const href = await profileLink.getAttribute("href");
      if (href) {
        userHandle = href.replace("/", "");
        console.log(`👤 Detected username: @${userHandle}`);
      }
    }
  } catch {
    console.log("⚠️  Could not auto-detect username");
  }

  const authPath = path.join(__dirname, "auth.json");
  await context.storageState({ path: authPath });
  console.log(`✅ Login saved to ${authPath}`);

  if (userHandle) {
    saveConfig({ userHandle });
    console.log(`✅ Username saved to config.json`);
  }

  await browser.close();
}

// Allow running directly
if (require.main === module) {
  saveLogin();
}
