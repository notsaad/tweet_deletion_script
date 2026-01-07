import { Locator } from "playwright";
import * as fs from "fs";
import * as path from "path";

const CSV_FILE_PATH = path.join(__dirname, "deleted_tweets.csv");

export interface TweetData {
  content: string;
  timestamp: string;
  likes: string;
  retweets: string;
  replies: string;
  views: string;
  isRepost: boolean;
  deletedAt: string;
  tweetType: "tweet" | "reply" | "repost";
}

/**
 * Initializes the CSV file with headers if it doesn't exist
 */
export function initializeCSV(): void {
  if (!fs.existsSync(CSV_FILE_PATH)) {
    const headers = [
      "content",
      "tweet_timestamp",
      "likes",
      "retweets",
      "replies",
      "views",
      "is_repost",
      "deleted_at",
      "tweet_type",
    ].join(",");
    fs.writeFileSync(CSV_FILE_PATH, headers + "\n", "utf-8");
    console.log(`📄 Created CSV log file: ${CSV_FILE_PATH}`);
  }
}

/**
 * Escapes a string for CSV format (handles commas, quotes, newlines)
 */
function escapeCSV(value: string): string {
  if (!value) return '""';
  // Replace newlines with spaces and escape quotes
  const cleaned = value.replace(/[\r\n]+/g, " ").replace(/"/g, '""');
  // Wrap in quotes if contains comma, quote, or whitespace
  if (cleaned.includes(",") || cleaned.includes('"') || cleaned.includes(" ")) {
    return `"${cleaned}"`;
  }
  return cleaned;
}

/**
 * Extracts tweet data from a tweet article element before deletion
 */
export async function extractTweetData(
  tweetArticle: Locator,
  tweetType: "tweet" | "reply" | "repost" = "tweet"
): Promise<TweetData> {
  const deletedAt = new Date().toISOString();

  // Extract tweet text content
  let content = "";
  try {
    // Tweet text is usually in a div with data-testid="tweetText"
    const tweetTextElement = tweetArticle.locator('[data-testid="tweetText"]');
    if ((await tweetTextElement.count()) > 0) {
      content = await tweetTextElement.first().innerText();
    }
  } catch {
    content = "[Could not extract content]";
  }

  // Extract timestamp
  let timestamp = "";
  try {
    // Timestamp is in a time element
    const timeElement = tweetArticle.locator("time");
    if ((await timeElement.count()) > 0) {
      timestamp = (await timeElement.first().getAttribute("datetime")) || "";
    }
  } catch {
    timestamp = "";
  }

  // Extract engagement metrics
  let likes = "0";
  let retweets = "0";
  let replies = "0";
  let views = "0";

  try {
    // Like count - look for the like button group
    const likeButton = tweetArticle.locator('[data-testid="like"]');
    if ((await likeButton.count()) > 0) {
      const likeText = await likeButton.first().innerText();
      likes = likeText.trim() || "0";
    }
  } catch {
    likes = "0";
  }

  try {
    // Retweet count
    const retweetButton = tweetArticle.locator('[data-testid="retweet"]');
    if ((await retweetButton.count()) > 0) {
      const retweetText = await retweetButton.first().innerText();
      retweets = retweetText.trim() || "0";
    }
  } catch {
    retweets = "0";
  }

  try {
    // Reply count
    const replyButton = tweetArticle.locator('[data-testid="reply"]');
    if ((await replyButton.count()) > 0) {
      const replyText = await replyButton.first().innerText();
      replies = replyText.trim() || "0";
    }
  } catch {
    replies = "0";
  }

  try {
    // Views - look for analytics link or views text
    const viewsElement = tweetArticle.locator('a[href*="/analytics"]');
    if ((await viewsElement.count()) > 0) {
      const viewsText = await viewsElement.first().innerText();
      views = viewsText.trim() || "0";
    }
  } catch {
    views = "0";
  }

  // Check if it's a repost
  let isRepost = false;
  try {
    const repostBanner = tweetArticle.getByText(/You reposted/i);
    isRepost = (await repostBanner.count()) > 0;
  } catch {
    isRepost = false;
  }

  return {
    content,
    timestamp,
    likes,
    retweets,
    replies,
    views,
    isRepost,
    deletedAt,
    tweetType: isRepost ? "repost" : tweetType,
  };
}

/**
 * Logs tweet data to the CSV file
 */
export function logTweetToCSV(tweetData: TweetData): void {
  const row = [
    escapeCSV(tweetData.content),
    escapeCSV(tweetData.timestamp),
    escapeCSV(tweetData.likes),
    escapeCSV(tweetData.retweets),
    escapeCSV(tweetData.replies),
    escapeCSV(tweetData.views),
    tweetData.isRepost.toString(),
    escapeCSV(tweetData.deletedAt),
    escapeCSV(tweetData.tweetType),
  ].join(",");

  fs.appendFileSync(CSV_FILE_PATH, row + "\n", "utf-8");
}

/**
 * Convenience function to extract and log in one call
 */
export async function extractAndLogTweet(
  tweetArticle: Locator,
  tweetType: "tweet" | "reply" | "repost" = "tweet"
): Promise<TweetData> {
  const tweetData = await extractTweetData(tweetArticle, tweetType);
  logTweetToCSV(tweetData);
  return tweetData;
}
