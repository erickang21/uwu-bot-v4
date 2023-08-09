const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");

class Kick extends Command {
  constructor(...args) {
    super(...args, {
      description: "kicks a user from your server.",
      userPermissions: ["KickMembers"],
      botPermissions: ["KickMembers"],
      guildOnly: true,
      usage: "kick <@​member> [reason]",
      options: [
        {
          name: "member",
          description: "the user you want to kick.",
          type: "user",
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

  async run(ctx, options) {
    const member = await ctx.guild.members.fetch(options.getUser("member"));

    if(member.id === ctx.author.id) return ctx.reply("Baka! Why would you kick yourself?");
    if(member.id === this.client.user.id) return ctx.reply("Baka! Why would you kick me?");
    if(member.roles.highest.position >= ctx.member.roles.highest.position) return ctx.reply(`You can't kick this user. ${emojis.error}`);
    if(!member.kickable) return ctx.reply(`I can't kick this user! ${emojis.error}`);
    
    let kickReason = ctx.author.id + ":";

    if (options.getString("reason").length > 0) {
      kickReason += options.getString("reason");
    } else {
      kickReason += "No reason provided."
    }
    
    await member.kick(kickReason);
    return ctx.reply(`**${member.user.tag}** was kicked. ${emojis.kick}`);
  }
}

module.exports = Kick;
