const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");

class Ban extends Command {
  constructor(...args) {
    super(...args, {
      description: "Bans a user from a server.",
      userPermissions: ["BanMembers"],
      botPermissions: ["BanMembers"],
      guildOnly: true,
      usage: "ban <@​member> [reason]",
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
      ]
    });
  }

  async run(ctx, options) {
    const member = options.getMember("member");

    if(member.id === ctx.author.id) return ctx.reply("Baka! Why would you ban yourself?");
    if(member.id === this.client.user.id) return ctx.reply("Baka! Why would you ban me?");
    if(member.roles.highest.position >= ctx.member.roles.highest.position) return ctx.reply(`You can't ban this user. ${emojis.error}`);
    if(!member.bannable) return ctx.reply(`I can't ban this user! ${emojis.error}`);
    
    const data = { deleteMessageSeconds: 60 * 60 * 24 * 7 };
    let banReason = ctx.author.id + ":";

    if (options.getString("reason").length > 0) {
      banReason += options.getString("reason");
    } else {
      banReason += "No reason provided."
    }
    data.reason = banReason;
    await member.ban(data);
    return ctx.reply(`**${member.user.tag}** was banned. ${emojis.ban}`);
  }
}

module.exports = Ban;
