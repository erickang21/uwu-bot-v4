#!/usr/bin/env node
"use strict";

/**
 * uwu bot offline command harness.
 *
 * Runs a command's real `execute()` against a fake Discord context and prints
 * the payload it would have sent, so command output can be inspected without a
 * token, a database, a network connection or a test server.
 *
 * It is not an assertion suite. It answers "what does this command produce right
 * now, and did it blow up doing it", which is what you need in order to judge
 * whether a change broke something.
 *
 * How it works
 * ------------
 * - Instantiates the real UwUClient without logging in, and loads all commands
 *   through the real CommandStore, so categories, aliases, options and the real
 *   argument parser are all in play.
 *   `client.db` is swapped for an in-memory stand-in, so the real Settings class
 *   (cache, mergeDefault, upserts) runs unchanged and every write is recorded
 *   instead of persisted.
 * - Stubs the external API helpers (nekos.best, waifu.pics, nekos.life,
 *   otakugifs, waifu.im, purrbot, gelbooru, the local image cache and img-api)
 *   with deterministic responses, so a run is repeatable and offline. Pass
 *   --live to call the real endpoints instead.
 * - Synthesises one sample argument per declared option, by type, so commands
 *   run down their normal path rather than their "you forgot an argument" path.
 * - Builds a real CommandContext around a fake message whose reply/edit/send
 *   methods record the payload instead of sending it.
 *
 * Usage
 * -----
 *   ./tests/offline_harness.js                     every command (dev-only excluded)
 *   ./tests/offline_harness.js --sweep             one command per category
 *   ./tests/offline_harness.js --only=hug,ping     specific commands or aliases
 *   ./tests/offline_harness.js --category=anime    one category
 *   ./tests/offline_harness.js --only=hug --dump   full payload JSON
 *   ./tests/offline_harness.js --help              all options
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");

const { Collection, PermissionsBitField } = require("discord.js");
const { DEVS } = require(path.join(SRC, "utils/constants.js"));

/** Snowflake-shaped ids, so the real argument parser accepts them. */
const IDS = {
  bot: "900000000000000001",
  author: "900000000000000002",
  target: "900000000000000003",
  guild: "900000000000000004",
  channel: "900000000000000005",
  role: "900000000000000006",
  modlog: "900000000000000007",
  staffRole: "900000000000000008"
};

const AVATAR = "https://cdn.discordapp.com/embed/avatars/0.png";
const STUB_GIF = "https://cdn.example.invalid/stub.gif";
const STUB_IMAGE_PATH = "/stub/images/sample.gif";

const RESULT = {
  OK: "OK",
  NO_OUTPUT: "NO_OUTPUT",
  REJECTED: "REJECTED",
  ERROR: "ERROR"
};

/** Results that mean the run failed. */
const FATAL_RESULTS = [RESULT.ERROR, RESULT.NO_OUTPUT];

const COLORS = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m"
};

const RESULT_COLORS = {
  [RESULT.OK]: COLORS.green,
  [RESULT.NO_OUTPUT]: COLORS.red,
  [RESULT.REJECTED]: COLORS.yellow,
  [RESULT.ERROR]: COLORS.red
};

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;

