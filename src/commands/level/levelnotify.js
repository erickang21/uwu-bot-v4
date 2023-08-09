const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");

class Levelnotify extends Command {
  constructor(...args) {
    super(...args, {
      description: "allow the bot to notify you when you've leveled up!",
      usage: "levelnotify [on/off]",
      guildOnly: true,
      aliases: ["lvnotify"]
    });
  }
  
  async run(ctx) {
    const userData = await this.client.syncUserSettings(ctx.author.id);
    let option = ctx.rawArgs.split(" ")[0];
    
    if (option) option = option.toLowerCase();
    else {
      if (!userData.notify) return ctx.reply("You currently **do not** receive notifications for leveling up.");
      else return ctx.reply(`You currently **do** receive notifications in DMs for leveling up!`)
    }

    if (option === "on") {
      if (userData.notify) return ctx.reply(`Level-up notifications have already been enabled! ${emojis.failure}`);
      userData.notify = true;
      await this.client.userUpdate(ctx.author.id, userData);
      return ctx.reply(`Level-up notifications have successfully been enabled. ${emojis.success}`)
    } else if (option === "off") {
      if (!userData.notify) return ctx.reply(`Level-up notifications have already been disabled! ${emojis.failure}`);
      userData.notify = false;
      await this.client.userUpdate(ctx.author.id, userData);
      return ctx.reply(`Level-up notifications have successfully been disabled. ${emojis.success}`)
    } else {
      return ctx.reply("Invalid usage of command. Use `uwu help levelnotify` for details.")
    }
  
  }
}

module.exports = Levelnotify;
