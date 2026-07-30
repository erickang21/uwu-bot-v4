#!/usr/bin/env node
"use strict";

/**
 * uwu bot end-to-end Discord test harness.
 *
 * Drives real text commands against a running development instance of the bot
 * and reports what the bot actually sent back, so regressions are caught before
 * they reach users.
 *
 * How it works
 * ------------
 * 1. Logs in with TOKEN_DEV (the dev bot user) as a second gateway session.
 * 2. Optionally spawns `src/index.js` with NODE_ENV=development, which is the
 *    instance under test, and waits for it to log in.
 * 3. Posts command invocations into TEST_CHANNEL. Because the harness is a bot,
 *    the instance under test only reacts to them in development mode, see
 *    CommandHandler#isAuthorAllowed().
 * 4. Watches the same channel, collects every message the bot sends back
 *    (including later edits), and records observable properties: was a message
 *    sent, did it contain text, an embed, an image, an attachment, was it
 *    edited, how long it took.
 * 5. Compares those properties against each case's expectations and prints a
 *    table plus, optionally, a JSON report. Exits non-zero if anything failed.
 *
 * Requirements
 * ------------
 *   TOKEN_DEV     dev bot token (TEST_TOKEN overrides it)
 *   TEST_CHANNEL  id of a text channel the dev bot can read and write in
 *   MONGODB       needed by the bot itself, not by the harness
 *
 * Usage
 * -----
 *   ./tests/discord_harness.js                     spawn the dev bot and test it
 *   ./tests/discord_harness.js --attach            test an already running bot
 *   ./tests/discord_harness.js --only=hug,ping     run a subset of cases
 *   ./tests/discord_harness.js --category=anime    run one category
 *   ./tests/discord_harness.js --json=report.json  write a machine readable report
 *   ./tests/discord_harness.js --help              full option list
 */

require("dotenv").config();

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { Client, Events, GatewayIntentBits, Partials } = require("discord.js");

const ROOT = path.resolve(__dirname, "..");
const COMMANDS_DIR = path.join(ROOT, "src", "commands");

/** Categories the harness never touches, per the harness contract. */
const EXCLUDED_CATEGORIES = ["developer", "nsfw"];

const DEFAULTS = {
  /** How long to wait for the bot's first response to a command. */
  timeout: 15000,
  /** Extra window after the first response, to catch edits and follow-ups. */
  settle: 2500,
  /** Pause between cases, to stay well clear of Discord rate limits. */
  gap: 1000,
  /** How long to wait for a spawned bot to reach "Logged in as ...". */
  bootTimeout: 120000
};

/**
 * The cases. Two per category, excluding developer and nsfw commands.
 *
 * Every invocation here is deliberately read-only or self-targeted: nothing
 * bans, kicks, mutes, purges or spends currency, so the harness is safe to run
 * repeatedly against a real test guild.
 *
 *   category   folder under src/commands (lowercased)
 *   command    what to type after the prefix, may be an alias
 *   covers     command name this case exercises, when it differs from `command`
 *   args       arguments; "{self}" is replaced with the bot's own user id
 *   expect     properties that MUST be observed for the case to pass
 *   degraded   patterns that mean "the command replied, but a third-party
 *              dependency was unavailable" - reported as DEGRADED, not a failure
 *   rejects    the case intentionally triggers a validation/permission refusal,
 *              so a plain-text refusal is the expected result
 */