function paint(color, text) {
  return useColor ? `${color}${text}${COLORS.reset}` : String(text);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function truncate(text, max) {
  if (text === null || text === undefined) return "";
  const flat = String(text).replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

const HELP = `
uwu bot offline command harness

  ./tests/offline_harness.js [options]

Selection
  --only=a,b          Run these commands (names or aliases).
  --category=a,b      Run these categories.
  --sweep             Run one command per category.
  --list              List what would run, then exit.

Inputs
  --minimal           Only fill required options, leave optional ones empty.
  --junk              Pass nonsense for every string option, to find commands
                      that answer invalid input with silence.
  --empty             Start with empty settings instead of seeded ones.
  --unsharded         Set client.shard to null, as \`npm run dev\` does.
  --live              Call the real external APIs instead of stubbing them.
  --no-nsfw           Skip nsfw commands (they are included by default).

Output
  --dump              Print the full payload JSON for every command.
  --json=path         Write a machine readable report.
  --verbose           Show the bot's own log output and stub API calls.
  --settle=50         Milliseconds to wait for unawaited sends after execute().
  --help              Show this message.

Developer-only commands are always skipped: they gate on a developer id and
include things (eval, exec, reboot) that should not be run by a test.
`;

function parseArgs(argv) {
  const config = {
    only: null,
    categories: null,
    sweep: false,
    list: false,
    minimal: false,
    junk: false,
    empty: false,
    unsharded: false,
    live: false,
    nsfw: true,
    dump: false,
    json: null,
    verbose: false,
    settle: 50,
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
      case "only": config.only = list(value); break;
      case "category": config.categories = list(value); break;
      case "sweep": config.sweep = true; break;
      case "list": config.list = true; break;
      case "minimal": config.minimal = true; break;
      case "junk": config.junk = true; break;
      case "empty": config.empty = true; break;
      case "unsharded": config.unsharded = true; break;
      case "live": config.live = true; break;
      case "no-nsfw": config.nsfw = false; break;
      case "dump": config.dump = true; break;
      case "json": config.json = value; break;
      case "verbose": config.verbose = true; break;
      case "settle": config.settle = Number(value); break;
      case "help": case "h": config.help = true; break;
      default:
        throw new Error(`Unknown option '${arg}'. Run with --help for the option list.`);
    }
  }

  if (!Number.isFinite(config.settle) || config.settle < 0) {
    throw new Error("--settle must be a non-negative number of milliseconds.");
  }

  return config;
}

// --- the fake world ---------------------------------------------------------

/**
 * An in-memory stand-in for the handful of MongoDB methods Settings uses.
 * findOneAndUpdate returns the driver v4 shape ({ value }), which is what
 * Settings#update destructures.
 * @param {Array} writes - Every upsert is appended here.
 */
function createDatabase(writes) {
  const collections = new Map();
  const collection = (name) => {
    if (!collections.has(name)) collections.set(name, new Map());
    return collections.get(name);
  };

  return {
    collections,
    reset() {
      collections.clear();
    },
    collection(name) {
      const docs = collection(name);
      return {
        async findOne(query) {
          return docs.get(query._id) ?? null;
        },
        async findOneAndUpdate(query, update) {
          const changes = update.$set ?? {};
          const value = { ...(docs.get(query._id) ?? { _id: query._id }), ...changes };
          docs.set(query._id, value);
          writes.push({ collection: name, id: query._id, keys: Object.keys(changes) });
          return { value };
        },
        async insertOne(doc) {
          docs.set(doc._id, doc);
          writes.push({ collection: name, id: doc._id, keys: Object.keys(doc) });
          return { acknowledged: true, insertedId: doc._id };
        },
        async deleteOne(query) {
          const existed = docs.delete(query._id);
          return { deletedCount: existed ? 1 : 0 };
        },
        find() {
          return {
            async *[Symbol.asyncIterator]() {
              for (const doc of docs.values()) yield doc;
            },
            async toArray() {
              return [...docs.values()];
            }
          };
        }
      };
    }
  };
}

/**
 * Replaces the external API helpers with deterministic offline responses.
 * Must run before the commands are loaded: each command destructures the
 * helpers it uses at require time, so it captures whatever is on the exports
 * object then.
 * @param {Function} record - Called with (service, detail) per stubbed call.
 */
function stubExternalApis(record) {
  const anime = require(path.join(SRC, "helpers/anime.js"));
  const images = require(path.join(SRC, "helpers/images.js"));
  const api = require(path.join(SRC, "helpers/api.js"));
  const undici = require("undici");

  const gif = (name) => `https://cdn.example.invalid/${name}.gif`;

  // A few commands call undici directly (rizz, lewdneko, trap, waifu). One body
  // shape cannot match every endpoint, so this is deliberately a superset of the
  // fields those callers read; a caller that reads something else will show up as
  // an error, which is the point.
  const genericBody = () => ({
    url: STUB_GIF,
    link: STUB_GIF,
    text: "stubbed pickup line",
    results: [{ url: STUB_GIF, anime_name: "Sample Anime" }],
    items: [{ url: STUB_GIF, dominantColor: "#8bb7dd" }]
  });

  undici.request = async (url) => {
    record("http", String(url));
    const body = genericBody();
    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: {
        async json() {
          return body;
        },
        async text() {
          return JSON.stringify(body);
        }
      }
    };
  };

  // Shapes mirror src/helpers/anime.js exactly: some helpers resolve to a bare
  // url string, others to an object, and the nekos.best/waifu.im/purrbot ones
  // resolve to { url: null } on failure rather than throwing.
  anime.getNekosBestAPI = async (endpoint) => {
    record("nekos.best", endpoint);
    return { url: gif(endpoint), animeName: "Sample Anime" };
  };
  anime.waifuAPI = async (endpoint) => {
    record("waifu.pics", endpoint);
    return gif(endpoint);
  };
  anime.nekoAPI = async (endpoint) => {
    record("nekos.life", endpoint);
    return gif(endpoint);
  };
  anime.otakuAPI = async (endpoint) => {
    record("otakugifs", endpoint);
    return gif(endpoint);
  };
  anime.getWaifuIm = async (options) => {
    record("waifu.im", JSON.stringify(options));
    return { url: gif("waifu-im"), dominantColor: "#8bb7dd" };
  };
  anime.getPurrbotAPI = async (endpoint) => {
    record("purrbot", endpoint);
    return { url: gif(endpoint) };
  };
  anime.gelbooruAPI = async (tags) => {
    record("gelbooru", (tags ?? []).join(" "));
    return gif("gelbooru");
  };

  // The local image cache normally reads production-only directories.
  images.loadSFWImages = async () => {};
  images.loadNSFWImages = async () => {};
  images.getRandomSFWImage = async (command) => {
    record("image cache (sfw)", command);
    return STUB_IMAGE_PATH;
  };
  images.getRandomNSFWImage = async (command) => {
    record("image cache (nsfw)", command);
    return STUB_IMAGE_PATH;
  };

  api.get = async (url) => {
    record("http", url);
    if (url.includes("owoify")) return { owo: "hewwo thewe~ (stubbed)" };
    return { url: STUB_GIF };
  };
}

