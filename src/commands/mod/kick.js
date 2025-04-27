const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");

class Kick extends Command {
  constructor(...args) {
    super(...args, {
      description: "kicks a user from your server.",
      userPermissions: ["KickMembers"],
      botPermissions: ["KickMembers"],
      guildOnly: true,
      usage: "kick <@​member> [reason]",
      options: [
        {
          name: "member",
          description: "the user you want to kick.",
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

    if(member.id === ctx.author.id) return ctx.reply("Baka! Why would you kick yourself?");
    if(member.id === this.client.user.id) return ctx.reply("Baka! Why would you kick me?");
    if(member.roles.highest.position >= ctx.member.roles.highest.position) return ctx.reply(`You can't kick this user. ${emojis.error}`);
    if(!member.kickable) return ctx.reply(`I can't kick this user! ${emojis.error}`);

    let kickReason =  "";

    if (options.getString("reason")?.length > 0) {
      kickReason += options.getString("reason");
    } else {
      kickReason += "No reason provided."
    }
    kickReason = `Kicked by ${ctx.author.username} (ID: ${ctx.author.id}) for: ${kickReason}`
    
    await member.kick(kickReason);
    const msg = await ctx.reply(`**${member.user.tag}** was kicked. ${emojis.kick}`);
    // Save to audit logs
    const guildSettings = await this.client.syncGuildSettingsCache(ctx.guild.id);
    let updatedAuditLog = guildSettings.auditLog;
    if (!guildSettings.auditLog) {
      updatedAuditLog = { [member.id]: [] };
    } else if (!guildSettings.auditLog[member.id]) {
      updatedAuditLog[member.id] = [];
    }
    const auditLogEntry = {
      action: "kick",
      timestamp: msg.createdTimestamp,
      reason: options.getString("reason"),
      moderator: ctx.author.id,
    }
    updatedAuditLog[member.id] = [...updatedAuditLog[member.id], auditLogEntry];
    this.client.guildUpdate(ctx.guild.id, { auditLog: updatedAuditLog });
  }
}

module.exports = Kick;