const CASES = [
  // --- anime -----------------------------------------------------------------
  {
    category: "anime",
    command: "hug",
    args: "",
    expect: { message: true, embed: true, image: true },
    degraded: [/no images available/i],
    note: "reaction gif via nekos.best, falls back to the local image cache"
  },
  {
    category: "anime",
    command: "owoify",
    args: "hello there, testing the harness",
    expect: { message: true, content: true },
    degraded: [/that didn't work/i, /text is too long/i],
    note: "plain text reply from the nekos.life owoify API"
  },

  // --- customization ---------------------------------------------------------
  // Both are invoked with no arguments, which only reports the current setting
  // and never writes to the guild's settings.
  {
    category: "customization",
    command: "prefix",
    args: "",
    expect: { message: true, content: true },
    note: "no arguments: reports the current prefix, does not change it"
  },
  {
    category: "customization",
    command: "modlog",
    args: "",
    expect: { message: true, content: true },
    note: "no arguments: reports the current modlog channel, does not change it"
  },

  // --- economy ---------------------------------------------------------------
  {
    category: "economy",
    command: "balance",
    args: "",
    expect: { message: true, content: true }
  },
  {
    category: "economy",
    command: "leaderboard",
    args: "500",
    expect: { message: true, content: true },
    degraded: [/unable to create a leaderboard/i],
    note: "page 500 is out of range on purpose, so the reply is deterministic whether or not the test guild has economy data"
  },

  // --- fun -------------------------------------------------------------------
  {
    category: "fun",
    command: "8ball",
    covers: "eightball",
    args: "is the test harness working?",
    expect: { message: true, embed: true },
    note: "invoked through an alias, so alias resolution is covered too"
  },
  {
    category: "fun",
    command: "choose",
    args: "yes,no,maybe",
    expect: { message: true, embed: true }
  },

  // --- general ---------------------------------------------------------------
  {
    category: "general",
    command: "ping",
    args: "",
    expect: { message: true, content: true, edited: true },
    note: "replies 'Ping?' then edits the same message to 'Pong!'"
  },
  {
    category: "general",
    command: "help",
    args: "",
    expect: { message: true, embed: true }
  },

  // --- images ----------------------------------------------------------------
  // These need the img-api service on localhost:3030; when it is not running the
  // commands answer with a handled error, which is reported as DEGRADED.
  {
    category: "images",
    command: "beautiful",
    args: "",
    expect: { message: true, embed: true, image: true, attachment: true },
    degraded: [/image generation api/i],
    note: "needs the img-api service on localhost:3030"
  },
  {
    category: "images",
    command: "achievement",
    args: "harness works",
    expect: { message: true, embed: true, image: true, attachment: true },
    degraded: [/image generation api/i],
    note: "needs the img-api service on localhost:3030"
  },

  // --- level -----------------------------------------------------------------
  {
    category: "level",
    command: "profile",
    args: "",
    expect: { message: true, embed: true }
  },
  {
    category: "level",
    command: "levelhelp",
    args: "",
    expect: { message: true, embed: true }
  },

  // --- mod -------------------------------------------------------------------
  {
    category: "mod",
    command: "audit",
    args: "{self}",
    expect: { message: true, embed: true },
    note: "read-only, targets the bot itself; needs Moderate Members"
  },
  {
    category: "mod",
    command: "mute",
    args: "",
    expect: { message: true, content: true },
    rejects: true,
    note: "no member given on purpose: checks the refusal path, mutes nobody"
  }
];

const IMAGE_EXTENSION = /\.(png|jpe?g|gif|webp|apng)(\?|$)/i;

/** Replies that mean the invocation was refused before the command ran. */
const REFUSAL_PATTERNS = [
  /I need the following permission/i,
  /You need the following permission/i,
  /You cannot run this command in this server/i,
  /has disabled this command/i,
  /can only be used by the developers/i,
  /can only be run in NSFW channels/i,
  /can only be used in a server/i
];

/** Replies that mean the command blew up. */
const COMMAND_ERROR_PATTERNS = [
  /threw an error/i,
  /Something went wrong while running/i,
  /^An error occurred\.$/im,
  /does not provide a .?run\(\).? implementation/i
];

/**
 * The bot's canonical "an upstream API failed" reply (lang/en.js error.api).
 * Any command can produce it, and it means a third party is down rather than
 * that the bot regressed, so it counts as degraded everywhere.
 */
const GLOBAL_DEGRADED_PATTERNS = [/error occurred with the service processing your request/i];

const COOLDOWN_PATTERNS = [/still on cooldown/i];
const SUGGESTION_PATTERNS = [/Did you mean/i];

const OUTCOME = {
  PASS: "PASS",
  FAIL: "FAIL",
  TIMEOUT: "TIMEOUT",
  DEGRADED: "DEGRADED",
  BLOCKED: "BLOCKED"
};

/** Outcomes that always mean the run failed. */
const FATAL_OUTCOMES = [OUTCOME.FAIL, OUTCOME.TIMEOUT];
/** Outcomes that only fail the run in --strict mode. */
const SOFT_OUTCOMES = [OUTCOME.DEGRADED, OUTCOME.BLOCKED];

const COLORS = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m"
};

