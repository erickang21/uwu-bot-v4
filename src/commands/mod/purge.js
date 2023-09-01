const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");

class Purge extends Command {
  constructor(...args) {
    super(...args, {
      guildOnly: true,
      description: "purges a certain amount of messages.",
      usage: "purge [limit=50] [link|invite|bots|you|me|upload|@user]",
      options: [
        {
          name: "limit",
          description: "the amount of messages you want to delete.",
          type: "integer",
          required: true
        },
        {
          name: "filter",
          description: "filter for purging: [link|invite|bots|you|me|upload|@user]",
          type: "string",
        }
      ],
    });
  }

  async run(ctx, options) {
    const limit = options.getInteger("limit");
    const filter = options.getString("filter");
    if(!ctx.member.permissions.has("MANAGE_GUILD"))
      return ctx.reply(`Baka! You need the \`Manage Messages\` permissions to purge messages. ${emojis.failure}`);
    if (limit > 100) return ctx.reply(`You cannot purge more than 100 messages at a time. ${emojis.failure}`)
    if (ctx.message) await ctx.message.delete();
    let messages = await ctx.channel.messages.fetch({ limit });

    if(filter) {
      const user = await this.verifyUser(ctx, filter).catch(() => null);
      const type = user ? "user" : filter;
      messages = messages.filter(this.getFilter(ctx, type, user));
    }

    ctx.channel.bulkDelete(messages)
      .then(async () => {
        const message = await ctx.channel.send(`${messages.size} messages were deleted. ${emojis.success}`);
        setTimeout(() => message.delete(), 5000);
      })
      .catch(() => {
        const embed = this.client.embed() // Generic Fail Message
        .setTitle(`An error occurred! ${emojis.error}`)
        .setDescription(`The messages were not successfully purged. 
        
This could be due to the following reasons:
${emojis.shiningarrow} The bot does not have the **Manage Messages** permission.
${emojis.shiningarrow} One or more messages within the last **${limit}** messages are more than 14 days old.`)
        .setTimestamp()
        .setColor(0xf01d0e);
        return ctx.channel.send({ embeds: [embed] })
      });
    
  }

  getFilter(ctx, filter, user) {
    switch(filter) {
      case "link": return (msg) => /https?:\/\/[^ /.]+\.[^ /.]+/.test(msg.content);
      case "invite": return (msg) => /(https?:\/\/)?(www\.)?(discord\.(gg|li|me|io)|discordapp\.com\/invite)\/.+/.test(msg.content);
      case "bots": return (msg) => msg.author.bot;
      case "you": return (msg) => msg.author.id === this.client.user.id;
      case "me": return (msg) => msg.author.id === msg.author.id;
      case "upload": return (msg) => msg.attachments.size > 0;
      case "user": return (msg) => msg.author.id === user.id;
      default: return () => true;
    }
  }
}

module.exports = Purge;