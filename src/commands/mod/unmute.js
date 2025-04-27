const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");

class Unmute extends Command {
  constructor(...args) {
    super(...args, {
      description: "removes a timeout restriction from a user.",
      userPermissions: ["ModerateMembers"],
      botPermissions: ["ModerateMembers"],
      aliases: ["untimeout"],
      guildOnly: true,
      usage: "unmute <@​member>",
      options: [
        {
          name: "member",
          description: "the user you want to unmute",
          type: "user",
          required: true
        },
        {
          name: "reason",
          description: "(optional) reason for this action",
          type: "string"
        }
      ],
    });
  }

  async run(ctx, options) {
    const member = await ctx.guild.members.fetch(options.getUser("member").id);
    if (!member.communicationDisabledUntil) return ctx.reply("This member has not been muted!");

    if(member.id === ctx.author.id) return ctx.reply("Baka! Why would you unmute yourself?");
    if(member.id === this.client.user.id) return ctx.reply("Baka! Why would you unmute me?");
    if(member.roles.highest.position >= ctx.member.roles.highest.position) return ctx.reply(`You can't unmute this user. ${emojis.error}`);

    let unmuteReason =  "";

    if (options.getString("reason")?.length > 0) {
      unmuteReason += options.getString("reason");
    } else {
      unmuteReason += "No reason provided."
    }
    unmuteReason = `Unmuted by ${ctx.author.username} (ID: ${ctx.author.id}) for: ${unmuteReason}`

    await member.timeout(null, unmuteReason);
    const msg = await ctx.reply(`**${member.user.tag}** was unmuted. ${emojis.unmute}`);
    // Now save this action to the audit log
    const guildSettings = await this.client.syncGuildSettingsCache(ctx.guild.id);
    let updatedAuditLog = guildSettings.auditLog;
    if (!guildSettings.auditLog) {
      updatedAuditLog = { [member.id]: [] };
    } else if (!guildSettings.auditLog[member.id]) {
      updatedAuditLog[member.id] = [];
    }
    const auditLogEntry = {
      action: "unmute",
      timestamp: msg.createdTimestamp,
      reason: options.getString("reason"),
      moderator: ctx.author.id,
    }
    updatedAuditLog[member.id] = [...updatedAuditLog[member.id], auditLogEntry];
    this.client.guildUpdate(ctx.guild.id, { auditLog: updatedAuditLog });
  }
}

module.exports = Unmute;
