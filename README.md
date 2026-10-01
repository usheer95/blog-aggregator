# gator

gator is a command-line RSS feed aggregator. You can register users, add and follow RSS feeds, collect their posts in the background, and browse the latest posts from the feeds you follow.

## Requirements

To run gator you'll need:

- **Node.js** (with npm). gator is written in TypeScript and runs on Node.
- **PostgreSQL**. gator stores users, feeds, follows, and posts in a Postgres database, so you'll need a running Postgres server and an empty database for gator, for example one called `gator`.

## Installation

Clone the repository and install the dependencies:

```bash
git clone <repo-url>
cd gator
npm install
```

Then run the database migrations so the required tables exist before you use any commands.

## Configuration

gator reads its settings from a JSON file in your home directory:

```
~/.gatorconfig.json
```

You need to create this file yourself before running any command. gator reads it on startup and does not create it for you.

```json
{
    "dbUrl": "postgres://username:password@localhost:5432/gator?sslmode=disable",
    "currentUserName": ""
}
```

| Key               | Description                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| `dbUrl`           | The connection string for your Postgres database.                                               |
| `currentUserName` | The user who is currently logged in. Leave it empty at first. gator sets it when you register or log in. |

> **Note:** The config is validated strictly. Both keys are required, and any extra keys cause an error.

## Usage

Run commands through the project's start script, followed by the command name and its arguments:

```bash
npm run start <command> [args...]
```

### Quick start

```bash
# Create a user (this also logs you in)
npm run start register alice

# Add a feed (you automatically follow feeds you add)
npm run start addfeed "Hacker News" https://news.ycombinator.com/rss

# Start collecting posts every minute (press Ctrl+C to stop)
npm run start agg 1m

# In another terminal, read the latest posts
npm run start browse 5
```

## Commands

### Users

| Command            | Description                                                  |
| ------------------ | ------------------------------------------------------------ |
| `register <name>`  | Creates a new user and logs in as them.                      |
| `login <name>`     | Logs in as an existing user.                                 |
| `users`            | Lists all users and marks the one currently logged in.       |
| `reset`            | Deletes all users from the database. Use with care.          |

### Feeds

These commands require you to be logged in, except `feeds`.

| Command                | Description                                                   |
| ---------------------- | ------------------------------------------------------------- |
| `addfeed <name> <url>` | Adds a new RSS feed and follows it automatically.             |
| `feeds`                | Lists every feed along with the user who added it.            |
| `follow <url>`         | Follows an existing feed by its URL.                          |
| `unfollow <url>`       | Stops following a feed.                                       |
| `following`            | Lists the feeds you currently follow.                         |

### Aggregating and browsing

| Command           | Description |
| ----------------- | ----------- |
| `agg <interval>`  | Repeatedly fetches feeds and saves new posts. The interval is a number followed by a unit, which can be `ms`, `s`, `m`, or `h`, for example `30s`, `1m`, or `1h`. Runs until you press Ctrl+C. |
| `browse [limit]`  | Shows the most recent posts from feeds you follow. Defaults to 2 posts if no limit is given. |

## Troubleshooting

- **The config file is missing or fails validation.** Make sure `~/.gatorconfig.json` exists and contains only `dbUrl` and `currentUserName`.
- **You see "No user currently logged in".** Run `register` or `login` first.
- **Following a feed fails because it doesn't exist.** The feed must be added with `addfeed` before others can `follow` it.