# Tweet Deletion Script

A CLI tool for bulk deleting tweets and replies from X/Twitter using Playwright browser automation.

## Installation

```bash
npm install
```

## Usage

### 1. Login

First, authenticate with X/Twitter. This opens a browser window where you have 60 seconds to log in manually:

```bash
./x-delete login
```

This saves your session to `auth.json` and automatically detects your username for future commands.

### 2. Delete Tweets

Delete tweets from your profile:

```bash
./x-delete tweets -c <count>
```

Options:

- `-u, --user <handle>` - Your X/Twitter handle without @ (auto-detected from login)
- `-c, --count <number>` - Number of tweets to delete (default: 100)

Examples:

```bash
./x-delete tweets              # Delete 100 tweets using saved username
./x-delete tweets -c 50        # Delete 50 tweets
./x-delete tweets -u other -c 50  # Override username
```

### 3. Delete Replies

Delete replies from your profile:

```bash
./x-delete replies -c <count>
```

Options:

- `-u, --user <handle>` - Your X/Twitter handle without @ (auto-detected from login)
- `-c, --count <number>` - Number of replies to delete (default: 50)

Examples:

```bash
./x-delete replies             # Delete 50 replies using saved username
./x-delete replies -c 25       # Delete 25 replies
```

## Features

- Deletes tweets, replies, and reposts/retweets
- Logs all deleted tweets to `deleted_tweets.csv` with:
  - Tweet content
  - Original timestamp
  - Engagement metrics (likes, retweets, replies, views)
  - Deletion timestamp
  - Tweet type (tweet/reply/repost)
- Random delays between deletions to avoid rate limiting
- Automatic retry logic if tweets don't load initially

## Files

- `x-delete` - CLI executable (symlink to cli.ts)
- `cli.ts` - Main CLI entry point
- `login.ts` - Authentication handling
- `deletion_script.ts` - Tweet deletion logic
- `reply_deletion_script.ts` - Reply deletion logic
- `tweet_logger.ts` - CSV logging utility
- `auth.json` - Saved authentication state (created after login)
- `config.json` - Saved username (created after login)
- `deleted_tweets.csv` - Log of deleted tweets (created on first deletion)
