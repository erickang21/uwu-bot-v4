const Command = require("../../structures/Command.js");
const { MessageEmbed } = require("discord.js");
class Purge extends Command {
  constructor(...args) {
    super(...args, {
      guildOnly: true,
      description: "Purges a certain amount of messages.",
      usage: "purge [limit=50] [link|invite|bots|you|me|upload|@user]",
      options: [
        {
          name: "limit",
          description: "The user you want to bully.",
          type: "integer",
        },
      ],
    });
  }

  async run(ctx, [limit, filter = null]) {
    if(!ctx.member.permissions.has("MANAGE_GUILD"))
      return ctx.reply("Baka! You need the `Manage Messages` permissions to purge messages.");
    limit = this.verifyInt(limit);
    if (limit > 100) return ctx.reply("You cannot purge more than 100 messages at a time.")
    let messages = await ctx.channel.messages.fetch({ limit: 100 });

    if(filter) {
      const user = await this.verifyUser(ctx, filter).catch(() => null);
      const type = user ? "user" : filter;
      messages = messages.filter(this.getFilter(ctx, type, user));
    }

    messages = messages.array().slice(0, limit + 1);
    ctx.channel.bulkDelete(messages)
      .then(async () => {
        const reply = await ctx.reply(`${messages.length - 1} messages were deleted. ${this.client.constants.checkmark}`);
        reply.delete({ timeout: 5000 });
      })
      .catch(() => {
        const embed = new MessageEmbed() // Generic Fail Message
        .setTitle("An error occurred! <a:Anger:849398410426974269>")
        .setDescription(`The messages were not successfully purged. 
        
This could be due to the following reasons:
<:arrow:849398611888570369> The bot does not have the **Manage Messages** permission.
<:arrow:849398611888570369> One or more messages within the last **${limit}** messages are more than 14 days old.`)
        .setTimestamp()
        .setColor(0xf01d0e);
        ctx.reply({ embed })
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