import { chromium } from "playwright";

const REPLIES_TO_DELETE = 50;
// Helper function to generate random delay between min and max milliseconds
function randomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function deleteReplies(count: number) {
  const browser = await chromium.launch({ headless: false });
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
      console.log(`⏳ Waiting ${(delay / 1000).toFixed(1)}s before next deletion...`);
      await page.waitForTimeout(delay);
    }

    // Find the user's actual reply (not the tweet being replied to)
    // On the replies page, each reply thread shows:
    // 1. The original tweet (not ours) - often has "Replying to @username" text
    // 2. Our reply below it (this is what we want to delete)
    
    const allArticles = page.locator("article");
    const articleCount = await allArticles.count();

    if (articleCount === 0) {
      console.log("⚠️  No more replies found!");
      break;
    }

    // Strategy: Find articles with "Replying to" text (the original tweet),
    // then find the next article that has the user as author (the user's reply)
    let userReply = null;
    
    for (let j = 0; j < articleCount - 1; j++) {
      const article = allArticles.nth(j);
      
      // Check if this article has "Replying to" text (indicating it's showing the original tweet)
      const hasReplyingTo = await article.locator('text=/Replying to/i').count() > 0;
      
      if (hasReplyingTo) {
        // This is the original tweet being replied to
        // The next article should be the user's reply
        const nextArticle = allArticles.nth(j + 1);
        const authorLink = nextArticle.locator(`a[href="/${USER_HANDLE}"]`).first();
        
        if (await authorLink.count() > 0) {
          // Found it! This is the user's reply
          userReply = nextArticle;
          break;
        }
      }
    }

    // Fallback: If we didn't find via "Replying to", try finding user's articles
    // that appear after other articles (likely replies)
    if (!userReply) {
      for (let j = 1; j < articleCount; j++) {
        const article = allArticles.nth(j);
        const authorLink = article.locator(`a[href="/${USER_HANDLE}"]`).first();
        
        if (await authorLink.count() > 0) {
          // Check if the previous article is NOT by the user (meaning this is likely a reply)
          const prevArticle = allArticles.nth(j - 1);
          const prevAuthorLink = prevArticle.locator(`a[href="/${USER_HANDLE}"]`).first();
          
          if (await prevAuthorLink.count() === 0) {
            // Previous article is not by the user, so this is likely a reply
            userReply = article;
            break;
          }
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

      await repostActionButton.first().click();
      await page.waitForTimeout(randomDelay(400, 700));

      const undoRepostMenu = page.getByRole("menuitem", { name: /Undo (Repost|Retweet)/i });
      if ((await undoRepostMenu.count()) > 0) {
        await undoRepostMenu.first().click();
      } else {
        const undoRepostButton = page.getByRole("button", { name: /Undo (Repost|Retweet)/i });
        if ((await undoRepostButton.count()) > 0) {
          await undoRepostButton.first().click();
        } else {
          console.log("⚠️  Couldn't find the undo repost menu option, skipping...");
          continue;
        }
      }

      await page.waitForTimeout(randomDelay(1200, 2000)); // Wait for repost removal to complete
      deletedCount++;
      console.log(`✅ Removed repost ${deletedCount} of ${count}!`);
      continue;
    }

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

  console.log(`\n🎉 Finished! Successfully processed ${deletedCount} reply(ies).`);
  await browser.close();
}

deleteReplies(REPLIES_TO_DELETE);
