const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");

class Modlog extends Command {
  constructor(...args) {
    super(...args, {
      description: "be notified of any member actions in a private channel.",
      usage: "modlog <on/off> <#channel>",
      guildOnly: true,
      aliases: ["setmodlog"],
      userPermissions: ["ManageGuild"],
      options: [
        {
          name: "action",
          description: "the action to take",
          type: "string",
        },
        {
          name: "channel",
          description: "channel to send mod logs in",
          type: "channel",
        }
      ],
    });
  }
  
  async run(ctx, options) {
    const guildSettings = this.client.settings.guilds.get(ctx.guild.id);
    let option = options.getString("action");
    
    if (option) option = option.toLowerCase();
    else {
      if (!guildSettings.modlog) return ctx.reply("The modlog for this server is **disabled.**");
      else return ctx.reply(`The modlog for this server is **enabled**. Messages will be sent in <#${guildSettings.modlog}>.`)
    }

    if (option === "on") {
      const channel = options.getChannel("channel");
      if (!channel) return ctx.reply(`You did not provide a channel. ${emojis.failure}`);
      this.client.guildUpdate(ctx.guild.id, { modlog: channel.id });
      ctx.reply(`The modlog for this server has successfully been enabled. ${emojis.success}`)
    } else if (option === "off") {
      if (!guildSettings.modlog) return ctx.reply("The modlog for this server is already off!");
      else {
        this.client.guildUpdate({ modlog: null });
        return ctx.reply(`The modlog for this server has been disabled. ${emojis.success}`)
      }
    } else {
      return ctx.reply("Invalid usage of command. Use `uwu help modlog` for details.")
    }
  
  }
}

module.exports = Modlog;
