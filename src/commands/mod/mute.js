const Command = require("../../structures/Command.js");
const { EMOJIS } = require("../../utils/constants.js");

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
          description: "The user you want to mute.",
          type: "member",
          required: true
        },
        {
            name: "time",
            description: "(Optional) The amount of time in minutes to mute this user for. Enter 0 for indefinite muting.",
            type: "integer"
        },
        {
            name: "reason",
            description: "(Optional) The reason for this action.",
            type: "string"
        }
      ],
    });
  }

  async run(ctx, options) {
    const member = options.getMember("member");

    if(member.id === ctx.author.id) return ctx.reply("Baka! Why would you mute yourself?");
    if(member.id === this.client.user.id) return ctx.reply("Baka! Why would you mute me?");
    if(member.roles.highest.position >= ctx.member.roles.highest.position) return ctx.reply(`You can't mute this user. ${EMOJIS.ERROR}`);
    
    let muteReason = ctx.author.id + ":";

    if (options.getString("reason").length > 0) {
      muteReason += options.getString("reason");
    } else {
      muteReason += "No reason provided."
    }

    // the equivalent of an infinite mute would be 1 week
    await member.timeout(options.getInteger("time") * 60 * 1000 || 7 * 24 * 60 * 60 * 1000, muteReason);
    return ctx.reply(`**${member.user.tag}** was muted. ${EMOJIS.PUNCH}`);
  }
}

module.exports = Mute;
