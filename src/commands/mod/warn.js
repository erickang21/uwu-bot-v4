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
        `${reason?.length ? reason : "No reason given."}
         
${emojis.blueRightArrow} **Server:** ${ctx.guild.name}
${emojis.blueRightArrow} **Warned by:** ${ctx.author.username}

${emojis.info} This warning will be recorded in audit logs for moderators in the server.`
      );
    let msg;
    try {
      await user.send({ embeds: [ embed ] });
      msg = await ctx.reply(`A warning message has been sent to **${user.username}**. ${emojis.success}`);
    } catch(err) {
      return ctx.reply(`A warning message could not be sent. The user may have blocked the bot or disabled DMs. ${emojis.failure}`);
    }
    // Save to audit logs
    const guildSettings = this.client.settings.guilds.get(ctx.guild.id);
    let updatedAuditLog = guildSettings.auditLog;
    if (!guildSettings.auditLog) {
      updatedAuditLog = { [user.id]: [] };
    } else if (!guildSettings.auditLog[user.id]) {
      updatedAuditLog[user.id] = [];
    }
    const auditLogEntry = {
      action: "warn",
      timestamp: msg.createdTimestamp,
      reason,
      moderator: ctx.author.id,
    }
    updatedAuditLog[user.id] = [...updatedAuditLog[user.id], auditLogEntry];
    this.client.guildUpdate(ctx.guild.id, { auditLog: updatedAuditLog });
  }
}

module.exports = Warn;
