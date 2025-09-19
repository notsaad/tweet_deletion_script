// delete-one.ts
import { chromium } from "playwright";

async function deleteOneTweet() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ storageState: "auth.json" });
  const page = await context.newPage();

  await page.goto("https://x.com/notsaadOK"); // replace with your handle
  await page.waitForTimeout(5000); // let tweets load

  // Select the first tweet
  const firstTweet = page.locator("article").first();
  if (!firstTweet) {
    console.log("No tweet found!");
    return;
  }

  // Open the "More" menu
  const menuButton = firstTweet.getByRole("button", { name: "More" });
  if (menuButton) {
    await menuButton.click();
    await page.waitForTimeout(1000);

    // Click "Delete"
    await page.click('text=Delete');
    await page.waitForTimeout(500);

    // Confirm delete
    await page.click('text=Delete');
    console.log("✅ Deleted one tweet!");
  } else {
    console.log("Couldn't find the menu button");
  }

  await browser.close();
}

deleteOneTweet();