/**
 * Builds the fake guild, channel, users and member the commands run against.
 * Every mutating method records the call rather than performing it.
 */
function createWorld(client, recorder) {
  const call = (name, ...args) => {
    recorder.calls.push({ name, args: args.map((arg) => truncate(inspectValue(arg), 120)) });
  };

  const makeUser = (id, username, bot = false) => ({
    id,
    bot,
    username,
    globalName: username,
    discriminator: "0",
    tag: `${username}#0000`,
    displayName: username,
    createdTimestamp: Date.UTC(2020, 0, 1),
    displayAvatarURL: () => AVATAR,
    avatarURL: () => AVATAR,
    toString: () => `<@${id}>`,
    async send(payload) {
      recorder.sends.push({ via: "author.send", payload });
      return makeSentMessage(payload);
    }
  });

  const botUser = makeUser(IDS.bot, "uwu bot", true);
  const author = makeUser(IDS.author, "HarnessAuthor");
  const target = makeUser(IDS.target, "HarnessTarget");

  // Two roles at different heights: moderation commands compare the invoker's
  // highest role against the target's, so a flat hierarchy would make every mod
  // command refuse and its real path would never run.
  const role = { id: IDS.role, name: "Testers", position: 1, editable: true, toString: () => `<@&${IDS.role}>` };
  const staffRole = { id: IDS.staffRole, name: "Staff", position: 10, editable: true, toString: () => `<@&${IDS.staffRole}>` };

  const roles = new Collection([
    [role.id, role],
    [staffRole.id, staffRole]
  ]);

  const makeMember = (user, highest = role) => ({
    id: user.id,
    user,
    nickname: null,
    displayName: user.username,
    joinedTimestamp: Date.UTC(2021, 0, 1),
    manageable: true,
    moderatable: true,
    kickable: true,
    bannable: true,
    communicationDisabledUntilTimestamp: null,
    permissions: new PermissionsBitField(PermissionsBitField.All),
    roles: {
      cache: new Collection([[highest.id, highest]]),
      highest,
      add: (...args) => call("member.roles.add", ...args),
      remove: (...args) => call("member.roles.remove", ...args)
    },
    displayAvatarURL: () => AVATAR,
    avatarURL: () => AVATAR,
    toString: () => `<@${user.id}>`,
    async timeout(...args) { call("member.timeout", ...args); },
    async kick(...args) { call("member.kick", ...args); },
    async ban(...args) { call("member.ban", ...args); },
    async send(payload) {
      recorder.sends.push({ via: "member.send", payload });
      return makeSentMessage(payload);
    }
  });

  const authorMember = makeMember(author, staffRole);
  const targetMember = makeMember(target, role);
  const botMember = makeMember(botUser, staffRole);
  const members = new Collection([
    [author.id, authorMember],
    [target.id, targetMember],
    [botUser.id, botMember]
  ]);

  function makeSentMessage(payload) {
    const sent = {
      id: `${Date.now()}`,
      content: payload?.content ?? (typeof payload === "string" ? payload : ""),
      embeds: payload?.embeds ?? [],
      createdTimestamp: Date.now() + 25,
      async edit(next) {
        recorder.sends.push({ via: "edit", payload: next });
        return sent;
      },
      async delete() {
        call("message.delete");
      },
      async react(...args) {
        call("message.react", ...args);
      }
    };
    return sent;
  }

  const permissions = new PermissionsBitField(PermissionsBitField.All);

  const channel = {
    id: IDS.channel,
    name: "harness",
    type: 0,
    nsfw: true,
    parentId: null,
    isTextBased: () => true,
    isThread: () => false,
    permissionsFor: () => permissions,
    toString: () => `<#${IDS.channel}>`,
    async send(payload) {
      recorder.sends.push({ via: "channel.send", payload });
      return makeSentMessage(payload);
    },
    async sendTyping() {
      call("channel.sendTyping");
    },
    async bulkDelete(...args) {
      call("channel.bulkDelete", ...args);
      return new Collection();
    },
    async createWebhook(...args) {
      call("channel.createWebhook", ...args);
      return {
        async send(payload) {
          recorder.sends.push({ via: "webhook.send", payload });
          return makeSentMessage(payload);
        },
        async delete() {
          call("webhook.delete");
        }
      };
    },
    // Nothing types back at the harness, so a collector always times out. With
    // errors: ["time"] discord.js rejects on timeout rather than resolving
    // empty, and commands rely on that difference.
    async awaitMessages(options = {}) {
      call("channel.awaitMessages", options);
      if (options.errors?.includes("time")) throw new Collection();
      return new Collection();
    },
    messages: {
      async fetch() {
        return new Collection();
      }
    }
  };

  const guild = {
    id: IDS.guild,
    name: "Harness Guild",
    memberCount: 3,
    ownerId: author.id,
    ownerID: author.id,
    createdTimestamp: Date.UTC(2019, 0, 1),
    iconURL: () => AVATAR,
    shard: { id: 0 },
    async fetchOwner() {
      return authorMember;
    },
    members: {
      cache: members,
      me: botMember,
      async fetch(idOrUser) {
        const id = typeof idOrUser === "string" ? idOrUser : idOrUser?.id;
        const member = members.get(id);
        if (!member) throw new Error(`fake guild has no member ${id}`);
        return member;
      }
    },
    roles: {
      cache: roles,
      everyone: role,
      async fetch(id) {
        return id ? roles.get(id) : roles;
      }
    },
    channels: {
      cache: new Collection([[channel.id, channel]]),
      async fetch(id) {
        return id === channel.id ? channel : null;
      }
    },
    bans: {
      async fetch() {
        throw new Error("Unknown Ban");
      },
      async create(...args) {
        call("guild.bans.create", ...args);
      },
      async remove(...args) {
        call("guild.bans.remove", ...args);
      }
    }
  };

  // Real client, real Collections, only the I/O boundary replaced.
  client.user = botUser;
  client.token = "harness.token.stub";
  client.readyTimestamp = Date.now() - 3_600_000;
  client.ws = { ping: 42, status: 0 };
  client.users.cache.set(author.id, author);
  client.users.cache.set(target.id, target);
  client.users.cache.set(botUser.id, botUser);
  client.guilds.cache.set(guild.id, guild);
  client.channels.cache.set(channel.id, channel);

  // Commands fetch ids the harness never invented (stats fetches the developer
  // list), so unknown ids resolve to a synthetic user rather than throwing.
  client.users.fetch = async (id) => {
    const key = typeof id === "string" ? id : id?.id;
    if (!client.users.cache.has(key)) {
      client.users.cache.set(key, makeUser(key, `User${String(key).slice(-4)}`));
    }
    return client.users.cache.get(key);
  };
  client.channels.fetch = async (id) => client.channels.cache.get(id) ?? null;

  client.imgapi = new Proxy(
    {},
    {
      get: (_target, property) => async (...args) => {
        call(`imgapi.${String(property)}`, ...args);
        return Buffer.from("stub-image-bytes");
      }
    }
  );

  client.topgg = {
    async hasVoted(id) {
      call("topgg.hasVoted", id);
      return true;
    }
  };

  client.analyticsManager = {
    commandUsage: {},
    async commandUsed(...args) {
      call("analytics.commandUsed", ...args);
    },
    async getServerCount() {
      return { count: 1234, increase: 5, decrease: 2 };
    },
    getInterval: () => "0-9"
  };

  return { botUser, author, target, authorMember, targetMember, guild, channel, role, makeSentMessage };
}

