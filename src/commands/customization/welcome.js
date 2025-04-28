const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");

class Welcome extends Command {
  constructor(...args) {
    super(...args, {
      description: "set a message to be sent when a user joins your server.",
      usage: "welcome <on/off> <#channel> <message>",
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
      ].join("\n"),
      options: [
        {
          name: "action",
          description: "the action to take",
          type: "string",
        },
        {
          name: "feed",
          description: "the channel to set the logs in",
          type: "channel",
        },
        {
          name: "message",
          description: "the message to use. use \"uwu help welcome\" to see syntax",
          type: "string",
        }
      ]
    });
  }
  
  async run(ctx, options) {
    const guildSettings = this.client.settings.guilds.get(ctx.guild.id);
    let option = options.getString("action");
    
    if (option) option = option.toLowerCase();
    else {
      if (!guildSettings.welcome) return ctx.reply("The welcome message for this server is **disabled.**");
      else if (!guildSettings.welcome.channel) return ctx.reply("The welcome message for this server is **disabled.**");
      else return ctx.reply(`The welcome messages for this server is **enabled**. Messages will be sent in <#${guildSettings.welcome.channel}>.`)
    }

    if(!ctx.member.permissions.has("MANAGE_GUILD"))
      return ctx.reply(`Baka! You need the \`Manage Server\` permissions to change the welcome message. ${emojis.failure}`);
    if (option === "on") {
      const channel = options.getChannel("feed");
      if (!channel) return ctx.reply(`You did not provide a channel. ${emojis.failure}`);
      let message = options.getString("message");
      if (!message || !message.length) return ctx.reply("You did not provide a welcome message.");
      this.client.guildUpdate(ctx.guild.id, { welcome: { channel: channel.id, message: message } });
      ctx.reply(`The welcome message for this server has successfully been updated. ${emojis.success}`)
    } else if (option === "off") {
      if (!guildSettings.welcome) return ctx.reply("The welcome message for this server is already off!");
      if (!guildSettings.welcome.channel) return ctx.reply("The welcome message for this server is already off!");
      else {
        this.client.guildUpdate(ctx.guild.id, { welcome: {} });
        return ctx.reply(`The welcome messages for this server have been disabled. ${emojis.success}`)
      }
    } else {
      return ctx.reply("Invalid usage of command. Use `uwu help welcome` for details.")
    }
  
  }
}

module.exports = Welcome;
