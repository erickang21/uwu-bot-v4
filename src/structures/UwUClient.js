const { Client, EmbedBuilder, GatewayIntentBits, Partials } = require("discord.js");
const { COLOR } = require("../utils/constants.js");
const { MongoClient } = require("mongodb");
const Logger = require("../utils/log.js");
const CommandStore = require("./CommandStore.js");
const EventStore = require("./EventStore.js");
const Settings = require("./Settings.js");
const sfhema = require("../utils/schema.js");

class UwUClient extends Client {
  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
      ],
      allowedMentions: { parse: ["users"] },
      partials: [Partials.Channel],
    });

    this.dev = process.env.NODE_ENV == "development";
    this.log = new Logger(this, this.dev ? "trace" : "info");
    this.commands = new CommandStore(this);
    this.events = new EventStore(this);
    this.db = null;
    this.dbClient = null;
    this.settings = {
      guilds: new Settings(this, "guilds", schema.guilds)
    };

    this.once("ready", () => {
      this.emit("uwuReady");
    });
  }

  async load() {
    const stores = [this.commands, this.events];

    for (const store of stores) {
      const count = await store.loadFiles();
      this.log.info(`Loaded ${count} ${store.name}`);
    }
  }

  async getGuildCount() {
    if (this.shard) {
      const count = await this.shard.fetchClientValues("guilds.cache.size");
      return count.reduce((acc, guild) => acc + guild, 0);
    } else {
      return this.guilds.cache.size;
    }
  }

  async setActivity() {
    const guilds = await this.getGuildCount();
    const setPresence = (client, { guilds }) => {
      client.user.setActivity(`uwu help | ${guilds} servers`);
    };

    this.log.debug(`setActivity() requested. ${guilds} servers.`);

    if (this.shard) {
      return this.shard.broadcastEval(setPresence, {
        context: { guilds },
      });
    } else {
      return setPresence(this, { guilds });
    }
  }

  /**
   * Embed template.
   * @param {UserResolvable} [user] - Set the embed's author if given.
   * @param {Object} [embed={}] - Embed data.
   * @returns {MessageEmbed}
   */
  embed(user, data = {}) {
    const embed = new EmbedBuilder(data).setColor(COLOR);

    if (user) {
      const text = user.tag;
      const iconURL = user.displayAvatarURL({ size: 64 });

      embed.setFooter({ text, iconURL });
    }

    return embed;
  }

  async connectDatabase() {
    this.dbClient = await MongoClient.connect(process.env.MONGODB, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    this.log.info("Connected to MongoDB");
    this.db = this.dbClient.db();

    for (const [name, settings] of Object.entries(this.settings)) {
      await settings.init();
      this.log.info(`Loaded ${settings.cache.size} settings for ${name}`);
    }
  }

  async login() {
    await this.load();
    await this.connectDatabase();

    const { TOKEN, TOKEN_DEV } = process.env;
    return super.login(this.dev ? TOKEN_DEV : TOKEN);
  }
}

module.exports = UwUClient;
