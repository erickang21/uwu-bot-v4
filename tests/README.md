# Testing mode

Two scripts live here:

| Script | What it does | Needs Discord? |
| --- | --- | --- |
| `discord_harness.js` | Runs real commands against a live dev bot and reports what it sent back | yes |
| `harness_selftest.js` | Verifies the harness's own logic and the dev-only author gate | no |

## Why a testing mode was needed

The bot has no unit-testable seam for a command: a command's real output is a
Discord message, and the only way to produce one is to invoke the command the
way a user does. A bot account cannot post as a human, and until now
`CommandHandler#handleMessage()` dropped every bot-authored message, so nothing
automated could trigger a command or read the result.

`CommandHandler#isAuthorAllowed()` now accepts bot authors — including uwu bot
itself — **when `NODE_ENV=development`**. In production, bot messages are ignored
exactly as before. Nothing user-facing changes.

## Setup

1. Invite the dev bot to a test guild. Give it Send Messages, Embed Links, Read
   Message History and Attach Files in the channel you will test in. Moderate
   Members and Manage Server let the moderation and customization cases run
   instead of reporting `BLOCKED`.
2. Fill in `.env`:

   ```
   TOKEN_DEV=...        # the dev bot token
   MONGODB=...          # the bot needs it; the harness does not
   TEST_CHANNEL=...     # id of the channel to test in
   ```

   Optional: `TEST_TOKEN` (log in with a different token) and `TEST_BOT_ID`
   (test a bot other than the harness's own user, e.g. when the harness runs on
   its own token).

## Running

```sh
npm run test:harness                              # self test, no Discord needed
npm run test:discord                              # spawn the dev bot, run every case
node tests/discord_harness.js --attach            # test a bot already running
node tests/discord_harness.js --category=anime    # one category
node tests/discord_harness.js --only=hug,ping     # specific commands
node tests/discord_harness.js --json=report.json  # machine readable report
node tests/discord_harness.js --list              # print the plan and exit
node tests/discord_harness.js --help              # all options
```

By default the harness spawns `src/index.js` itself with
`NODE_ENV=development`, waits for it to log in, runs the cases and shuts it down
again. Use `--attach` when you already have `npm run dev` going.

## What it does

1. Logs in with `TOKEN_DEV` as a second gateway session, alongside the bot under
   test.
2. Sends a bare mention as a preflight. The reply proves the bot can see and
   answer in `TEST_CHANNEL`, and it names the prefix that guild actually uses,
   so a custom prefix cannot silently break the run. Override with
   `--prefix="uwu "`.
3. Posts each invocation, then collects every message the bot sends back, waits
   out a settle window (`--settle`, default 2.5s) so edits and follow-ups are
   caught, and re-fetches each message's final state.
4. Records what it can observe about each response:

   - whether a message was sent at all, and how long it took
   - whether it has text content, and whether it is a reply to the invocation
   - embeds: how many, title, description, image, thumbnail, field count, footer
   - attachments: how many, name, content type, whether they are images
   - whether an image is present anywhere (embed image, thumbnail or attachment)
   - whether the message was edited after being sent
   - component count

5. Compares that against each case's expectations and prints a table:

   ```
   CATEGORY  COMMAND    OUTCOME   MS   MSG  TEXT  EMBED  IMAGE  FILE  EDIT  REPLY
   anime     hug        PASS      412  y    -     y      y      -     -     y
   general   ping       PASS      289  y    y     -      -      -     y     y
   images    beautiful  DEGRADED  190  y    y     N      N      N     -     y
   level     profile    TIMEOUT   -    N    -     N      -      -     -     -
   ```

   `y` observed, `N` expected but missing, `-` neither expected nor seen.

## Outcomes

| Outcome | Meaning | Fails the run |
| --- | --- | --- |
| `PASS` | Every expected property was observed | no |
| `FAIL` | A property is missing, the command threw, or the command no longer exists (the bot answered with a "did you mean?" suggestion) | yes |
| `TIMEOUT` | The bot never responded | yes |
| `DEGRADED` | The command replied correctly, but an external dependency was unavailable (image API down, `error.api`, cooldown) | only with `--strict` |
| `BLOCKED` | The invocation was refused before running, usually missing permissions in the test guild | only with `--strict` |

Exit code is 0 when nothing failed, 1 otherwise, so this drops into CI or a
pre-deploy check as-is.

## Cases

Two per category, excluding `developer` and `nsfw`. `--list` prints the current
plan. `analytics` is skipped because both of its commands are `devOnly`; the
harness re-derives this from `src/commands` on every run and prints a
`Coverage gap:` warning if a category drops below two cases, so adding a
category or making a dev-only command public shows up immediately.

Every invocation is read-only or self-targeted by design:

- `mod` uses `audit` against the bot's own id (read-only) and `mute` with no
  member, which exercises the refusal path and mutes nobody. Nothing bans,
  kicks, purges or times out a real member.
- `customization` invokes `prefix` and `modlog` with no arguments, which reports
  the current setting instead of changing it.
- `economy` reads a balance and asks for an out-of-range leaderboard page, so
  the reply is deterministic whether or not the test guild has economy data.
  Nothing spends or grants currency.

A run performs no database writes. `Settings.sync()` only reads, and analytics,
XP and command-stat tracking are skipped for bot authors, so harness traffic
never lands in the `analytics`, `users` or `commands` collections.

## Limitations

- Text commands only. A bot cannot invoke a slash command, so slash-specific
  paths (`interactionCreate`, deferrals, ephemeral replies) are not covered.
  Most command logic is shared between the two modes via `CommandContext`.
- `images` cases need the `img-api` service on `localhost:3030`. Without it they
  report `DEGRADED` rather than failing.
- Commands that require a shard manager are not covered. `general/stats` is left
  out for this reason: it calls `client.shard.broadcastEval` directly, and
  `npm run dev` runs unsharded.
- The harness asserts on observable message properties, not on exact wording. It
  catches "the embed lost its image" and "the command stopped replying", not
  "this sentence was reworded".
