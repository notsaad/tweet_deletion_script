#!/usr/bin/env npx ts-node

import { Command } from "commander";
import { saveLogin } from "./login";
import { deleteTweets } from "./deletion_script";
import { deleteReplies } from "./reply_deletion_script";

const program = new Command();

program
  .name("tweet-delete")
  .description("CLI tool for deleting tweets and replies from X/Twitter")
  .version("1.0.0");

program
  .command("login")
  .description("Log in to X/Twitter and save authentication")
  .action(async () => {
    try {
      await saveLogin();
    } catch (error) {
      console.error("Error during login:", error);
      process.exit(1);
    }
  });

program
  .command("tweets")
  .description("Delete tweets from your profile")
  .requiredOption("-u, --user <handle>", "Your X/Twitter handle (without @)")
  .option("-c, --count <number>", "Number of tweets to delete", "100")
  .action(async (options) => {
    try {
      const count = parseInt(options.count, 10);
      console.log(`🗑️  Deleting ${count} tweets for @${options.user}...`);
      await deleteTweets(count, options.user);
    } catch (error) {
      console.error("Error deleting tweets:", error);
      process.exit(1);
    }
  });

program
  .command("replies")
  .description("Delete replies from your profile")
  .requiredOption("-u, --user <handle>", "Your X/Twitter handle (without @)")
  .option("-c, --count <number>", "Number of replies to delete", "50")
  .action(async (options) => {
    try {
      const count = parseInt(options.count, 10);
      console.log(`🗑️  Deleting ${count} replies for @${options.user}...`);
      await deleteReplies(count, options.user);
    } catch (error) {
      console.error("Error deleting replies:", error);
      process.exit(1);
    }
  });

program.parse();