const OUTCOME_COLORS = {
  [OUTCOME.PASS]: COLORS.green,
  [OUTCOME.FAIL]: COLORS.red,
  [OUTCOME.TIMEOUT]: COLORS.red,
  [OUTCOME.DEGRADED]: COLORS.yellow,
  [OUTCOME.BLOCKED]: COLORS.magenta
};

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;

function paint(color, text) {
  return useColor ? `${color}${text}${COLORS.reset}` : String(text);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function truncate(text, max) {
  if (!text) return "";
  const flat = String(text).replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

const HELP = `
uwu bot Discord test harness

  ./tests/discord_harness.js [options]

Options
  --attach              Test an already running dev bot instead of spawning one.
  --spawn               Spawn 'node src/index.js' with NODE_ENV=development (default).
  --only=a,b            Only run cases for these commands.
  --category=a,b        Only run cases for these categories.
  --prefix="uwu "       Invoke with this literal prefix instead of a bot mention.
  --timeout=15000       Milliseconds to wait for the first response.
  --settle=2500         Milliseconds to keep collecting edits and follow-ups.
  --gap=1000            Milliseconds to wait between cases.
  --json=path.json      Write a full JSON report to this path.
  --strict              Treat DEGRADED and BLOCKED outcomes as failures.
  --list                Print the planned cases and exit.
  --verbose             Stream the spawned bot's output and per-response detail.
  --help                Show this message.

Environment
  TOKEN_DEV / TEST_TOKEN   Dev bot token used to log in.
  TEST_CHANNEL             Channel id the harness posts commands in.
  TEST_BOT_ID              Id of the bot under test; defaults to the harness's own id.
`;

function parseArgs(argv) {
  const config = {
    attach: false,
    only: null,
    categories: null,
    prefix: null,
    timeout: DEFAULTS.timeout,
    settle: DEFAULTS.settle,
    gap: DEFAULTS.gap,
    bootTimeout: DEFAULTS.bootTimeout,
    json: null,
    strict: false,
    list: false,
    verbose: false,
    help: false
  };

  const list = (value) =>
    String(value)
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean);

  for (const arg of argv) {
    const [rawKey, ...rest] = arg.split("=");
    const key = rawKey.replace(/^--/, "");
    const value = rest.join("=");

    switch (key) {
      case "attach": config.attach = true; break;
      case "spawn": config.attach = false; break;
      case "only": config.only = list(value); break;
      case "category": config.categories = list(value); break;
      case "prefix": config.prefix = value; break;
      case "timeout": config.timeout = Number(value); break;
      case "settle": config.settle = Number(value); break;
      case "gap": config.gap = Number(value); break;
      case "json": config.json = value; break;
      case "strict": config.strict = true; break;
      case "list": config.list = true; break;
      case "verbose": config.verbose = true; break;
      case "help": case "h": config.help = true; break;
      default:
        throw new Error(`Unknown option '${arg}'. Run with --help for the option list.`);
    }
  }

  for (const numeric of ["timeout", "settle", "gap"]) {
    if (!Number.isFinite(config[numeric]) || config[numeric] < 0) {
      throw new Error(`--${numeric} must be a non-negative number of milliseconds.`);
    }
  }

  return config;
}

function selectCases(config) {
  return CASES.filter((testCase) => {
    if (config.categories && !config.categories.includes(testCase.category)) return false;
    if (config.only) {
      const names = [testCase.command, testCase.covers ?? testCase.command];
      if (!names.some((name) => config.only.includes(name.toLowerCase()))) return false;
    }
    return true;
  });
}

/**
 * Reads src/commands to report which categories exist and how many of their
 * commands are testable, so the case list above is visibly kept honest as
 * commands are added. devOnly is detected by source inspection because loading
 * a command requires a live client.
 * @returns {Array<{category: String, total: Number, testable: Number}>}
 */
function scanCategories() {
  return fs
    .readdirSync(COMMANDS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const files = fs
        .readdirSync(path.join(COMMANDS_DIR, entry.name))
        .filter((file) => file.endsWith(".js"));
      const testable = files.filter((file) => {
        const source = fs.readFileSync(path.join(COMMANDS_DIR, entry.name, file), "utf8");
        return !/devOnly:\s*true/.test(source) && !/nsfw:\s*true/.test(source);
      });
      return {
        category: entry.name.toLowerCase(),
        total: files.length,
        testable: testable.length
      };
    });
}

