const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");

class Mute extends Command {
  constructor(...args) {
    super(...args, {
      description: "Prevents a user from talking in the server.",
      userPermissions: ["ModerateMembers"],
      botPermissions: ["ModerateMembers"],
      aliases: ["timeout"],
      guildOnly: true,
      usage: "mute <@member> [time] [reason]",
      options: [
        {
          name: "member",
          description: "the user you want to mute.",
          type: "user",
          required: true
        },
        {
            name: "time",
            description: "(optional) the amount of time to mute for (eg: 30s, 7mins, 1d)",
            type: "string"
        },
        {
            name: "reason",
            description: "(optional) reason for this action",
            type: "string"
        }
      ],
    });
  }

  parseTime(timeString) {
    const match = timeString.match(/^(\d+)([a-zA-Z]+)$/);
    if (!match) return null;
    const timeNumber = parseInt(match[1]);
    const timeUnit = match[2];
    if (isNaN(timeNumber)) throw "Value of duration is not valid.";
    // Need to convert to milliseconds
    if (['s', 'sec', 'seconds', 'second', 'secs'].includes(timeUnit.toLowerCase())) {
      return { time: timeNumber * 1000, timeStr: `${timeNumber} seconds` };
    } else if (['m', 'min', 'mins', 'minute', 'minutes'].includes(timeUnit.toLowerCase())) {
      return { time: timeNumber * 60 * 1000, timeStr: `${timeNumber} minutes` };
    } else if (['h', 'hr', 'hrs', 'hour', 'hours'].includes(timeUnit.toLowerCase())) {
      return { time: timeNumber * 60 * 60 * 1000, timeStr: `${timeNumber} hours` };
    } else if (['d', 'day', 'days'].includes(timeUnit.toLowerCase())) {
      return { time: timeNumber * 24 * 60 * 60 * 1000, timeStr: `${timeNumber} days` };
    } else {
      throw "Could not identify amount of time needed."
    }
  }

  async run(ctx, options) {
    const member = await ctx.guild.members.fetch(options.getUser("member").id);

    if(member.id === ctx.author.id) return ctx.reply("Baka! Why would you mute yourself?");
    if(member.id === this.client.user.id) return ctx.reply("Baka! Why would you mute me?");
    if(member.roles.highest.position >= ctx.member.roles.highest.position) return ctx.reply(`You can't mute this user. ${emojis.error}`);
    let muteTime;
    let alternateResponse;
    let muteTimeStr;
    try {
      const {  time , timeStr } = this.parseTime(options.getString("time"));
      muteTime = time;
      muteTimeStr = timeStr;
    } catch (e) {
      muteTime = null;
      alternateResponse = e;
    }
    let muteReason = ctx.author.id + ":";

    if (options.getString("reason")?.length > 0) {
      muteReason += options.getString("reason");
    } else {
      muteReason += "No reason provided."
    }
    muteReason = `Muted by ${ctx.author.username} for: ${muteReason}`

    await member.timeout(muteTime, muteReason);
    if (alternateResponse) {
      return ctx.reply(`**${member.user.tag}** was muted **indefinitely**. ${emojis.mute}\n\n(${alternateResponse})`);
    } else {
      return ctx.reply(`**${member.user.tag}** was muted for **${muteTimeStr}**. ${emojis.mute}`);
    }
  }
}

module.exports = Mute;
