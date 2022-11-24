const { Client, EmbedBuilder, GatewayIntentBits, Partials } = require("discord.js");
const { COLOR } = require("../utils/constants.js");
const Logger = require("../utils/log.js");
const CommandStore = require("./CommandStore.js");
const EventStore = require("./EventStore.js");

class UwUClient extends Client {
  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent
      ],
      allowedMentions: { parse: ["users"] },
      partials: [Partials.Channel]
    });

    this.dev = !!process.env.DEV;
    this.log = new Logger(this, this.dev ? "trace" : "info");
    this.commands = new CommandStore(this);
    this.events = new EventStore(this);

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
    const setPresence = async (client, { guilds }) => {
      await client.user.setActivity(`uwu help | ${guilds} servers`);
    };

    this.log.debug(`setActivity() requested. ${guilds} servers.`);

    if (this.shard) {
      return this.shard.broadcastEval(setPresence, { context: { guilds } });
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
      const name = user.tag;
      const iconURL = user.displayAvatarURL({ size: 64 });

      embed.setAuthor({ name, iconURL });
    }

    return embed;
  }

  async login() {
    await this.load();

    const { TOKEN, TOKEN_DEV } = process.env;
    return super.login(this.dev ? TOKEN_DEV : TOKEN);
  }
}

module.exports = UwUClient;