/** A fake shard manager that evaluates broadcasts against the local client. */
function createShard(client) {
  return {
    ids: [0],
    count: 1,
    async broadcastEval(fn, options = {}) {
      return [await fn.call(client, client, options.context)];
    },
    async fetchClientValues(property) {
      const value = property.split(".").reduce((carry, key) => carry?.[key], client);
      return [value];
    },
    async send() {}
  };
}

/**
 * Puts settings back to a known state. Commands are run in one process and some
 * of them write, so without this a run would depend on its own order.
 */
async function resetState(client, world, config) {
  client.db.reset();
  for (const settings of Object.values(client.settings)) settings.cache.clear();
  if (!config.empty) await seedSettings(client, world);
}

/** Seeds settings so read paths render populated output, not empty states. */
async function seedSettings(client, world) {
  await client.settings.guilds.update(world.guild.id, {
    prefix: null,
    modlog: IDS.modlog,
    economy: { [world.author.id]: 1250, [world.target.id]: 640 },
    economyIcon: ":banana:",
    auditLog: {
      [world.target.id]: [
        {
          action: "warn",
          moderator: world.author.id,
          reason: "seeded harness entry",
          timestamp: Date.now() - 86_400_000
        }
      ]
    }
  });

  for (const user of [world.author, world.target]) {
    await client.settings.users.update(user.id, {
      level: 7,
      exp: 120,
      multiplier: 2,
      // Expired, so cooldown-gated commands run their real path.
      dailyCooldown: Date.now() - 86_400_000,
      icons: [],
      notify: true,
      guilds: [world.guild.id]
    });
  }
}