/**
 * Compares the case list against the commands on disk.
 * @returns {{gaps: Array<String>, exempt: Array<String>, covered: Number}}
 */
function checkCoverage() {
  const gaps = [];
  const exempt = [];
  let covered = 0;

  for (const { category, testable } of scanCategories()) {
    if (EXCLUDED_CATEGORIES.includes(category)) continue;

    const cases = CASES.filter((testCase) => testCase.category === category);
    covered += cases.length;

    if (testable === 0) {
      exempt.push(`${category} (every command is devOnly or nsfw)`);
      continue;
    }

    const wanted = Math.min(2, testable);
    if (cases.length < wanted) {
      gaps.push(`${category}: ${cases.length}/${wanted} cases for ${testable} testable command(s)`);
    }
  }

  return { gaps, exempt, covered };
}

function inspectEmbed(embed) {
  return {
    title: embed.title ?? null,
    description: truncate(embed.description, 400),
    descriptionLength: embed.description ? embed.description.length : 0,
    url: embed.url ?? null,
    imageUrl: embed.image?.url ?? null,
    thumbnailUrl: embed.thumbnail?.url ?? null,
    fieldCount: embed.fields?.length ?? 0,
    footer: embed.footer?.text ?? null,
    color: embed.color ?? null
  };
}

/**
 * Records the observable properties of one message the bot sent.
 * @param {Message} message - The bot's response.
 * @param {Message} probe - The invocation the harness posted.
 */
function inspectMessage(message, probe) {
  const embeds = message.embeds.map(inspectEmbed);
  const attachments = [...message.attachments.values()].map((attachment) => ({
    name: attachment.name ?? null,
    contentType: attachment.contentType ?? null,
    size: attachment.size ?? null,
    isImage:
      Boolean(attachment.contentType?.startsWith("image/")) ||
      IMAGE_EXTENSION.test(attachment.name ?? "")
  }));

  return {
    id: message.id,
    authorId: message.author?.id ?? null,
    content: message.content ?? "",
    hasContent: Boolean(message.content && message.content.trim().length),
    isReplyToProbe: message.reference?.messageId === probe.id,
    embedCount: embeds.length,
    embeds,
    attachmentCount: attachments.length,
    attachments,
    componentCount: message.components?.length ?? 0,
    hasImage:
      embeds.some((embed) => embed.imageUrl || embed.thumbnailUrl) ||
      attachments.some((attachment) => attachment.isImage),
    edited: Boolean(message.editedTimestamp),
    latencyMs: message.createdTimestamp - probe.createdTimestamp
  };
}

/** Every property the harness knows how to observe, in report column order. */
const PROPERTIES = ["message", "content", "embed", "image", "attachment", "edited", "reply"];

/** Column headings for those properties. */
const PROPERTY_HEADERS = {
  message: "MSG",
  content: "TEXT",
  embed: "EMBED",
  image: "IMAGE",
  attachment: "FILE",
  edited: "EDIT",
  reply: "REPLY"
};

function observedProperties(responses) {
  return {
    message: responses.length > 0,
    content: responses.some((response) => response.hasContent),
    embed: responses.some((response) => response.embedCount > 0),
    image: responses.some((response) => response.hasImage),
    attachment: responses.some((response) => response.attachmentCount > 0),
    edited: responses.some((response) => response.edited),
    reply: responses.some((response) => response.isReplyToProbe)
  };
}

/** All text the bot produced, for pattern matching. */
function responseText(responses) {
  const parts = [];
  for (const response of responses) {
    parts.push(response.content);
    for (const embed of response.embeds) {
      parts.push(embed.title ?? "", embed.description ?? "", embed.footer ?? "");
    }
  }
  return parts.filter(Boolean).join("\n");
}

function matchesAny(text, patterns) {
  return (patterns ?? []).some((pattern) => pattern.test(text));
}

/**
 * Turns observed responses into an outcome plus a human readable reason.
 */
