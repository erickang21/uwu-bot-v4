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

  async run(ctx, options) {
    const user = options.getUser("user");
    const userId = user.id;
    const msg = await ctx.reply({
      content: `Searching all servers... ${emojis.loading}`,
      fetchReply: true,
    });

    let servers = '';
    
    let findMembers = async (client, context) => {
      return client.guilds.cache.filter((guild) => {
        guild.members.fetch(context.userId)
          .then((res) => {
            if (res) return true;
            else return false;
          });
      });
    }

    const mutualGuildsList = await this.client.shard.broadcastEval(findMembers, { context: { userId } });
    console.log(mutualGuildsList);
    for (const guildList of mutualGuildsList) {
      console.log("check", guildList);
      for (const mutualGuild of guildList) {
        servers += `- **${mutualGuild.name}** (ID: ${mutualGuild.id}) | Members: ${mutualGuild.memberCount}\n`;
      }
    }
    
    servers += `\n${emojis.sparkles} Duration: ${Date.now() - ctx.createdTimestamp} ms`;
    const embed = this.client
    .embed(user)
    .setTitle(`Mutual Servers`)
    .setDescription(servers);

    return ctx.editReply({
      embeds: [ embed ],
    });
  }
}

module.exports = Mutuals;
