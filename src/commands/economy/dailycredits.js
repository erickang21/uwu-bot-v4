const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");

class Dailycredits extends Command {
  constructor(...args) {
    super(...args, {
      description: "Get some bonus credits by upvoting uwu bot on Top.gg!",
    });
  }

  getDuration(time) {
    const seconds = Math.floor(time / 1000) % 60 ;
    const minutes = Math.floor((time / (1000 * 60)) % 60);
    const hours = Math.floor((time / (1000 * 60 * 60)) % 24);
    const days = Math.floor((time / (1000 * 60 * 60 * 24)) % 7);
    return [`${days} days`, `${hours} hours`, `${minutes} minutes`,
      `${seconds} seconds`].filter((time) => !time.startsWith("0")).join(", ");
  }

  async run(ctx) {

    const guildSettings = this.client.settings.guilds.get(ctx.guild.id);
    const cooldowns = guildSettings.dailyCreditsCooldown || {};
    if (cooldowns && cooldowns[ctx.author.id] && Date.now() < cooldowns[ctx.author.id]) {
      return ctx.reply(`You baka! This command is still on cooldown. You better wait another **${this.getDuration(cooldowns[ctx.author.id] - Date.now())}** before asking again! ${emojis.ban}`)
    }
    let updatedServerEconomy = guildSettings?.economy;
    if (!updatedServerEconomy) {
      updatedServerEconomy = {};
    }
    if (!updatedServerEconomy[ctx.author.id]) {
      updatedServerEconomy[ctx.author.id] = 0;
    }
    let amount = 3000;
    const emoji = guildSettings?.economyIcon || ":banana:";
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
    cooldowns[ctx.author.id] = Date.now() + 12 * 60 * 60 * 1000; // Update cooldown
    this.client.guildUpdate(ctx.guild.id, { economy: updatedServerEconomy, dailyCreditsCooldown: cooldowns });
    return ctx.reply(`A kind and cute soul like you deserves **${amount}** ${emoji}. It's all yours!`);
  }
}

module.exports = Dailycredits;
