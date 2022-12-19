const Command = require("../../structures/Command.js");
const { EMOJIS } = require("../../utils/constants.js");

class Unmute extends Command {
  constructor(...args) {
    super(...args, {
      description: "Removes a timeout restriction from a user.",
      userPermissions: ["ModerateMembers"],
      botPermissions: ["ModerateMembers"],
      aliases: ["untimeout"],
      guildOnly: true,
      usage: "unmute <@​member>",
      options: [
        {
          name: "member",
          description: "The user you want to unmute.",
          type: "member",
          required: true
        }
      ],
    });
  }

  async run(ctx, options) {
    const member = options.getMember("member");

    if(member.id === ctx.author.id) return ctx.reply("Baka! Why would you unmute yourself?");
    if(member.id === this.client.user.id) return ctx.reply("Baka! Why would you unmute me?");
    if(member.roles.highest.position >= ctx.member.roles.highest.position) return ctx.reply(`You can't unmute this user. ${EMOJIS.ERROR}`);
    
    let muteReason = ctx.author.id + ": Unmuted";

    await member.timeout(null, muteReason);
    return ctx.reply(`**${member.user.tag}** was unmuted. ${EMOJIS.GIRL_CHILLING}`);
  }
}

module.exports = Unmute;
