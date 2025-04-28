const Command = require("../../structures/Command.js");


class Gamble extends Command {
  constructor(...args) {
    super(...args, {
      description: "You could potentially gain or lose money with this command.",
      usage: "gamble",
      cooldown: 600
    });
  }

  async run(ctx) {
    const guildSettings = this.client.settings.guilds.get(ctx.guild.id);
    let updatedServerEconomy = guildSettings.economy;
    if (!updatedServerEconomy) {
      updatedServerEconomy = { 1: { icon: ":banana:" }};
    }
    if (!updatedServerEconomy[ctx.author.id]) {
      updatedServerEconomy[ctx.author.id] = 0;
    }
    const balance = updatedServerEconomy[ctx.author.id];
    const emoji = updatedServerEconomy[1].icon || ":banana:";
    let amount = 0;
    if (balance < 2000) amount = -balance + Math.floor(Math.random() * 4000);
    else amount = -2000 + Math.floor(Math.random() * 4000);
    updatedServerEconomy[ctx.author.id] += amount;
    this.client.guildUpdate(ctx.guild.id, { economy: updatedServerEconomy });
    if (amount < 0) return ctx.reply(`You unfortunately lost **${Math.abs(amount)}** ${emoji}. Better luck next time~`)
    if (amount >= 0) return ctx.reply(`Take a sigh of relief! You won **${Math.abs(amount)}** ${emoji} this time.`)
  }

}

module.exports = Gamble;