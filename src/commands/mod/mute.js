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
      usage: "mute <@​member> [time] [reason]",
      options: [
        {
          name: "member",
          description: "the user you want to mute.",
          type: "user",
          required: true
        },
        {
            name: "time",
            description: "(optional) the amount of time in minutes to mute this user for (leave blank for indefinite time)",
            type: "integer"
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
    const member = await ctx.guild.members.fetch(options.getUser("member"));

    if(member.id === ctx.author.id) return ctx.reply("Baka! Why would you mute yourself?");
    if(member.id === this.client.user.id) return ctx.reply("Baka! Why would you mute me?");
    if(member.roles.highest.position >= ctx.member.roles.highest.position) return ctx.reply(`You can't mute this user. ${emojis.error}`);
    
    let muteReason = ctx.author.id + ":";

    if (options.getString("reason").length > 0) {
      muteReason += options.getString("reason");
    } else {
      muteReason += "No reason provided."
    }

    // the equivalent of an infinite mute would be 1 week
    await member.timeout(options.getInteger("time") * 60 * 1000 || 7 * 24 * 60 * 60 * 1000, muteReason);
    return ctx.reply(`**${member.user.tag}** was muted. ${emojis.mute}`);
  }
}

module.exports = Mute;