// --- sample arguments -------------------------------------------------------

function sampleString(option, config) {
  if (option.choices?.length) return String(option.choices[0].value);
  if (config.junk) return "zzznonsense";

  const hint = `${option.name} ${option.description ?? ""}`.toLowerCase();
  // Order matters: an option named "command" is often described in terms of
  // enabling or disabling something, and the name is the better signal.
  if (/\bcommand\b/.test(hint)) return "hug";
  if (/prefix/.test(hint)) return "??";
  if (/currency|icon|emoji/.test(hint)) return "🍌";
  // on/off toggles: "sample" would fall through to the invalid-usage branch.
  if (/\bon\/off\b|\baction\b|toggle|enable|disable/.test(hint)) return "on";
  if (/time|duration|how long/.test(hint)) return "10m";
  if (/reason/.test(hint)) return "harness sample reason";
  if (/choices/.test(hint)) return "pizza,sushi,tacos";
  if (/question/.test(hint)) return "does the harness work?";
  if (/showid|true\/false|yes\/no/.test(hint)) return "false";
  if (/filter|entry|type/.test(hint)) return "warn";
  if (/tags?\b/.test(hint)) return "sample";
  if (/text|message|content|phrase|word|say/.test(hint)) return "sample harness text";
  return "sample";
}

function sampleInteger(option) {
  const hint = `${option.name} ${option.description ?? ""}`.toLowerCase();
  if (/page/.test(hint)) return 1;
  if (/limit|amount|count|credits|bet/.test(hint)) return 1;
  return 1;
}

/**
 * One sample value per declared option, by type.
 * @returns {{args: Array<String>, described: Array<String>}}
 */
function sampleArgs(command, world, config) {
  const args = [];
  const described = [];
  const options = typeof command.options === "function" ? [] : command.options;

  for (const option of options) {
    if (config.minimal && !option.required) continue;

    let value;
    switch (option.type) {
      case "user":
      case "member":
        value = `<@${world.target.id}>`;
        break;
      case "channel":
        value = `<#${world.channel.id}>`;
        break;
      case "role":
        value = world.role.name.toLowerCase();
        break;
      case "integer":
        value = String(sampleInteger(option));
        break;
      case "string":
        value = sampleString(option, config);
        break;
      default:
        value = "sample";
    }

    args.push(value);
    described.push(`${option.name}<${option.type}>=${value}`);
  }

  return { args, described };
}

// --- payload inspection ----------------------------------------------------

const IMAGE_EXTENSION = /\.(png|jpe?g|gif|webp|apng)(\?|$)/i;

function inspectValue(value) {
  if (value === null || value === undefined) return String(value);
  if (Buffer.isBuffer(value)) return `<Buffer ${value.length} bytes>`;
  if (typeof value === "object") {
    if (typeof value.toJSON === "function") {
      try {
        return JSON.stringify(value.toJSON());
      } catch {
        return "[object]";
      }
    }
    try {
      return JSON.stringify(value);
    } catch {
      return "[object]";
    }
  }
  return String(value);
}

/** Normalises an EmbedBuilder, an APIEmbed or anything with toJSON(). */
function embedData(embed) {
  if (!embed) return {};
  if (embed.data) return embed.data;
  if (typeof embed.toJSON === "function") return embed.toJSON();
  return embed;
}

