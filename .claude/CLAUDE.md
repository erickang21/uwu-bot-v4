# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

uwu-bot is a general-purpose anime/fun Discord bot (Discord.js v14) with slash and text-prefix (`uwu `) commands, MongoDB-backed settings, a leveling/economy system, and analytics tracking. Serves 26,000+ servers.

## Commands

- `npm run dev` — run locally with `NODE_ENV=development` (uses `TOKEN_DEV`/`DEV_CLIENT_ID`)
- `npm start` — run with `NODE_ENV=production`
- `npm run lint` — ESLint (`eslint:recommended`, CommonJS/Node/ES2021)
- `npm run pretty` — Prettier write (2-space, no tabs, LF, no trailing commas)
- `npm run deploy` — register/update slash commands via `src/deploy-commands.js` (or run the `deploy` dev-only command from Discord itself)
- There is no test suite in this repo.

CI (`.github/workflows/ci.yml`) runs `npm ci` + `npm run lint` on push to `main`, then triggers a deploy webhook.

### Running a single command / file manually
There's no per-file runner; to sanity-check a single command's logic, either load the bot with `npm run dev` and invoke it in a test server, or `node -e` a quick script requiring the relevant helper module.

## Entry points & sharding

- Top-level `index.js` boots a `ShardingManager` that spawns `src/index.js` as shards — this is what runs in production.
- `src/index.js` instantiates `UwUClient` directly with no sharding — used for local dev.
- Both paths are valid; code should not assume `this.shard` exists (it may be `null` when unsharded) but also must work correctly when sharded (see `broadcastEval` usage throughout).

## Architecture

### Store/Base pattern (command & event loading)
- `Store` (`src/structures/Store.js`) is a `Map` subclass that walks a directory (`src/commands` or `src/events`) and `require()`s every `.js` file as a class, instantiating it as `new Class(client, store, fileInfo)`.
- `Command` and `Event` both extend `Base` (`src/structures/Base.js`), which provides `name`, `enabled`, `reload()`.
- `CommandStore` extends `Store` with alias resolution (`this.aliases` map) and `usableCommands(msg)` filtering (permissions, NSFW, devOnly, guildOnly).
- `EventStore` extends `Store` and auto-wires each loaded `Event` to `client.on(event.name, ...)` — the event file's **filename must exactly match the Discord.js event name** (or a custom emitted event like `uwuReady`, `commandError`, `eventError`).
- Adding a new command = drop a new file in the right `src/commands/<category>/` subfolder; the category is inferred from the folder name (see `Command` constructor, `toProperCase(basename(file.dir))`).

### Command structure
Every command file exports a class extending `Command` (`src/structures/Command.js`):
- Constructor calls `super(...args, { description, usage, options, ... })`. Key options: `modes` (`["slash", "text"]` by default), `devOnly`, `aliases`, `cooldown` + `bucket` (`user`/`guild`/`channel`/`global`), `nsfw`, `guildOnly`, `botPermissions`/`userPermissions`, `subcommands`, `avoidTimeout` (defers slash replies for slow commands).
- Implement `async run(ctx, options)` for the actual logic; optionally override `async check(ctx, options)` (return `false` to silently block, a string to block with a message, `true`/truthy to proceed).
- `options` is unified between slash and text invocations: for slash it's the raw Discord `interaction.options`; for text it's a `CommandOptions` wrapper populated by `Command._parseArgs`/`_parseArg`, which parses positional text args per the declared `options` array (types: `user`, `member`, `channel`, `role`, `string`, `integer`). Access via `options.getUser(name)`, `options.getString(name)`, etc. — same call shape either mode.
- `getSlashCommandData()` auto-derives the `SlashCommandBuilder` from `options`/`subcommands`, so slash registration stays in sync with the text parser as long as options are declared declaratively (or via the `options` function form for advanced builders).
- See `src/commands/anime/hug.js` for a representative simple command.

### CommandContext (`src/structures/CommandContext.js`)
Unifies message-based and interaction-based invocation behind one API: `ctx.slash`/`ctx.text`, `ctx.author`, `ctx.member`, `ctx.guild`, `ctx.channel`, `ctx.reply()`/`ctx.editReply()`/`ctx.deferReply()`, `ctx.dev` (checks `DEVS` in `src/utils/constants.js`), `ctx.settings` (guild settings or defaults).

### CommandHandler (`src/structures/CommandHandler.js`)
Central dispatcher owned by `CommandStore.handler`, invoked from the `messageCreate`/`interactionCreate` events. Responsibilities in order: prefix/mention matching, flag parsing (`--flag=value`), permission/cooldown/NSFW/devOnly/guildOnly checks, per-guild command enable/disable + role allowlist/denylist (`checkServerSpecific`, backed by `guildSettings.commandConfig`), XP/leveling on messages and commands, analytics tracking (`AnalyticsManager.commandUsed`), and "did you mean?" typo suggestions (`fastest-levenshtein`) when a command isn't found.

