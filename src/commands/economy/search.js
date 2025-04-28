const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");
const { random } = require("../../utils/utils");

class Search extends Command {
  constructor(...args) {
    super(...args, {
      description: "Get some credits in the server. It's free real estate!",
      cooldown: 120
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
    let amount = 100 + Math.floor(Math.random() * 500);
    const emoji = updatedServerEconomy[1].icon || ":banana:";
    updatedServerEconomy[ctx.author.id] += amount;
    this.client.guildUpdate(ctx.guild.id, { economy: updatedServerEconomy });
    const response = random([
      `uwu you just found **${amount}** ${emoji}.`,
      `You lucky human. **${amount}** ${emoji} is yours.`,
      `You found **${amount}** ${emoji} under your sleeping mom.`,
      `You fished in your dad's wallet for **${amount}** ${emoji}.`,
      `You dug out a red pocket with **${amount}** ${emoji}.`,
      `**${amount}** ${emoji} came falling from the sky. And with the sky.`,
      `My personal gift, **${amount}** ${emoji} to you.`,
      `You picked up **${amount}** ${emoji} from the toilet.`
    ])
    return ctx.reply(response);
  }
}

module.exports = Search;
