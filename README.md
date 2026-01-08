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

This saves your session to `auth.json` for future use.

### 2. Delete Tweets

Delete tweets from your profile:

```bash
./x-delete tweets -u <your_handle> -c <count>
```

Options:

- `-u, --user <handle>` - Your X/Twitter handle without @ (required)
- `-c, --count <number>` - Number of tweets to delete (default: 100)

Example:

```bash
./x-delete tweets -u notsaadOK -c 50
```

### 3. Delete Replies

Delete replies from your profile:

```bash
./x-delete replies -u <your_handle> -c <count>
```

Options:

- `-u, --user <handle>` - Your X/Twitter handle without @ (required)
- `-c, --count <number>` - Number of replies to delete (default: 50)

Example:

```bash
./x-delete replies -u notsaadOK -c 25
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
- `deleted_tweets.csv` - Log of deleted tweets (created on first deletion)
