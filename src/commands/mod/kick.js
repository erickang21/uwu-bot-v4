const Command = require("../../structures/Command.js");
const { EMOJIS } = require("../../utils/constants.js");

class Kick extends Command {
  constructor(...args) {
    super(...args, {
      description: "Kicks a user from a server.",
      userPermissions: ["KickMembers"],
      botPermissions: ["KickMembers"],
      guildOnly: true,
      usage: "kick <@​member> [reason]",
      options: [
        {
          name: "member",
          description: "The user you want to kick.",
          type: "member",
          required: true
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

    if(member.id === ctx.author.id) return ctx.reply("Baka! Why would you kick yourself?");
    if(member.id === this.client.user.id) return ctx.reply("Baka! Why would you kick me?");
    if(member.roles.highest.position >= ctx.member.roles.highest.position) return ctx.reply(`You can't kick this user. ${EMOJIS.ERROR}`);
    if(!member.kickable) return ctx.reply(`I can't kick this user! ${EMOJIS.ERROR}`);
    
    let kickReason = ctx.author.id + ":";

    if (options.getString("reason").length > 0) {
      kickReason += options.getString("reason");
    } else {
      kickReason += "No reason provided."
    }
    
    await member.kick(kickReason);
    return ctx.reply(`**${member.user.tag}** was kicked. ${EMOJIS.PUNCH}`);
  }
}

module.exports = Kick;
