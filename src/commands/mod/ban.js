const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");

class Ban extends Command {
  constructor(...args) {
    super(...args, {
      description: "bans a user from your server.",
      userPermissions: ["BanMembers"],
      botPermissions: ["BanMembers"],
      guildOnly: true,
      usage: "ban <@​member> [reason]",
      options: [
        {
          name: "member",
          description: "the user you want to ban",
          type: "user",
          required: true
        },
        {
            name: "reason",
            description: "(optional) reason for this action",
            type: "string"
        }
      ]
    });
  }

  async run(ctx, options) {
    const member = await ctx.guild.members.fetch(options.getUser("member").id);

    if(member.id === ctx.author.id) return ctx.reply("Baka! Why would you ban yourself?");
    if(member.id === this.client.user.id) return ctx.reply("Baka! Why would you ban me?");
    if(member.roles.highest.position >= ctx.member.roles.highest.position) return ctx.reply(`You can't ban this user. ${emojis.error}`);
    if(!member.bannable) return ctx.reply(`I can't ban this user! ${emojis.error}`);
    
    const data = { deleteMessageSeconds: 0 };

    let banReason =  "";

    if (options.getString("reason")?.length > 0) {
      banReason += options.getString("reason");
    } else {
      banReason += "No reason provided."
    }
    banReason = `Banned by ${ctx.author.username} (ID: ${ctx.author.id}) for: ${banReason}`

    data.reason = banReason;
    await member.ban(data);
    const msg = await ctx.reply(`**${member.user.username}** was banned. ${emojis.ban}`);
    // Save to audit logs
    const guildSettings = this.client.settings.guilds.get(ctx.guild.id);
    let updatedAuditLog = guildSettings.auditLog;
    if (!guildSettings.auditLog) {
      updatedAuditLog = { [member.id]: [] };
    } else if (!guildSettings.auditLog[member.id]) {
      updatedAuditLog[member.id] = [];
    }
    const auditLogEntry = {
      action: "ban",
      timestamp: msg.createdTimestamp,
      reason: options.getString("reason"),
      moderator: ctx.author.id,
    }
    updatedAuditLog[member.id] = [...updatedAuditLog[member.id], auditLogEntry];
    this.client.guildUpdate(ctx.guild.id, { auditLog: updatedAuditLog });
  }
}

module.exports = Ban;
