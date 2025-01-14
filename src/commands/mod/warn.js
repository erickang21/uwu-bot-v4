const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");

class Warn extends Command {
  constructor(...args) {
    super(...args, {
      description: "sends a dm message as a warning",
      userPermissions: ["ModerateMembers"],
      botPermissions: ["ModerateMembers"],
      guildOnly: true,
      usage: "warn <@​member> <reason>",
      options: [
        {
          name: "user",
          description: "the user you want to unmute",
          type: "user",
          required: true
        },
        {
          name: "reason",
          description: "(optional) reason for this action",
          type: "string",
          required: true
        }
      ],
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user");
    const reason = options.getString("reason");
    
    if(user.id === ctx.author.id) return ctx.reply("Baka! You can't warn yourself.");
    if(user.id === this.client.user.id) return ctx.reply("Baka! Why would you try to warn me?");
    if(user.bot) return ctx.reply("Baka! You can't warn bots.");
    if(user.id === ctx.guild.ownerID) return ctx.reply("Baka! You can't warn the owner.");
    const embed = this.client
      .embed(this.client.user)
      .setTitle(`You have received a warning. ${emojis.error}`)
      .setDescription(
        ` 
${emojis.shiningarrow} **Server:** ${ctx.guild.name}
${emojis.shiningarrow} **Warned by:** ${ctx.author.tag}
${emojis.shiningarrow} **Reason:** ${reason?.length ? reason : "No reason given."}
                `
      );

    try {
      await user.send({ embeds: [ embed ] });
      return ctx.reply(`A warning message has been sent to **${user.tag}**. ${emojis.success}`);
    } catch(err) {
      return ctx.reply(`A warning message could not be sent. The user may have blocked the bot or disabled DMs. ${emojis.failure}`);
    }
  }
}

module.exports = Warn;
