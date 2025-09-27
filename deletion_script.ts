import { chromium } from "playwright";

async function deleteOneTweet() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ storageState: "auth.json" });
  const page = await context.newPage();

  await page.goto("https://x.com/notsaadOK"); // replace with your handle
  await page.waitForTimeout(5000); // let tweets load
  await page.evaluate(() => window.scrollBy(0, 400)); // scroll past pinned/header content
  await page.waitForTimeout(1000);

  // Select the first tweet
  const firstTweet = page.locator("article").first();
  if (!firstTweet) {
    console.log("No tweet found!");
    return;
  }

  // If the first tweet is a repost/retweet, remove it instead of trying to delete
  const repostBanner = firstTweet.getByText(/You reposted/i);
  const undoRepostWithinTweet = firstTweet.getByRole("button", {
    name: /Undo (Repost|Retweet)/i,
  });
  if (
    (await repostBanner.count()) > 0 ||
    (await undoRepostWithinTweet.count()) > 0
  ) {
    const repostActionButton = firstTweet.getByRole("button", {
      name: /Repost|Reposted|Retweet|Undo Repost|Undo Retweet/i,
    });

    if ((await repostActionButton.count()) === 0) {
      console.log("Couldn't find the repost button to undo");
      await browser.close();
      return;
    }

    await repostActionButton.first().click();
    await page.waitForTimeout(500);

    const undoRepostMenu = page.getByRole("menuitem", { name: /Undo (Repost|Retweet)/i });
    if ((await undoRepostMenu.count()) > 0) {
      await undoRepostMenu.first().click();
    } else {
      const undoRepostButton = page.getByRole("button", { name: /Undo (Repost|Retweet)/i });
      if ((await undoRepostButton.count()) > 0) {
        await undoRepostButton.first().click();
      } else {
        console.log("Couldn't find the undo repost menu option");
        await browser.close();
        return;
      }
    }

    await page.waitForTimeout(1000);
    console.log("✅ Removed one repost!");
    await browser.close();
    return;
  }

  // Open the "More" menu
  const menuButton = firstTweet.getByRole("button", { name: "More" });
  if (menuButton) {
    await menuButton.click();
    await page.waitForTimeout(1000);

    // Click "Delete" in tweet menu
    const deleteMenuItem = page.getByRole("menuitem", { name: "Delete" });
    await deleteMenuItem.click();

    // Confirm delete in modal
    const confirmDelete = page.getByRole("button", { name: "Delete" });
    await confirmDelete.waitFor({ state: "visible" });
    await confirmDelete.click();

    console.log("✅ Deleted one tweet!");
  } else {
    console.log("Couldn't find the menu button");
  }

  await browser.close();
}

deleteOneTweet();
