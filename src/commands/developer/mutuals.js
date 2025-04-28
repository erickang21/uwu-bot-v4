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
        },
      ],
    });
  }

  async getGuild(guildId) {
    const shardEntries = await this.client.shard.broadcastEval((client, context) => client.guilds.cache.get(context.guildId), { context: { guildId } });
    return shardEntries.filter((entry) => !!entry)[0];
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    let servers = '';
    const userData = await this.client.settings.users.fetch(user.id)
    if (!userData.guilds) { 
      return ctx.reply(`I have not detected any servers that I share with this user. In order to be detected, the user must have been active in the server recently. ${emojis.error}`);
    }
    for (const guildId of userData.guilds) {
      const currentGuild = await this.getGuild(guildId);
      if (currentGuild) {
        servers += `- **${currentGuild.name}** (ID: ${currentGuild.id}) | Members: ${currentGuild.memberCount}\n`;
      }
    }
      
    
    servers += `\n${emojis.sparkles} Duration: ${Date.now() - ctx.createdTimestamp} ms`;
    const embed = this.client
      .embed(user)
      .setTitle(`Mutual Servers: ${user.username}`)
      .setDescription(servers);

    return ctx.reply({
      embeds: [ embed ],
    });
  }
}

module.exports = Mutuals;