function inspectEmbed(embed) {
  const data = embedData(embed);
  return {
    title: data.title ?? null,
    description: data.description ?? null,
    descriptionLength: data.description ? data.description.length : 0,
    url: data.url ?? null,
    imageUrl: data.image?.url ?? null,
    thumbnailUrl: data.thumbnail?.url ?? null,
    fieldCount: data.fields?.length ?? 0,
    fieldNames: (data.fields ?? []).map((field) => field.name),
    footer: data.footer?.text ?? null,
    color: data.color ?? null,
    timestamp: data.timestamp ?? null
  };
}

function inspectFile(file) {
  const name = file?.name ?? file?.data?.name ?? null;
  const attachment = file?.attachment ?? file?.data?.attachment ?? file;
  let kind = typeof attachment;
  if (Buffer.isBuffer(attachment)) kind = `buffer(${attachment.length})`;
  else if (typeof attachment === "string") kind = `path(${attachment})`;

  return {
    name,
    kind,
    isImage: IMAGE_EXTENSION.test(name ?? "") || IMAGE_EXTENSION.test(String(attachment))
  };
}

/** Turns one recorded send into its observable properties. */
function inspectSend(send) {
  const payload = typeof send.payload === "string" ? { content: send.payload } : send.payload ?? {};
  const embeds = (payload.embeds ?? []).map(inspectEmbed);
  const files = (payload.files ?? []).map(inspectFile);

  return {
    via: send.via,
    content: payload.content ?? null,
    contentLength: payload.content ? String(payload.content).length : 0,
    embedCount: embeds.length,
    embeds,
    fileCount: files.length,
    files,
    componentCount: payload.components?.length ?? 0,
    ephemeral: Boolean(payload.ephemeral),
    hasImage:
      embeds.some((embed) => embed.imageUrl || embed.thumbnailUrl) ||
      files.some((file) => file.isImage)
  };
}

function summarise(sends) {
  return {
    sendCount: sends.length,
    hasContent: sends.some((send) => send.contentLength > 0),
    hasEmbed: sends.some((send) => send.embedCount > 0),
    hasImage: sends.some((send) => send.hasImage),
    hasFile: sends.some((send) => send.fileCount > 0),
    edited: sends.some((send) => send.via === "edit")
  };
}

// --- running one command ---------------------------------------------------

async function runCommand(client, world, command, config, recorder) {
  const CommandContext = require(path.join(SRC, "structures/CommandContext.js"));
  recorder.sends.length = 0;
  await resetState(client, world, config);

  const { args, described } = sampleArgs(command, world, config);
  const content = [command.name, ...args].join(" ");

  const message = {
    id: "900000000000000099",
    content: `uwu ${content}`,
    author: world.author,
    member: world.authorMember,
    guild: world.guild,
    channel: world.channel,
    client,
    createdTimestamp: Date.now(),
    attachments: new Collection(),
    lastReply: null,
    async reply(payload) {
      recorder.sends.push({ via: "reply", payload });
      return world.makeSentMessage(payload);
    },
    async delete() {
      recorder.calls.push({ name: "message.delete", args: [] });
    }
  };

  const ctx = new CommandContext(command, {
    message,
    flags: {},
    content,
    prefixLength: 4,
    alias: command.name,
    args
  });

  const errors = [];
  const onCommandError = (_ctx, error) => errors.push(error);
  client.on("commandError", onCommandError);

  const writesBefore = recorder.writes.length;
  const callsBefore = recorder.calls.length;
  const startedAt = process.hrtime.bigint();

  let thrown = null;
  try {
    await command.execute(ctx);
  } catch (error) {
    // execute() catches command errors itself, so this is the harness's own bug
    // or something thrown outside run().
    thrown = error;
  }

  // Let unawaited sends land (purge sends inside an un-awaited .then()).
  if (config.settle) await sleep(config.settle);

  const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
  client.off("commandError", onCommandError);

  const sends = recorder.sends.map(inspectSend);
  const writes = recorder.writes.slice(writesBefore);
  const calls = recorder.calls.slice(callsBefore);

  // A string thrown by a command is a deliberate, user-facing refusal:
  // Command.execute forwards it to commandError, which replies with the text.
  const refusals = errors.filter((error) => typeof error === "string");
  const crashes = errors.filter((error) => typeof error !== "string");
  if (thrown) crashes.push(thrown);

  let result;
  if (crashes.length) result = RESULT.ERROR;
  else if (refusals.length) result = RESULT.REJECTED;
  else if (!sends.length) result = RESULT.NO_OUTPUT;
  else result = RESULT.OK;

  return {
    command: command.name,
    category: command.category.toLowerCase(),
    aliases: command.aliases,
    invocation: `uwu ${content}`,
    arguments: described,
    result,
    durationMs: Math.round(durationMs),
    ...summarise(sends),
    sends,
    writes,
    calls,
    refusals: refusals.map((refusal) => truncate(refusal, 200)),
    crashes: crashes.map((crash) => ({
      message: crash?.message ?? String(crash),
      stack: crash?.stack ? crash.stack.split("\n").slice(0, 4).join("\n") : null
    }))
  };
}

