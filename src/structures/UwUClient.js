const {
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  Partials,
} = require("discord.js");
const { COLOR } = require("../utils/constants.js");
const { MongoClient } = require("mongodb");
const Logger = require("../utils/log.js");
const CommandStore = require("./CommandStore.js");
const EventStore = require("./EventStore.js");
const Settings = require("./Settings.js");
const schema = require("../utils/schema.js");

class UwUClient extends Client {
  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
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
    this.dbSchema = {
      guilds: {
        autorole: null,
        welcome: null,
        leave: null,
        modlog: null
      },
      users: {
        level: 0,
        exp: 0,
        multiplier: 1
      }
    }
    this.settings = {
      guilds: new Settings(this, "guilds", schema.guilds),
      members: new Settings(this, "members", schema.members),
      users: new Settings(this, "users", schema.users)
    };
    this.userMessageCount = {};
    this.userCommandCount = {};

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
      useUnifiedTopology: true,
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

  async getGuildCount() {
    let guilds;
    if(this.shard) {
      const guildsPerShard = await this.shard.fetchClientValues("guilds.cache.size");
      // hopefully i used reduce correctly, been a while
      guilds = guildsPerShard.reduce((acc, guild) => acc + guild, 0);
    } else {
      guilds = this.client.guilds.cache.size;
    }
    return guilds;
  }

  // USER EXTENSIONS (rework)
  getUserSettings(id) {
    return this.client.settings.users.getDefaults(id);
  }

  async userUpdate(id, obj) {
    return this.settings.users.update(id, obj);
  }

  async syncUserSettings(id) {
    const res = await this.settings.users.sync(id);
    if (res) {
      return res;
    } else {
      await this.userUpdate(id, this.dbSchema.users);
      return this.dbSchema.users;
    }
  }

  syncUserSettingsCache(id) {
    if(!this.settings.users.cache.has(id)) return this.syncUserSettings(id);
  }

  async givePokePoints(id, amount) {
    const pokepoints = parseInt(this.getUserSettings(id).pokepoints) + parseInt(amount);

    // Guard against overflow.
    if(pokepoints >= Number.MAX_SAFE_INTEGER) return false;

    // Validate against any accidents.
    if(isNaN(pokepoints)) throw new Error("Cannot give NaN points to member.");

    return this.userUpdate(id, { pokepoints });
  }

  // CHANNEL EXTENSIONS (rework)
  getChannelReadable(channel) {
    return channel.permissionsFor(channel.guild.me).has("VIEW_CHANNEL")
  }

  getChannelPostable(channel) {
    return this.getChannelReadable(channel) && channel.permissionsFor(channel.guild.me).has("SEND_MESSAGES");
  }
  
  // GUILDMEMBER EXTENSIONS (rework)

  memberUpdate(id, guildId, obj) {
    return this.settings.members.update(`${guildId}.${id}`, obj) 
  }

  getMemberSettings(id, guildId) {
    const formatId = `${guildId}.${id}`;
    return this.settings.members.getDefaults(formatId);
  }

  getMemberPoints(id, guildId) {
    return parseInt(this.getMemberSettings(id, guildId).points)
  }

  getMemberLevel(id, guildId) {
    return parseInt(this.getMemberSettings(id, guildId).level)
  }

  async syncMemberSettings(id, guildId) {
    return await this.settings.members.sync(`${guildId}.${id}`);
  }

  async syncMemberSettingsCache(id, guildId) {
    if(!this.settings.members.cache.has(`${guildId}.${id}`)) return await this.syncMemberSettings();
  }

  async giveMemberPoints(id, guildId, amount) {
    const points = parseInt(this.getMemberPoints(id, guildId)) + parseInt(amount);

    // Guard against overflow.
    if(points >= Number.MAX_SAFE_INTEGER) return false;

    // Validate against any accidents.
    if(isNaN(points)) throw new Error("Cannot give NaN points to member.");

    return this.memberUpdate(id, guildId, { points });
  }

  // GUILD SETTINGS
  async getGuildSettings(id) {
    return this.settings.guilds.getDefaults(id);
  }

  async guildUpdate(id, obj={}) {
    return this.settings.guilds.update(id, obj);
  }

  async syncGuildSettingsCache(id) {
    const res = await this.settings.guilds.sync(id);
    if (res) {
      return res;
    } else {
      await this.guildUpdate(id, this.dbSchema.guilds);
      return this.dbSchema.guilds;
    }
  }
}


module.exports = UwUClient;
