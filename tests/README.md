# Testing mode

| Script | What it does | Needs Discord? |
| --- | --- | --- |
| `offline_harness.js` | Runs every command's `execute()` against a fake context and reports the payload it would have sent | no |
| `harness_selftest.js` | Verifies the live harness's own logic and the dev-only author gate | no |
| `discord_harness.js` | Runs commands against a live dev bot in a real channel | yes |

Start with `offline_harness.js`: it needs nothing, covers every command, and runs
in seconds. Reach for `discord_harness.js` when the question is whether Discord
itself accepts and renders the result — see [the live harness](#the-live-harness)
at the end.

## The offline harness

`offline_harness.js` runs a command's real `execute()` against a fake Discord
context and prints the payload it would have sent. No token, no database, no
network, no test server.

```sh
npm test                                        # every command
node tests/offline_harness.js --sweep           # one command per category
node tests/offline_harness.js --only=hug --dump # one command, full payload
node tests/offline_harness.js --help            # all options
```

A full run is 97 commands in about five seconds.

## Why

A command's output is a Discord message, so there was no way to check one
without a bot account, a server and a human reading the result. But the message
is just an object until it is sent — build a context, call `execute()`, and read
the object. That is the whole idea.

This is deliberately **not** an assertion suite. It answers "what does this
command produce right now, and did it blow up doing it", which is the input you
need to judge whether a change broke something. Nothing here encodes what the
output *should* be, so it never goes stale against intentional changes.

## What you get

```
CATEGORY  COMMAND  RESULT  MS  SENDS  TEXT  EMBED  IMAGE  FILE  DBW  OUTPUT
anime     hug      OK      52  1      -     y      y      -     0    embed "Hug!" image=https://cdn.example.invalid/hug.gif
general   ping     OK      51  2      y     -      -      -     0    "Ping? <a:loading:…>" +1 more
mod       warn     OK      51  2      y     y      -      -     1    embed "You have received a warning." +1 more
```

- `SENDS` — how many messages the command would send, counting edits
- `TEXT` / `EMBED` / `IMAGE` / `FILE` — what the payload contains
- `DBW` — settings writes it would perform
- `OUTPUT` — the actual title, text or image url it produced

`--dump` prints the full payload for each send: embed title, description, image
and thumbnail urls, fields, footer, colour, attachment names and kinds,
components, ephemeral flag. `--json=path` writes the same thing as a file.

| Result | Meaning |
| --- | --- |
| `OK` | Sent at least one message, nothing thrown |
| `REJECTED` | Threw a string, which `Command.execute` turns into a user-facing refusal. Usually the sample argument's fault, not the command's |
| `NO_OUTPUT` | Ran without error and sent nothing. The user would see silence |
| `ERROR` | Threw a real error. The user would see the generic error embed |

Exit code is 1 if anything is `ERROR` or `NO_OUTPUT`.

## How the fake world is built

- The real `UwUClient` is constructed but never logged in, and commands load
  through the real `CommandStore`, so categories, aliases, declared options and
  the real argument parser are all in play.
- `client.db` is swapped for an in-memory stand-in, so the real `Settings` class
  runs unchanged — cache, `mergeDefault`, upserts — and every write is recorded
  instead of persisted.
- Guild, channel, users, member and roles are fakes whose mutating methods
  (`member.ban`, `channel.bulkDelete`, `roles.add`, webhooks…) record the call
  instead of performing it. The invoking member holds a role above the target's,
  because moderation commands compare role positions and a flat hierarchy would
  make all of them refuse.
- External APIs are stubbed with deterministic responses matching each helper's
  real return shape: nekos.best, waifu.pics, nekos.life, otakugifs, waifu.im,
  purrbot, gelbooru, the local image cache, img-api and top.gg, plus `undici`
  itself for the four commands that call it directly. `--live` calls the real
  endpoints instead.
- Settings are seeded (economy balances, an audit-log entry, level 7, an expired
  daily cooldown) so read paths render populated output rather than empty
  states, and are reset between commands so a run does not depend on its order.
  `--empty` starts from schema defaults instead.

## Inputs

One sample value per declared option, chosen by type: a mention for `user` and
`member`, a channel mention for `channel`, a role name for `role`, `1` for
`integer`. Strings use the option's `choices` when it declares them, otherwise a
value keyed off the option's name and description, so `time` gets `10m`, `reason`
gets a sentence and an on/off toggle gets `on` rather than falling into the
command's invalid-usage branch. `--list` shows exactly what will be passed.

Three input modes are worth running, and they find different things:

```sh
npm test                                # every option filled
node tests/offline_harness.js --minimal # only required options
node tests/offline_harness.js --junk    # nonsense for every string option
```

`--minimal` finds commands that break when an optional argument is absent.
`--junk` finds commands that answer invalid input with silence.

Also useful: `--unsharded` sets `client.shard` to null, the way `npm run dev`
does, which surfaces code that assumes a shard manager exists.

## Limitations

- Text-mode invocation only. Slash-specific behaviour (`interactionCreate`,
  deferrals, ephemeral replies) is not exercised, though `CommandContext` means
  most command logic is shared.
- It proves a payload was built, not that Discord accepts it. Embed and
  attachment builders do validate as they go, so malformed embeds still throw
  here, but permissions, rate limits and rendering are out of scope.
- Developer-only commands are always skipped: they gate on a developer id and
  include `eval`, `exec` and `reboot`. NSFW commands are included by default
  since nothing is actually sent; `--no-nsfw` skips them.
- Stubbed responses are one fixed shape per helper. A command that reads a field
  the stub does not provide shows up as an error, which is a harness gap rather
  than a bug in the command — the stack trace makes the difference obvious.

## The live harness

`discord_harness.js` covers the one thing the offline harness cannot: whether
Discord accepts the payload, renders it, and lets the bot post it at all. It logs
in with `TOKEN_DEV`, posts two commands per category into `TEST_CHANNEL`, and
reports what came back.

```sh
npm run test:harness                              # self test, no Discord needed
npm run test:discord                              # spawn the dev bot, run every case
node tests/discord_harness.js --attach            # test a bot already running
node tests/discord_harness.js --help              # all options
```

Setup: invite the dev bot to a test guild with Send Messages, Embed Links, Read
Message History and Attach Files (plus Moderate Members and Manage Server, or the
moderation and customization cases report `BLOCKED`), then set `TOKEN_DEV`,
`MONGODB` and `TEST_CHANNEL` in `.env`. `TEST_TOKEN` and `TEST_BOT_ID` are
optional overrides.

It reports `PASS`, `FAIL`, `TIMEOUT`, `DEGRADED` (the command replied but an
external dependency was down) or `BLOCKED` (refused for missing permissions), and
exits non-zero on the first two. `--strict` also fails on the soft outcomes.

This is why `CommandHandler#isAuthorAllowed()` accepts bot authors when
`NODE_ENV=development`: a bot cannot post as a human, so the harness could not
otherwise trigger a command. In production, bot messages are ignored exactly as
before.

Cases are read-only or self-targeted, and a run performs no database writes:
`Settings.sync()` only reads, and analytics, XP and command-stat tracking are
skipped for bot authors. Text commands only, `images` cases need `img-api` on
`localhost:3030`, and `general/stats` is left out because it calls
`client.shard.broadcastEval` directly while `npm run dev` runs unsharded.
