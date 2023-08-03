const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");

class Modlog extends Command {
  constructor(...args) {
    super(...args, {
      description: "Set welcome messages for this server.",
      usage: "modlog [on/off] [#channel]",
      guildOnly: true,
      aliases: ["setmodlog"]
    });
  }
  
  async run(ctx) {
    const guildSettings = await this.client.syncGuildSettingsCache(ctx.guild.id);
    let option = ctx.rawArgs.split(" ")[0];
    
    if (option) option = option.toLowerCase();
    else {
      if (!guildSettings.modlog) return ctx.reply("The modlog for this server is **disabled.**");
      else return ctx.reply(`The modlog for this server is **enabled**. Messages will be sent in <#${guildSettings.modlog}>.`)
    }

    if(!ctx.member.permissions.has("MANAGE_GUILD"))
      return ctx.reply(`Baka! You need the \`Manage Server\` permissions to change modlogs. ${emojis.failure}`);
    if (option === "on") {
      const args = ctx.rawArgs.split(" ");
      let channelstr = args[1];
      if (!channelstr) return ctx.reply(`You did not provide a channel. ${emojis.failure}`);
      let channel = ctx.guild.channels.cache.get(channelstr.replace("<#", "").replace(">", ""));
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