### Settings/persistence (MongoDB)
- `Settings` (`src/structures/Settings.js`) wraps one Mongo collection per entity type (`guilds`, `members`, `users`, `commands` — instantiated on `UwUClient` in the constructor) with an in-memory cache merged against defaults from `src/utils/schema.js`. **Always add new persisted fields to `schema.js`** — `mergeDefault` fills missing keys from there, so undeclared fields silently won't exist for old documents.
- Use `client.getGuildSettings(id)`, `client.guildUpdate(id, obj)`, `client.getUserSettings(id)`, `client.userUpdate(id, obj)`, etc. (convenience wrappers on `UwUClient`) rather than touching `client.settings.*` directly, to keep cache and DB in sync.
- `users` settings do not load into cache on startup (`loadOnStartup=false` in the `UwUClient` constructor) — always go through `fetch()`/`sync()` for per-user data rather than assuming it's cached.

### Leveling/XP
XP accrues both per-message (every 25 messages, +1 xp/message) and per-command (every 5 commands, +5 xp/command), tracked in in-memory counters (`client.userMessageCount`/`userCommandCount`) to batch DB writes. Level breakpoint formula: `100 * floor(level / 5) + 25 * level`. Guild ID `372526440324923393` (the main support guild, see `MAIN_GUILD_ID` in `src/utils/constants.js`) gets a 3x XP multiplier.

### Image/GIF sourcing
Reaction-gif commands (`hug`, `pat`, `slap`, etc.) primarily hit the `nekos.best` API via `getNekosBestAPI()` (`src/helpers/anime.js`), which maps command names to valid nekos.best endpoints (`NEKOS_BEST_ENDPOINTS`/`NEKOS_BEST_FALLBACKS`). On API failure, commands fall back to a local image cache (`src/helpers/images.js`, `ImageService`) loaded at startup from `BASE_SFW_DIR`/`BASE_NSFW_DIR` on disk (production-server-specific paths, not present in dev). Other helper APIs in `src/helpers/anime.js` (`waifuAPI`, `nekoAPI`, `otakuAPI`, `getWaifuIm`, `getPurrbotAPI`, `gelbooruAPI`) back other image/NSFW commands.
- HTTP requests use `undici`'s `request()`, **not** `node-fetch` or bare `fetch` — see `NOTES.md` for the historical reasoning and the exact migration pattern (`res.body.json()` instead of `res.json()`).

### Analytics
`AnalyticsManager` (`src/structures/AnalyticsManager.js`) writes two document families into the Mongo `analytics` collection: daily rows keyed `{ type, date, ...dimensions }` and lifetime rows keyed `{ type: `${type}Total`, ...dimensions }`. Dates are **UTC** (`luxon`), so buckets roll over at midnight UTC.

- Recording is synchronous and in-memory: each shard accumulates into a `MetricBuffer` (`src/structures/MetricBuffer.js`), and the coordinating shard (shard 0, or the single client when unsharded) drains every shard once a minute and writes the merged result in one `bulkWrite`. Draining and clearing happen in one step — do not add a separate reset.
- To add a metric: add the daily→lifetime mapping to `METRIC_TYPES` in `src/utils/analytics.js` (a `null` lifetime means daily-only), then call `this.track(type, this.dimensions({ ...dims }), { field: n })` from a `record*` method. Give an aggregate and its own breakdown **different types** (see `commandBlocked` vs `commandBlockedByCommand`) or readers will double-count.
- **Retention**: daily rows carry `expiresAt` and a TTL index keys off that field alone, so lifetime totals are never reaped. `buildOperation()` is the only place that sets `expiresAt`; never set it on a lifetime row.
- Unique-actor sets (`uniqueUsers`, `activeGuilds`) live in `analytics_unique`, sharded across bucket documents so no document approaches the 16MB BSON limit. Never store a growing id array in a single document.
- Fleet size (`totalServerCount`, `serverCount`, `totalUserCount`, `memberCountBySize`) is snapshotted hourly from authoritative totals via `snapshotFleet()` rather than only incremented, so a missed event cannot leave a day's count drifting.
- Errors are attributed to `api` / `validation` / `logic` by `events/commandError.js` — an `ApiError` (`src/utils/errors.js`) means a provider failed, a bare string throw means the user was told they got it wrong, anything else is our bug. API helpers report per-call outcomes through `src/helpers/apiMetrics.js`, which the client registers at startup.
- `uwu metrics` (dev-only, `src/commands/developer/metrics.js`) reads it back; the website's `/api/stats` layer is documented in `STATS_API.md` in `uwu-bot-website-2`.

### Sharding-aware code
Multiple pieces of logic must work whether `client.shard` exists or not, and some operations run only once globally rather than once per shard — see `ReadyEvent.isAnalyticsCoordinator` in `events/uwuReady.js` before adding new periodic/global logic. Cross-shard data (guild counts, member lookups) goes through `client.shard.broadcastEval(...)`, or `client.getFleetStats()` which handles both cases.

## Conventions

- Developer-only commands: mark `devOnly: true` in the constructor options; these never get slash-registered (`deploy-commands.js` filters them out) and only work as text commands, gated to IDs in `DEVS` (`src/utils/constants.js`).
- The `reboot` command is actually a shutdown — see `NOTES.md`; it relies on an external process manager (e.g. `pm2`) to restart the process.
- Emoji constants live in both `src/utils/constants.js` (`EMOJIS`) and `src/structures/Emojis.js` — check both before adding new ones.
- `.env` holds secrets (`TOKEN`, `TOKEN_DEV`, `CLIENT_ID`, `MONGODB`, `TOPGG_API`, `GELBOORU_API_KEY`, `GELBOORU_USER_ID`); see `.env.example` for the full list.