function classify(testCase, responses) {
  const observed = observedProperties(responses);
  const text = responseText(responses);
  const expected = testCase.expect ?? { message: true };

  if (!responses.length) {
    return { outcome: OUTCOME.TIMEOUT, observed, reason: "no response from the bot" };
  }

  if (matchesAny(text, SUGGESTION_PATTERNS)) {
    return {
      outcome: OUTCOME.FAIL,
      observed,
      reason: `command not found, bot replied with a suggestion: "${truncate(text, 100)}"`
    };
  }

  if (matchesAny(text, COOLDOWN_PATTERNS)) {
    return { outcome: OUTCOME.DEGRADED, observed, reason: "command was on cooldown" };
  }

  if (matchesAny(text, [...GLOBAL_DEGRADED_PATTERNS, ...(testCase.degraded ?? [])])) {
    return {
      outcome: OUTCOME.DEGRADED,
      observed,
      reason: `handled dependency failure: "${truncate(text, 120)}"`
    };
  }

  if (matchesAny(text, COMMAND_ERROR_PATTERNS)) {
    return {
      outcome: OUTCOME.FAIL,
      observed,
      reason: `command threw: "${truncate(text, 160)}"`
    };
  }

  if (matchesAny(text, REFUSAL_PATTERNS)) {
    if (testCase.rejects) {
      return { outcome: OUTCOME.PASS, observed, reason: `refused as expected: "${truncate(text, 100)}"` };
    }
    return {
      outcome: OUTCOME.BLOCKED,
      observed,
      reason: `invocation was refused: "${truncate(text, 120)}"`
    };
  }

  if (testCase.rejects) {
    return observed.content
      ? { outcome: OUTCOME.PASS, observed, reason: `refused as expected: "${truncate(text, 100)}"` }
      : { outcome: OUTCOME.FAIL, observed, reason: "expected a text refusal, got none" };
  }

  const missing = Object.keys(expected).filter((key) => expected[key] && !observed[key]);
  if (missing.length) {
    return {
      outcome: OUTCOME.FAIL,
      observed,
      missing,
      reason: `missing expected propert${missing.length === 1 ? "y" : "ies"}: ${missing.join(", ")}`
    };
  }

  return { outcome: OUTCOME.PASS, observed, reason: null };
}

class Harness {
  constructor(config) {
    this.config = config;
    this.client = null;
    this.channel = null;
    this.botUserId = null;
    this.prefix = null;
    this.child = null;
    this.botOutput = [];
    this.botExit = null;
    /** Messages seen in the test channel since the last reset. */
    this.inbox = [];
  }

  log(message) {
    console.log(message);
  }

  debug(message) {
    if (this.config.verbose) console.log(paint(COLORS.dim, message));
  }

  /** Spawns the instance under test and resolves once it has logged in. */
  spawnBot() {
    return new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [path.join("src", "index.js")], {
        cwd: ROOT,
        env: { ...process.env, NODE_ENV: "development" },
        stdio: ["ignore", "pipe", "pipe"]
      });

      let settled = false;
      const finish = (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (error) reject(error);
        else resolve(child);
      };

      const timer = setTimeout(
        () => {
          child.kill("SIGKILL");
          finish(new Error(`the bot did not log in within ${this.config.bootTimeout} ms`));
        },
        this.config.bootTimeout
      );

      const onOutput = (chunk) => {
        const text = chunk.toString();
        this.botOutput.push(...text.split("\n").filter(Boolean));
        if (this.botOutput.length > 60) this.botOutput = this.botOutput.slice(-60);
        if (this.config.verbose) {
          process.stdout.write(
            text
              .split("\n")
              .filter(Boolean)
              .map((line) => `${paint(COLORS.dim, "[bot]")} ${line}\n`)
              .join("")
          );
        }
        if (/Logged in as .+\(\d+\)/.test(text)) finish(null);
      };

      child.stdout.on("data", onOutput);
      child.stderr.on("data", onOutput);
      child.on("error", (error) => finish(error));
      child.on("exit", (code, signal) => {
        this.botExit = { code, signal };
        finish(new Error(`the bot exited during startup (code ${code}, signal ${signal})`));
      });