// --- selection --------------------------------------------------------------

function selectCommands(client, config) {
  let commands = [...client.commands.values()];

  // Developer commands gate on a developer id and include eval/exec/reboot.
  commands = commands.filter((command) => !command.devOnly);
  if (!config.nsfw) commands = commands.filter((command) => !command.nsfw);

  if (config.categories) {
    commands = commands.filter((command) => config.categories.includes(command.category.toLowerCase()));
  }

  if (config.only) {
    commands = commands.filter((command) =>
      [command.name, ...command.aliases].some((name) => config.only.includes(name.toLowerCase()))
    );
  }

  commands.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

  if (config.sweep) {
    const seen = new Set();
    commands = commands.filter((command) => {
      if (seen.has(command.category)) return false;
      seen.add(command.category);
      return true;
    });
  }

  return commands;
}

// --- reporting --------------------------------------------------------------

function renderTable(results) {
  const flag = (value) => (value ? "y" : "-");
  const rows = results.map((result) => [
    result.category,
    result.command,
    result.result,
    String(result.durationMs),
    String(result.sendCount),
    flag(result.hasContent),
    flag(result.hasEmbed),
    flag(result.hasImage),
    flag(result.hasFile),
    String(result.writes.length),
    detailFor(result)
  ]);

  const header = ["CATEGORY", "COMMAND", "RESULT", "MS", "SENDS", "TEXT", "EMBED", "IMAGE", "FILE", "DBW", "OUTPUT"];
  const widths = header.map((title, column) =>
    Math.max(title.length, ...rows.map((row) => String(row[column]).length))
  );
  // Let the free-text column run to the end of the line.
  widths[widths.length - 1] = 0;

  const line = (cells, colorize) =>
    cells
      .map((value, column) => {
        const text = String(value).padEnd(widths[column]);
        return colorize && column === 2 ? paint(RESULT_COLORS[value] ?? "", text) : text;
      })
      .join("  ")
      .trimEnd();

  console.log("");
  console.log(paint(COLORS.bold, line(header, false)));
  for (const row of rows) console.log(line(row, true));
}

/** A one-line description of what the command actually produced. */
function detailFor(result) {
  if (result.crashes.length) return `threw: ${truncate(result.crashes[0].message, 80)}`;
  if (result.refusals.length) return `refused: ${truncate(result.refusals[0], 80)}`;
  if (!result.sends.length) return "nothing sent";

  const first = result.sends[0];
  const parts = [];
  if (first.embedCount) {
    const embed = first.embeds[0];
    parts.push(`embed ${JSON.stringify(truncate(embed.title ?? embed.description, 46))}`);
    if (embed.imageUrl) parts.push(`image=${truncate(embed.imageUrl, 34)}`);
  } else if (first.content) {
    parts.push(JSON.stringify(truncate(first.content, 60)));
  }
  if (first.fileCount) parts.push(`file=${first.files.map((file) => file.name).join(",")}`);
  if (result.sends.length > 1) parts.push(`+${result.sends.length - 1} more`);
  return parts.join(" ");
}

function renderDetails(results) {
  const notable = results.filter((result) => result.result !== RESULT.OK);
  if (!notable.length) return;

  console.log("");
  console.log(paint(COLORS.bold, "Needs a look"));
  for (const result of notable) {
    console.log(
      `  ${paint(RESULT_COLORS[result.result], result.result.padEnd(10))} ` +
        `${result.category}/${result.command}  ${paint(COLORS.dim, result.invocation)}`
    );
    for (const refusal of result.refusals) console.log(`    refused: ${refusal}`);
    for (const crash of result.crashes) {
      console.log(`    ${crash.message}`);
      if (crash.stack) {
        for (const frame of crash.stack.split("\n").slice(1)) {
          console.log(paint(COLORS.dim, `      ${frame.trim()}`));
        }
      }
    }
  }
}

