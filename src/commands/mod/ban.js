const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");

const DAYS_REGEX = /^(\d+)d$/i;
const SECONDS_PER_DAY = 24 * 60 * 60;
const DEFAULT_DELETE_DAYS = 7;
const MAX_DELETE_DAYS = 7;

class Ban extends Command {
  constructor(...args) {
    super(...args, {
      description: "bans a user from your server.",
      userPermissions: ["BanMembers"],
      botPermissions: ["BanMembers"],
      guildOnly: true,
      usage: "ban <@​member> [days, e.g. 3d] [reason]",
      options: [
        {
          name: "member",
          description: "the user you want to ban",
          type: "user",
          required: true
        },
        {
            name: "days",
            description: "(optional) days of messages to delete, e.g. 3d (0-7, defaults to 7d)",
            type: "string"
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
    
    let days = options.getString("days");
    let reason = options.getString("reason");

    // Text args are positional, so anything that isn't a `3d`-style token is
    // really the start of the reason.
    if (ctx.text && days && !DAYS_REGEX.test(days)) {
      reason = [days, reason].filter((part) => part?.length > 0).join(" ");
      days = null;
    }

    let deleteDays = DEFAULT_DELETE_DAYS;

    if (days) {
      const match = DAYS_REGEX.exec(days);
      if (!match) return ctx.reply(`Baka! Days must look like \`3d\`. ${emojis.error}`);
      deleteDays = parseInt(match[1], 10);
      // Discord only lets us delete up to 7 days of messages.
      if (deleteDays > MAX_DELETE_DAYS) return ctx.reply(`I can only delete up to ${MAX_DELETE_DAYS} days of messages. ${emojis.error}`);
    }

    const data = { deleteMessageSeconds: deleteDays * SECONDS_PER_DAY };

    let banReason =  "";

    if (reason?.length > 0) {
      banReason += reason;
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
      reason,
      moderator: ctx.author.id,
    }
    updatedAuditLog[member.id] = [...updatedAuditLog[member.id], auditLogEntry];
    this.client.guildUpdate(ctx.guild.id, { auditLog: updatedAuditLog });
  }
}

module.exports = Ban;