      this.child = child;
    });
  }

  async stopBot() {
    if (!this.child || this.botExit) return;
    const child = this.child;
    const exited = new Promise((resolve) => child.once("exit", resolve));
    child.kill("SIGTERM");
    const timer = sleep(5000).then(() => "timeout");
    if ((await Promise.race([exited, timer])) === "timeout") child.kill("SIGKILL");
  }

  async connect(token) {
    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
      ],
      partials: [Partials.Channel]
    });

    client.on(Events.MessageCreate, (message) => {
      if (message.channelId !== process.env.TEST_CHANNEL) return;
      this.inbox.push(message);
    });

    const ready = new Promise((resolve, reject) => {
      client.once(Events.ClientReady, resolve);
      client.once(Events.Error, reject);
    });

    try {
      await client.login(token);
      await ready;
    } catch (error) {
      const detail = error.message || error.name || String(error);
      throw new Error(`the harness could not log in (${detail}); check TOKEN_DEV / TEST_TOKEN`);
    }

    this.client = client;
    this.botUserId = process.env.TEST_BOT_ID || client.user.id;

    const channel = await client.channels.fetch(process.env.TEST_CHANNEL);
    if (!channel) throw new Error(`could not fetch TEST_CHANNEL ${process.env.TEST_CHANNEL}`);
    if (!channel.isTextBased()) throw new Error("TEST_CHANNEL is not a text channel");
    this.channel = channel;
  }

  /**
   * Collects the bot's responses to a probe message.
   * @param {Message} probe - The invocation the harness posted.
   * @returns {Promise<Array<Object>>} Inspected responses, oldest first.
   */
  async collectResponses(probe) {
    const isResponse = (message) => message.id !== probe.id && message.author?.id === this.botUserId;
    const deadline = Date.now() + this.config.timeout;

    while (Date.now() < deadline && !this.inbox.some(isResponse)) {
      await sleep(100);
    }
    if (!this.inbox.some(isResponse)) return [];

    // Give the bot room to edit its reply (ping) or send follow-ups.
    await sleep(this.config.settle);

    const seen = this.inbox.filter(isResponse);
    // Re-fetch so edits made during the settle window are reflected.
    const final = await Promise.all(
      seen.map((message) => this.channel.messages.fetch(message.id).catch(() => message))
    );

    return final
      .map((message) => inspectMessage(message, probe))
      .sort((a, b) => a.latencyMs - b.latencyMs);
  }

  /**
   * Sends a bare mention to confirm the bot is alive and to learn the prefix
   * this guild actually uses, which may be a custom one.
   */
  async preflight() {
    this.inbox = [];
    const probe = await this.channel.send(`<@${this.botUserId}>`);
    const responses = await this.collectResponses(probe);

    if (!responses.length) {
      throw new Error(
        [
          "the bot did not answer a bare mention in TEST_CHANNEL.",
          "  - is the bot running with NODE_ENV=development? (bot authors are ignored otherwise)",
          "  - can it read and send messages, and embed links, in that channel?",
          `  - is TEST_BOT_ID (${this.botUserId}) the bot under test?`
        ].join("\n")
      );
    }

    const text = responseText(responses);
    const match = /Run ``(.*?)help``/.exec(text);
    const prefix = this.config.prefix ?? (match ? match[1] : "uwu ");
    this.debug(`preflight reply: ${truncate(text, 160)}`);
    return { prefix, detected: match ? match[1] : null };
  }

  async runCase(testCase) {
    const args = (testCase.args ?? "").replace(/\{self\}/g, this.botUserId).trim();
    const invocation = `${this.prefix}${testCase.command}${args ? ` ${args}` : ""}`;

    this.inbox = [];
    const started = Date.now();
    const probe = await this.channel.send(invocation);
    const responses = await this.collectResponses(probe);
    const { outcome, observed, reason, missing } = classify(testCase, responses);

    return {
      category: testCase.category,
      command: testCase.command,
      covers: testCase.covers ?? testCase.command,
      invocation,
      note: testCase.note ?? null,
      rejects: Boolean(testCase.rejects),
      expected: testCase.expect ?? { message: true },
      observed,
      missing: missing ?? [],
      outcome,
      reason,
      responseCount: responses.length,
      latencyMs: responses.length ? responses[0].latencyMs : null,
      elapsedMs: Date.now() - started,
      responses
    };
  }

  async run(cases) {
    const results = [];

    for (const [index, testCase] of cases.entries()) {
      const label = `${testCase.category}/${testCase.command}`;
      process.stdout.write(paint(COLORS.dim, `[${index + 1}/${cases.length}] ${label} ... `));

      let result;
      try {
        result = await this.runCase(testCase);
      } catch (error) {
        result = {
          category: testCase.category,
          command: testCase.command,
          covers: testCase.covers ?? testCase.command,
          invocation: `${this.prefix}${testCase.command}`,
          note: testCase.note ?? null,
          expected: testCase.expect ?? { message: true },
          observed: observedProperties([]),
          missing: [],
          outcome: OUTCOME.FAIL,
          reason: `harness error: ${error.message}`,
          responseCount: 0,
          latencyMs: null,
          elapsedMs: null,
          responses: []
        };
      }

      console.log(paint(OUTCOME_COLORS[result.outcome], result.outcome));
      if (this.config.verbose) {
        for (const response of result.responses) {
          this.debug(
            `      -> ${response.latencyMs}ms content=${JSON.stringify(truncate(response.content, 80))} ` +
              `embeds=${response.embedCount} attachments=${response.attachmentCount} ` +
              `image=${response.hasImage} edited=${response.edited}`
          );
        }
      }

      results.push(result);
      if (index < cases.length - 1) await sleep(this.config.gap);
    }

    return results;
  }

  async destroy() {
    if (this.client) await this.client.destroy();
    await this.stopBot();
  }
}

