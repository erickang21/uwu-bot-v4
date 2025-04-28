const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");
const { random } = require("../../utils/utils");

class Simp extends Command {
  constructor(...args) {
    super(...args, {
      description: "An interesting way to earn money.",
      cooldown: 300
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
    let amount = 2000 + Math.floor(Math.random() * 1000);
    const emoji = updatedServerEconomy[1].icon || ":banana:";
    updatedServerEconomy[ctx.author.id] += amount;
    this.client.guildUpdate(ctx.guild.id, { economy: updatedServerEconomy });
    const response = random([
      `You're cute when you're nice. Have **${amount}** ${emoji}.`,
      `I started simping for you, and donated **${amount}** ${emoji}.`,
      `Take all my money. Here's **${amount}** ${emoji}.`,
      `You're so classy that I had to give you **${amount}** ${emoji}.`,
      `I'll give you **${amount}** ${emoji} just for noticing me.`,
    ])
    return ctx.reply(response);
  }
}

module.exports = Simp;
