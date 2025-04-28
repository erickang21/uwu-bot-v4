const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");

class Freerealestate extends Command {
  constructor(...args) {
    super(...args, {
      description: "Get some credits in the server. It's free real estate!",
      cooldown: 120
    });
  }

  async run(ctx) {
    const guildSettings = this.client.settings.guilds.getDefaults(ctx.guild.id);
    let updatedServerEconomy = guildSettings.economy;
    if (!updatedServerEconomy) {
      updatedServerEconomy = { 1: { icon: ":banana:" }};
    }
    if (!updatedServerEconomy[ctx.author.id]) {
      updatedServerEconomy[ctx.author.id] = 0;
    }
    let amount = 1000 + Math.floor(Math.random() * 500);
    const emoji = updatedServerEconomy[1].icon || ":banana:";
    updatedServerEconomy[ctx.author.id] += amount;
    this.client.guildUpdate(ctx.guild.id, { economy: updatedServerEconomy });
    return ctx.reply(`Here's **${amount}** ${emoji}. It's FREE REAL ESTATE!`);
  }
}

module.exports = Freerealestate;