function renderTable(results) {
  const cell = (expected, observed) => {
    if (expected) return observed ? "y" : "N";
    return observed ? "y" : "-";
  };

  const rows = results.map((result) => [
    result.category,
    result.command,
    result.outcome,
    result.latencyMs === null ? "-" : `${result.latencyMs}`,
    ...PROPERTIES.map((property) => cell(result.expected[property], result.observed[property]))
  ]);

  const header = ["CATEGORY", "COMMAND", "OUTCOME", "MS", ...PROPERTIES.map((p) => PROPERTY_HEADERS[p])];
  const widths = header.map((title, column) =>
    Math.max(title.length, ...rows.map((row) => String(row[column]).length))
  );
  const line = (cells, colorize) =>
    cells
      .map((value, column) => {
        const text = String(value).padEnd(widths[column]);
        return colorize && column === 2 ? paint(OUTCOME_COLORS[value] ?? "", text) : text;
      })
      .join("  ")
      .trimEnd();

  console.log("");
  console.log(paint(COLORS.bold, line(header, false)));
  for (const row of rows) console.log(line(row, true));
  console.log(paint(COLORS.dim, "\ny = observed   N = expected but missing   - = not expected, not seen"));
}

function renderDetails(results) {
  const notable = results.filter((result) => result.outcome !== OUTCOME.PASS || result.reason);
  if (!notable.length) return;

  console.log("");
  console.log(paint(COLORS.bold, "Details"));
  for (const result of notable) {
    console.log(
      `  ${paint(OUTCOME_COLORS[result.outcome], result.outcome.padEnd(8))} ` +
        `${result.category}/${result.command}  ${paint(COLORS.dim, `(${result.invocation})`)}`
    );
    if (result.reason) console.log(`    ${result.reason}`);
    if (result.note) console.log(paint(COLORS.dim, `    note: ${result.note}`));
  }
}

function renderSummary(results, config) {
  const counts = {};
  for (const result of results) counts[result.outcome] = (counts[result.outcome] ?? 0) + 1;

  const parts = Object.values(OUTCOME)
    .filter((outcome) => counts[outcome])
    .map((outcome) => paint(OUTCOME_COLORS[outcome], `${counts[outcome]} ${outcome.toLowerCase()}`));

  console.log("");
  console.log(`${paint(COLORS.bold, "Summary:")} ${results.length} case(s) - ${parts.join(", ")}`);

  const failed = results.filter(
    (result) =>
      FATAL_OUTCOMES.includes(result.outcome) ||
      (config.strict && SOFT_OUTCOMES.includes(result.outcome))
  );

  if (counts[OUTCOME.BLOCKED]) {
    console.log(
      paint(
        COLORS.dim,
        "Blocked cases were refused before running; grant the bot the listed permissions in the test guild."
      )
    );
  }
  if (counts[OUTCOME.DEGRADED]) {
    console.log(
      paint(COLORS.dim, "Degraded cases replied, but an external dependency was unavailable.")
    );
  }

  return failed.length;
}

function writeJson(target, payload) {
  const file = path.resolve(process.cwd(), target);
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(paint(COLORS.dim, `\nJSON report written to ${file}`));
}

