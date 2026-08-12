const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");

/**
 * Discord refuses a timeout longer than 28 days, so a longer one has to be
 * rejected here rather than handed to the API to fail on.
 */
const MAX_MUTE = 28 * 24 * 60 * 60 * 1000;

const UNITS = [
  { label: "second", ms: 1000, names: ["s", "sec", "secs", "second", "seconds"] },
  { label: "minute", ms: 60 * 1000, names: ["m", "min", "mins", "minute", "minutes"] },
  { label: "hour", ms: 60 * 60 * 1000, names: ["h", "hr", "hrs", "hour", "hours"] },
  { label: "day", ms: 24 * 60 * 60 * 1000, names: ["d", "day", "days"] }
];

const DURATION_FORMAT = "a number followed by `s`, `m`, `h` or `d` — like `30s`, `10m`, `3h` or `7d`";
const MISSING_DURATION = `Baka! You need to tell me how long to mute for: ${DURATION_FORMAT}. ${emojis.error}`;

class Mute extends Command {
  constructor(...args) {
    super(...args, {
      description: "Prevents a user from talking in the server.",
      userPermissions: ["ModerateMembers"],
      botPermissions: ["ModerateMembers"],
      aliases: ["timeout"],
      guildOnly: true,
      usage: "mute <@member> <time> [reason]",
      options: [
        {
          name: "member",
          description: "the user you want to mute.",
          type: "user",
          required: true
        },
        {
          name: "time",
          description: "how long to mute for, eg: 30s, 10m, 3h, 7d (max 28d)",
          type: "string",
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

  /**
   * The framework's "argument is required" message doesn't say what a duration
   * looks like, which is the one thing a user who left it out needs to know.
   */
  async _parseArg(ctx, i) {
    if (this.options[i].name === "time" && !ctx.args[i]) throw MISSING_DURATION;
    return super._parseArg(ctx, i);
  }

  /**
   * Turns "3h" into milliseconds. Every failure throws a string, so the user is
   * told what they got wrong instead of being muted for some duration they
   * never asked for.
   */
  parseTime(timeString) {
    const input = String(timeString ?? "").trim();
    if (!input) throw MISSING_DURATION;

    const match = /^(\d+)\s*([a-zA-Z]+)$/.exec(input);
    if (!match) throw `**${input}** isn't a duration I understand. Give me ${DURATION_FORMAT}. ${emojis.error}`;

    const unit = UNITS.find((u) => u.names.includes(match[2].toLowerCase()));
    if (!unit) throw `I don't know the time unit **${match[2]}**. Use ${DURATION_FORMAT}. ${emojis.error}`;

    const amount = Number(match[1]);
    if (!Number.isSafeInteger(amount) || amount < 1) {
      throw `**${input}** is not a length of time I can mute for. Give me ${DURATION_FORMAT}. ${emojis.error}`;
    }

    const time = amount * unit.ms;
    if (time > MAX_MUTE) throw `Discord won't let me mute anyone for longer than **28 days**. ${emojis.error}`;

    return { time, timeStr: `${amount} ${unit.label}${amount === 1 ? "" : "s"}` };
  }

  async run(ctx, options) {
    const member = await ctx.guild.members.fetch(options.getUser("member").id).catch(() => null);
    if (!member) return ctx.reply(`I couldn't find that user in this server. ${emojis.error}`);

    if(member.id === ctx.author.id) return ctx.reply("Baka! Why would you mute yourself?");
    if(member.id === this.client.user.id) return ctx.reply("Baka! Why would you mute me?");
    if(member.roles.highest.position >= ctx.member.roles.highest.position) return ctx.reply(`You can't mute this user. ${emojis.error}`);
    if(!member.moderatable) return ctx.reply(`I can't mute this user! ${emojis.error}`);

    // Throws a user-facing string when the duration is missing or unusable.
    const { time: muteTime, timeStr: muteTimeStr } = this.parseTime(options.getString("time"));

    let muteReason =  "";

    if (options.getString("reason")?.length > 0) {
      muteReason += options.getString("reason");
    } else {
      muteReason += "No reason provided."
    }
    muteReason = `Muted by ${ctx.author.username} (ID: ${ctx.author.id}) for: ${muteReason}`
    // Provide immediate response, start saving to audit logs after
    await member.timeout(muteTime, muteReason);
    const msg = await ctx.reply(`**${member.user.tag}** was muted for **${muteTimeStr}**. ${emojis.mute}`);
    // Now save this action to the audit log
    const guildSettings = this.client.getGuildSettings(ctx.guild.id);
    let updatedAuditLog = guildSettings.auditLog;
    if (!guildSettings.auditLog) {
      updatedAuditLog = { [member.id]: [] };
    } else if (!guildSettings.auditLog[member.id]) {
      updatedAuditLog[member.id] = [];
    }
    const auditLogEntry = {
      action: "mute",
      timestamp: msg.createdTimestamp,
      duration: muteTimeStr,
      reason: options.getString("reason"),
      moderator: ctx.author.id,
    }
    updatedAuditLog[member.id] = [...updatedAuditLog[member.id], auditLogEntry];
    this.client.guildUpdate(ctx.guild.id, { auditLog: updatedAuditLog });
  }
}

module.exports = Mute;
