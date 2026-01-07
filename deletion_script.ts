import { chromium } from "playwright";
import { initializeCSV, extractAndLogTweet } from "./tweet_logger";

const TWEETS_TO_DELETE = 100;
// Helper function to generate random delay between min and max milliseconds
function randomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function deleteTweets(count: number) {
  // Initialize CSV file for logging
  initializeCSV();

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ storageState: "auth.json" });
  const page = await context.newPage();

  await page.goto("https://x.com/notsaadOK"); // replace with your handle
  await page.waitForTimeout(3000); // let page load

  // Click Likes tab to force content loading
  const likesTab = page.getByRole("tab", { name: /Likes/i });
  if ((await likesTab.count()) > 0) {
    await likesTab.first().click();
    await page.waitForTimeout(2000); // wait for likes to load
  }

  // Go back to Posts tab
  const postsTab = page.getByRole("tab", { name: /Posts/i });
  if ((await postsTab.count()) > 0) {
    await postsTab.first().click();
    await page.waitForTimeout(3000); // let tweets load
  } else {
    // Fallback: try "Posts & replies" if "Posts" doesn't exist
    const postsAndRepliesTab = page.getByRole("tab", {
      name: /Posts & replies/i,
    });
    if ((await postsAndRepliesTab.count()) > 0) {
      await postsAndRepliesTab.first().click();
      await page.waitForTimeout(3000);
    }
  }

  await page.evaluate(() => window.scrollBy(0, 400)); // scroll past pinned/header content
  await page.waitForTimeout(1000);

  let deletedCount = 0;

  for (let i = 0; i < count; i++) {
    console.log(`\n📝 Processing tweet ${i + 1} of ${count}...`);

    // Wait a bit before processing the next tweet to avoid rate limits
    if (i > 0) {
      const delay = randomDelay(1500, 3500); // Random delay between 1.5-3.5 seconds
      console.log(
        `⏳ Waiting ${(delay / 1000).toFixed(1)}s before next deletion...`,
      );
      await page.waitForTimeout(delay);
    }

    // Select the first tweet (after deletions, this will be the next one)
    const firstTweet = page.locator("article").first();
    const tweetCount = await firstTweet.count();

    if (tweetCount === 0) {
      console.log("⚠️  No more tweets found!");
      break;
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
    const tweetData = await extractAndLogTweet(firstTweet, "tweet");
    console.log(
      `   📋 Logged: "${tweetData.content.substring(0, 50)}${tweetData.content.length > 50 ? "..." : ""}"`,
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
    console.log(`✅ Deleted tweet ${deletedCount} of ${count}!`);
  }

  console.log(
    `\n🎉 Finished! Successfully processed ${deletedCount} tweet(s).`,
  );
  await browser.close();
}

deleteTweets(TWEETS_TO_DELETE);
