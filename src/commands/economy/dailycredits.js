const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");

class Dailycredits extends Command {
  constructor(...args) {
    super(...args, {
      description: "Get some bonus credits by upvoting uwu bot on Top.gg!",
      cooldown: 12 * 60 * 60 // 12 hours
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
    let amount = 3000;
    const emoji = updatedServerEconomy[1].icon || ":banana:";
    const voted = await this.client.topgg.hasVoted(ctx.author.id);
    if (!voted) {
      const embed = this.client.embed(ctx.author)
        .setTitle(`Want a head-start in all servers you're in? ${emojis.LoveLetter}`)
        .setDescription(`Click the link below to upvote, which will get you an additional **3000** ${emoji}! Pretty neat, huh?  

<:upvote:849393359378448444> [Upvote here!](https://top.gg/bot/${this.client.user.id}/vote) <:upvote:849393359378448444>

Run this command after you've upvoted to gain all the perks! ${emojis.salute}`)
        .setColor(0x9590EE)
        .setFooter({ text: "An upvote helps us maintain uwu bot a LOT better! Thanks for your support."})
      return ctx.reply({ embeds: [embed] });
    }
    updatedServerEconomy[ctx.author.id] += amount;
    this.client.guildUpdate(ctx.guild.id, { economy: updatedServerEconomy });
    return ctx.reply(`A kind and cute soul like you deserves **${amount}** ${emoji}. It's all yours!`);
  }
}

module.exports = Dailycredits;
