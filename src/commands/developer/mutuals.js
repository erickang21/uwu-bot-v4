const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");

class Mutuals extends Command {
  constructor(...args) {
    super(...args, {
      description: "Checks the servers that a user is mutual with the bot.",
      usage: "<user>",
      devOnly: true,
      aliases: ["m"],
      options: [
        {
          name: "user",
          description: "The user to check.",
          type: "user",
          required: true,
        },
      ],
    });
  }

  async getGuild(guildId) {
    const shardEntries = await this.client.shard.broadcastEval((client) => client.guilds.cache.get(guildId));
    return shardEntries.filter((entry) => !!entry)[0];
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    let servers = '';
    const userData = await this.client.syncUserSettings(user.id);
    if (!userData.guilds) {
      userData.guilds = [];
      await this.client.userUpdate(ctx.author.id, userData);
    }
    for (const guildId of userData.guilds) {
      const currentGuild = await this.getGuild(guildId);
      servers += `- **${currentGuild.name}** (ID: ${currentGuild.id}) | Members: ${currentGuild.memberCount}\n`;
    }
    
    servers += `\n${emojis.sparkles} Duration: ${Date.now() - ctx.createdTimestamp} ms`;
    const embed = this.client
      .embed(user)
      .setTitle(`Mutual Servers: ${user}`)
      .setDescription(servers);

    return ctx.reply({
      embeds: [ embed ],
    });
  }
}

module.exports = Mutuals;
