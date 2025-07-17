const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");

class Prefix extends Command {
  constructor(...args) {
    super(...args, {
      description: "set/reset a custom prefix for the bot.",
      usage: "prefix <[prefix]/reset>",
      guildOnly: true,
      aliases: ["setprefix"],
      userPermissions: ["ManageGuild"],
      options: [
        {
          name: "prefix",
          description: "the prefix to use. enter \"reset\" to use the default.",
          type: "string",
        },
      ]
    });
  }
  
  async run(ctx, options) {
    const guildSettings = this.client.settings.guilds.get(ctx.guild.id);
    let prefix = options.getString("prefix");
    
    if (!prefix) {
      if (!guildSettings.prefix) return ctx.reply("I'm using the default prefix! Type `uwu [command]` to use me.");
      else return ctx.reply(`I currently have a custom prefix! Type \`${guildSettings.prefix} [command]\` to use me.`);
    }
    if (prefix.toLowerCase() === "off" || prefix.toLowerCase() === "reset" || prefix.toLowerCase() === "default") {
      await this.client.guildUpdate(ctx.guild.id, { prefix: null });
      ctx.reply(`The custom prefix has been reset. ${emojis.success}`)
    } else {
      this.client.guildUpdate(ctx.guild.id, { prefix });
      return ctx.reply(`The custom prefix has been set to: \`${prefix}\`. ${emojis.success}\n\nIf you ever forget, just mention me and I'll remind you! You can reset it with \`uwu prefix reset\`.`)
    }
  }
}

module.exports = Prefix;
