const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");
const { stripIndents } = require("common-tags");

class Audit extends Command {
  constructor(...args) {
    super(...args, {
      description: "Displays logs of actions taken against a member in this server.",
      userPermissions: ["ModerateMembers"],
      aliases: ["auditlog", "auditlogs"],
      options: [
        {
          name: "user",
          description: "The user who you want to check.",
          type: "user",
          required: true,
        },
        {
          name: "entryType",
          description: "The type of log to filter by. (eg. (w)arn, (k)ick, (m)ute, (b)an)",
          type: "string",
        }

      ],
    });
  }

  readableDate(timestamp) {
    const date = new Date(timestamp);
    const month = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
    const day = date.getUTCDate();
    const year = date.getUTCFullYear();
    return `${month} ${day}, ${year}`;
  }

  timeAgo(timestamp) {
    const now = Date.now();
    const diffMillis = now - timestamp;
    const seconds = Math.floor(diffMillis / 1000) % 60;
    const minutes = Math.floor(diffMillis / (1000 * 60)) % 60;
    const hours = Math.floor(diffMillis / (1000 * 60 * 60)) % 24;
    const days = Math.floor(diffMillis / (1000 * 60 * 60 * 24));
    let str = '';
    if (days) str += `${days}d, `;
    if (days || hours) str += `${hours}h, `;
    if (days || hours || minutes) str += `${minutes}m, `;
    if (days || hours || minutes || seconds) str += `${seconds}s`;
    return str;
  }

  parseType(type) {
    if (!type.length) return "all";
    if (["mute", "mutes", "timeout", "timeouts", "m"].includes(type.toLowerCase())) {
      return "mute";
    } else if (["unmute", "unmutes", "u"].includes(type.toLowerCase())) {
      return "unmute";
    } else if (["kick", "kicks", "k"].includes(type.toLowerCase())) {
      return "kick";
    } else if (["ban", "bans", "b"].includes(type.toLowerCase())) {
      return "ban";
    } else if (["warn", "warns", "w"].includes(type.toLowerCase())) {
      return "warn";
    } else return null;
  }

  async run(ctx, options) {
    const user = options.getUser("user");
    const filterType = options.getString("entryType");
    const guildSettings = this.client.settings.guilds.get(ctx.guild.id);
    let member;
    try {
      member = await ctx.guild.members.fetch(user.id);
    } catch (e) {
      member = null;
    }
    let memberBanEntry;
    try {
      memberBanEntry = await ctx.guild.bans.fetch(user.id);
    } catch (e) {
      memberBanEntry = null;
    }
    let logEntryFilterType = this.parseType(filterType);
    if (logEntryFilterType === null) return ctx.reply("Did not provide a valid filter. Valid filters are: kick, ban, mute, unmute, warn")

    let record = "";
    let totalLength = 0;
    let logLength = 0;
    if (!guildSettings.auditLog) {
      record = "No actions were taken against this member.";
    } else if (!guildSettings.auditLog[user.id]) {
      record = "No actions were taken against this member.";
    } else {
      let logs;
      if (logEntryFilterType === "all") logs = guildSettings.auditLog[user.id];
      else logs = guildSettings.auditLog[user.id].filter((entry) => entry.action === logEntryFilterType);
      totalLength = guildSettings.auditLog[user.id].length;
      logLength = logs.length;
      for (let i = logs.length - 1; i >= 0; i--) {
        const auditLogEntry = logs[i];
        const moderator = await this.client.users.fetch(auditLogEntry.moderator);
        const moderatorUsername = moderator.username;
        if (auditLogEntry.action === "mute") {
          record += `:no_entry_sign: **Muted** for **${auditLogEntry.duration}**`
        } else if (auditLogEntry.action === "unmute") {
          record += `${emojis.online} **Unmuted** `
        } else if (auditLogEntry.action === "kick") {
          record += `${emojis.leavearrow} **Kicked** `
        } else if (auditLogEntry.action === "ban") {
          record += `${emojis.banned} **Banned** `
        } else if (auditLogEntry.action === "warn") {
          record += `${emojis.commandError} **Warned** `
        }
        else {
          record += `${emojis.outline} **INVALID ENTRY** `
        }
        const date = this.readableDate(auditLogEntry.timestamp);
        const timeElapsed = this.timeAgo(auditLogEntry.timestamp)
        record += ` by **${moderatorUsername}** on **${date}** (**${timeElapsed}** ago)\n(**Reason:** ${auditLogEntry.reason || "No reason given."})\n\n`
      }
    }

    const embed = this.client.embed(user)
      .setTitle(`Audit Log: ${user.username}`)
      .setDescription(stripIndents`${member === null ? `${emojis.NotAllowed} **Member is not in the server.**` : `${emojis.staticCheckmark} **Member is in the server.**`}
${memberBanEntry === null ? `${emojis.outline} **Member is not banned.**` : `${emojis.banned} **Member has been banned, due to:** ${memberBanEntry.reason}`}
---------
${record}
${guildSettings.auditLog && guildSettings.auditLog[user.id] && logEntryFilterType !== "all" ? 
        `---------\nViewing only **${logEntryFilterType}s** (${logLength} ${logLength === 1 ? "entry" : "entries"} | ${totalLength} total)` 
        : `---------\nViewing all entries (${totalLength} ${totalLength === 1 ? "entry" : "entries"})`}`);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Audit;
