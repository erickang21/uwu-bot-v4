const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");

class Leave extends Command {
  constructor(...args) {
    super(...args, {
      description: "Set leave messages for this server.",
      usage: "leave [on/off] [#channel] [message]",
      guildOnly: true,
      aliases: ["setleave"],
      extendedHelp: [
        "Use on to turn the message on and include arguments after, or use off to turn it off without any arguments after.",
        "#channel is a channel mention of where you want leave messages to be sent.",
        "Message is the message you want sent on leave. You may use these variables:",
        "{name} for the username.",
        "{members} for current member count.",
        "{server} for server name."
      ].join("\n")
    });
  }
  
  async run(ctx) {
    
    const guildSettings = await this.client.syncGuildSettingsCache(ctx.guild.id);
    let option = ctx.rawArgs.split(" ")[0];
    
    if (option) option = option.toLowerCase();
    else {
      if (!guildSettings.leave) return ctx.reply("The leave message for this server is **disabled.**");
      else if (!guildSettings.leave.channel) return ctx.reply("The leave message for this server is **disabled.**");
      else return ctx.reply(`The leave messages for this server is **enabled**. Messages will be sent in <#${guildSettings.leave.channel}>.`)
    }

    if(!ctx.member.permissions.has("MANAGE_GUILD"))
      return ctx.reply(`Baka! You need the \`Manage Server\` permissions to change the leave message. ${emojis.failure}`);
    if (option === "on") {
      const args = ctx.rawArgs.split(" ");
      let channelstr = args[1];
      if (!channelstr) return ctx.reply(`You did not provide a channel. ${emojis.failure}`);
      let channel = ctx.guild.channels.cache.get(channelstr.replace("<#", "").replace(">", ""));
      if (!channel) return ctx.reply(`You did not provide a channel. ${emojis.failure}`);
      args.splice(0, 2);
      let message = args.join(" ");
      if (!message || !message.length) return ctx.reply(`You did not provide a leave message. ${emojis.failure}`);
      this.client.guildUpdate(ctx.guild.id, { leave: { channel: channel.id, message: message } });
      ctx.reply(`The leave message for this server has successfully been updated. ${emojis.success}`)
    } else if (option === "off") {
      if (!guildSettings.leave) return ctx.reply("The leave message for this server is already off!");
      if (!guildSettings.leave.channel) return ctx.reply("The leave message for this server is already off!");
      else {
        this.client.guildUpdate(ctx.guild.id, { leave: {} });
        return ctx.reply(`The leave messages for this server have been disabled. ${emojis.success}`)
      }
    } else {
      return ctx.reply("Invalid usage of command. Use `uwu help leave` for details.")
    }
  
  }
}

module.exports = Leave;