import { chromium } from "playwright";
import { initializeCSV, extractAndLogTweet } from "./tweet_logger";

const REPLIES_TO_DELETE = 250;
// Helper function to generate random delay between min and max milliseconds
function randomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function deleteReplies(count: number) {
  // Initialize CSV file for logging
  initializeCSV();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: "auth.json" });
  const page = await context.newPage();

  const USER_HANDLE = "notsaadOK"; // replace with your handle

  await page.goto(`https://x.com/${USER_HANDLE}/with_replies`); // includes both tweets and replies
  await page.waitForTimeout(5000); // let tweets and replies load
  await page.evaluate(() => window.scrollBy(0, 400)); // scroll past pinned/header content
  await page.waitForTimeout(1000);

  let deletedCount = 0;

  for (let i = 0; i < count; i++) {
    console.log(`\n📝 Processing reply ${i + 1} of ${count}...`);

    // Wait a bit before processing the next reply to avoid rate limits
    if (i > 0) {
      const delay = randomDelay(1500, 3500); // Random delay between 1.5-3.5 seconds
      console.log(
        `⏳ Waiting ${(delay / 1000).toFixed(1)}s before next deletion...`,
      );
      await page.waitForTimeout(delay);
    }

    // Find the first article that belongs to the user (has their username as author)
    const allArticles = page.locator("article");
    const articleCount = await allArticles.count();

    if (articleCount === 0) {
      console.log("⚠️  No more replies found!");
      break;
    }

    // Find the first article authored by the user
    let userReply = null;

    for (let j = 0; j < articleCount; j++) {
      const article = allArticles.nth(j);

      // Check if this article is authored by the user by looking in the User-Name area
      // This is the tweet header that contains the actual author, not mentions in the tweet body
      const userNameArea = article.locator('[data-testid="User-Name"]');

      if ((await userNameArea.count()) > 0) {
        // Look for the user's handle link specifically within the author header
        const authorLink = userNameArea.locator(`a[href="/${USER_HANDLE}"]`);

        if ((await authorLink.count()) > 0) {
          // This article is authored by the user
          userReply = article;
          break;
        }
      }
    }

    if (!userReply) {
      console.log("⚠️  Couldn't find your reply to delete!");
      break;
    }

    const firstTweet = userReply;

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
        console.log("⚠️  Couldn't find the repost button to undo, skipping...");
        continue;
      }

      // Extract and log tweet data before removing repost
      const repostData = await extractAndLogTweet(firstTweet, "repost");
      console.log(
        `   📋 Logged: "${repostData.content.substring(0, 50)}${repostData.content.length > 50 ? "..." : ""}"`,
      );

      await repostActionButton.first().click();
      await page.waitForTimeout(randomDelay(400, 700));

      const undoRepostMenu = page.getByRole("menuitem", {
        name: /Undo (Repost|Retweet)/i,
      });
      if ((await undoRepostMenu.count()) > 0) {
        await undoRepostMenu.first().click();
      } else {
        const undoRepostButton = page.getByRole("button", {
          name: /Undo (Repost|Retweet)/i,
        });
        if ((await undoRepostButton.count()) > 0) {
          await undoRepostButton.first().click();
        } else {
          console.log(
            "⚠️  Couldn't find the undo repost menu option, skipping...",
          );
          continue;
        }
      }

      await page.waitForTimeout(randomDelay(1200, 2000)); // Wait for repost removal to complete
      deletedCount++;
      console.log(`✅ Removed repost ${deletedCount} of ${count}!`);
      continue;
    }

    // Extract and log tweet data before deletion
    const replyData = await extractAndLogTweet(firstTweet, "reply");
    console.log(
      `   📋 Logged: "${replyData.content.substring(0, 50)}${replyData.content.length > 50 ? "..." : ""}"`,
    );

    // Open the "More" menu
    const menuButton = firstTweet.getByRole("button", { name: "More" });
    if ((await menuButton.count()) === 0) {
      console.log("⚠️  Couldn't find the menu button, skipping...");
      continue;
    }

    await menuButton.first().click();
    await page.waitForTimeout(randomDelay(800, 1400));

    // Click "Delete" in tweet menu
    const deleteMenuItem = page.getByRole("menuitem", { name: "Delete" });
    if ((await deleteMenuItem.count()) === 0) {
      console.log("⚠️  Couldn't find delete menu item, skipping...");
      // Close menu if it's open
      await page.keyboard.press("Escape");
      continue;
    }

    await deleteMenuItem.first().click();
    await page.waitForTimeout(randomDelay(400, 700));

    // Confirm delete in modal
    const confirmDelete = page.getByRole("button", { name: "Delete" });
    await confirmDelete.waitFor({ state: "visible" });
    await confirmDelete.click();

    await page.waitForTimeout(randomDelay(1200, 2000)); // Wait for deletion to complete
    deletedCount++;
    console.log(`✅ Deleted reply ${deletedCount} of ${count}!`);
  }

  console.log(
    `\n🎉 Finished! Successfully processed ${deletedCount} reply(ies).`,
  );
  await browser.close();
}

deleteReplies(REPLIES_TO_DELETE);
