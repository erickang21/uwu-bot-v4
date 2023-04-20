const Command = require("../../structures/Command.js");
const { EMOJIS } = require("../../utils/constants.js");

class Welcome extends Command {
  constructor(...args) {
    super(...args, {
      description: "Set welcome messages for this server.",
      usage: "welcome [on/off] [#channel] [message]",
      guildOnly: true,
      aliases: ["setwelcome"],
      extendedHelp: [
        "Use on to turn the message on and include arguments after, or use off to turn it off without any arguments after.",
        "#channel is a channel mention of where you want welcome messages to be sent.",
        "Message is the message you want sent on welcome. You may use these variables:",
        "{name} for the username.",
        "{mention} for mentioning the user.",
        "{members} for current member count.",
        "{server} for server name."
      ].join("\n")
    });
  }
  
  async run(ctx, [option, channel, ...message]) {
    const guildSettings = await this.client.getGuildSettings(ctx.guild.id)
    if (option) option = option.toLowerCase();
    else {
      if (!guildSettings.welcome) return ctx.reply("The welcome message for this server is **disabled.**");
      else if (!guildSettings.welcome.channel) return ctx.reply("The welcome message for this server is **disabled.**");
      else return ctx.reply(`The welcome messages for this server is **enabled**. Messages will be sent in <#${guildSettings.welcome.channel}>.`)
    }

    if(!ctx.member.permissions.has("MANAGE_GUILD"))
      return ctx.reply("Baka! You need the `Manage Server` permissions to change the welcome message.");
    if (option === "on") {
      channel = await this.verifyChannel(ctx, channel)
      message = message.join(" ")
      if (!message.length) return ctx.reply("You did not provide a welcome message.")
      ctx.guild.update({ welcome: { channel: channel.id, message: message } });
      ctx.reply(`The welcome message for this server has successfully been updated. ${this.client.constants.checkmark}`)
    } else if (option === "off") {
      if (!guildSettings.welcome) return ctx.reply("The welcome message for this server is already off!");
      if (!guildSettings.welcome.channel) return ctx.reply("The welcome message for this server is already off!");
      else {
        ctx.guild.update({ welcome: { channel: null, message: null } });
        return ctx.reply(`The welcome messages for this server have been disabled.`)
      }
    } else {
      return ctx.reply("Invalid usage of command. Use `uwu help welcome` for details.")
    }
  
  }
}

module.exports = Welcome;