function renderDump(results) {
  for (const result of results) {
    console.log("");
    console.log(paint(COLORS.bold, `── ${result.category}/${result.command} ─ ${result.invocation}`));
    if (result.arguments.length) console.log(paint(COLORS.dim, `   args: ${result.arguments.join("  ")}`));
    if (result.calls.length) {
      console.log(paint(COLORS.dim, `   calls: ${result.calls.map((entry) => entry.name).join(", ")}`));
    }
    if (result.writes.length) {
      console.log(
        paint(
          COLORS.dim,
          `   writes: ${result.writes.map((write) => `${write.collection}/${write.id} {${write.keys.join(",")}}`).join(", ")}`
        )
      );
    }
    console.log(JSON.stringify(result.sends, null, 2));
  }
}

function renderSummary(results) {
  const counts = {};
  for (const result of results) counts[result.result] = (counts[result.result] ?? 0) + 1;

  const parts = Object.values(RESULT)
    .filter((value) => counts[value])
    .map((value) => paint(RESULT_COLORS[value], `${counts[value]} ${value.toLowerCase()}`));

  console.log("");
  console.log(`${paint(COLORS.bold, "Summary:")} ${results.length} command(s) - ${parts.join(", ")}`);

  if (counts[RESULT.REJECTED]) {
    console.log(
      paint(
        COLORS.dim,
        "Rejected means the command refused the harness's sample argument, which is usually the sample's fault, not the command's."
      )
    );
  }

  return results.filter((result) => FATAL_RESULTS.includes(result.result)).length;
}

// --- main -------------------------------------------------------------------

async function main() {
  const config = parseArgs(process.argv.slice(2));

  if (config.help) {
    console.log(HELP.trim());
    return 0;
  }

  const apiCalls = [];
  if (!config.live) {
    stubExternalApis((service, detail) => {
      apiCalls.push({ service, detail });
      if (config.verbose) console.log(paint(COLORS.dim, `      [stub] ${service} ${truncate(detail, 80)}`));
    });
  }

  // Required after the stubs are installed: commands capture the helper
  // functions they use at require time.
  const UwUClient = require(path.join(SRC, "structures/UwUClient.js"));
  const client = new UwUClient();

  client.log.setLevel(config.verbose ? "debug" : "error");

  const writes = [];
  client.db = createDatabase(writes);
  client.shard = config.unsharded ? null : createShard(client);

  // One recorder, shared by the fake world's send/call hooks and the runner.
  const recorder = { sends: [], writes, calls: [] };
  const world = createWorld(client, recorder);

  client.commands.dir = path.join(SRC, "commands");
  await client.commands.loadFiles();

  if (!config.empty) await seedSettings(client, world);
  writes.length = 0;

  const commands = selectCommands(client, config);
  if (!commands.length) throw new Error("no commands matched the given filters.");

  if (config.list) {
    console.log(paint(COLORS.bold, `Would run ${commands.length} command(s)`));
    for (const command of commands) {
      const { described } = sampleArgs(command, world, config);
      console.log(`  ${command.category.toLowerCase()}/${command.name}${described.length ? `  ${paint(COLORS.dim, described.join(" "))}` : ""}`);
    }
    return 0;
  }

  console.log(
    paint(
      COLORS.dim,
      `Running ${commands.length} command(s) offline` +
        `${config.live ? ", live APIs" : ", stubbed APIs"}` +
        `${config.unsharded ? ", unsharded" : ", sharded"}` +
        `${config.empty ? ", empty settings" : ", seeded settings"}` +
        `${config.minimal ? ", required args only" : ""}.`
    )
  );

  const results = [];
  for (const command of commands) {
    results.push(await runCommand(client, world, command, config, recorder));
  }

  renderTable(results);
  renderDetails(results);
  if (config.dump) renderDump(results);
  const failures = renderSummary(results);

  if (config.json) {
    const file = path.resolve(process.cwd(), config.json);
    fs.writeFileSync(
      file,
      `${JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          config: {
            live: config.live,
            unsharded: config.unsharded,
            empty: config.empty,
            minimal: config.minimal,
            nsfw: config.nsfw
          },
          apiCalls,
          results
        },
        null,
        2
      )}\n`
    );
    console.log(paint(COLORS.dim, `JSON report written to ${file}`));
  }

  return failures ? 1 : 0;
}

if (require.main === module) {
  main()
    .then((code) => process.exit(code))
    .catch((error) => {
      console.error(paint(COLORS.red, `\nHarness failed: ${error.stack ?? error.message}`));
      process.exit(1);
    });
}

module.exports = {
  DEVS,
  RESULT,
  createDatabase,
  createWorld,
  inspectEmbed,
  inspectSend,
  parseArgs,
  sampleArgs,
  selectCommands,
  summarise
};