function printList(cases) {
  console.log(paint(COLORS.bold, `Planned cases (${cases.length})`));
  let category = null;
  for (const testCase of cases) {
    if (testCase.category !== category) {
      category = testCase.category;
      console.log(`\n  ${paint(COLORS.blue, category)}`);
    }
    const args = testCase.args ? ` ${testCase.args}` : "";
    const expects = Object.keys(testCase.expect ?? {}).join(", ");
    console.log(`    ${testCase.command}${args}`);
    console.log(paint(COLORS.dim, `      expects: ${expects}${testCase.rejects ? " (refusal expected)" : ""}`));
    if (testCase.note) console.log(paint(COLORS.dim, `      note: ${testCase.note}`));
  }
}

function reportCoverage(coverage) {
  for (const entry of coverage.exempt) {
    console.log(paint(COLORS.dim, `Skipping category ${entry}.`));
  }
  for (const gap of coverage.gaps) {
    console.log(paint(COLORS.yellow, `Coverage gap: ${gap}`));
  }
}

async function main() {
  const config = parseArgs(process.argv.slice(2));

  if (config.help) {
    console.log(HELP.trim());
    return 0;
  }

  const cases = selectCases(config);
  if (!cases.length) throw new Error("no cases matched the given --only/--category filters.");

  const coverage = checkCoverage();

  if (config.list) {
    printList(cases);
    console.log("");
    reportCoverage(coverage);
    return 0;
  }

  const token = process.env.TEST_TOKEN || process.env.TOKEN_DEV;
  if (!token) throw new Error("TOKEN_DEV (or TEST_TOKEN) is not set; the harness only ever uses the dev bot.");
  if (!process.env.TEST_CHANNEL) throw new Error("TEST_CHANNEL is not set; point it at a channel the dev bot can post in.");
  if (process.env.NODE_ENV === "production") {
    throw new Error("refusing to run with NODE_ENV=production; the harness is a development-only tool.");
  }

  const harness = new Harness(config);
  let exitCode = 0;

  try {
    reportCoverage(coverage);

    if (!config.attach) {
      console.log(paint(COLORS.dim, "Starting the bot (NODE_ENV=development) ..."));
      try {
        await harness.spawnBot();
      } catch (error) {
        console.log(paint(COLORS.red, `Could not start the bot: ${error.message}`));
        if (harness.botOutput.length) {
          console.log(paint(COLORS.dim, "Last output from the bot:"));
          for (const line of harness.botOutput.slice(-20)) console.log(paint(COLORS.dim, `  ${line}`));
        }
        throw error;
      }
      console.log(paint(COLORS.dim, "Bot is logged in."));
    } else {
      console.log(paint(COLORS.dim, "Attaching to an already running bot."));
    }

    await harness.connect(token);
    console.log(
      paint(
        COLORS.dim,
        `Harness logged in as ${harness.client.user.tag}; testing bot ${harness.botUserId} in #${harness.channel.name}.`
      )
    );

    const { prefix, detected } = await harness.preflight();
    harness.prefix = prefix;
    console.log(
      paint(
        COLORS.dim,
        `Using prefix ${JSON.stringify(prefix)}${detected ? " (reported by the bot)" : " (default)"}.\n`
      )
    );

    const results = await harness.run(cases);

    renderTable(results);
    renderDetails(results);
    const failures = renderSummary(results, config);

    if (harness.botExit) {
      console.log(
        paint(COLORS.red, `The bot process exited during the run (code ${harness.botExit.code}).`)
      );
      exitCode = 1;
    }

    if (config.json) {
      writeJson(config.json, {
        generatedAt: new Date().toISOString(),
        prefix,
        botUserId: harness.botUserId,
        channelId: process.env.TEST_CHANNEL,
        config: {
          attach: config.attach,
          timeout: config.timeout,
          settle: config.settle,
          gap: config.gap,
          strict: config.strict
        },
        coverage,
        results
      });
    }

    if (failures) exitCode = 1;
  } finally {
    await harness.destroy();
  }

  return exitCode;
}

if (require.main === module) {
  main()
    .then((code) => process.exit(code))
    .catch((error) => {
      console.error(paint(COLORS.red, `\nHarness failed: ${error.message}`));
      if (process.env.HARNESS_TRACE) console.error(error);
      process.exit(1);
    });
}

// Exported so the pure parts can be exercised without a Discord connection,
// see tests/harness_selftest.js.
module.exports = {
  CASES,
  OUTCOME,
  PROPERTIES,
  checkCoverage,
  classify,
  inspectMessage,
  observedProperties,
  parseArgs,
  renderDetails,
  renderSummary,
  renderTable,
  selectCases
};
