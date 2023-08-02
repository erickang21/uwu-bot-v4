const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");

class Daily extends Command {
  constructor(...args) {
    super(...args, {
      description: "Instantly receive 200 XP and double your XP generation for the next 24 hours! Requires vote on top.gg.",
      aliases: ["dailyreward"],
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
    const userData = await this.client.syncUserSettings(ctx.author.id);
    // Defenses against older DB entries:
    if (!userData.dailyCooldown) userData.dailyCooldown = 0;
    if (!userData.multiplier) userData.multiplier = 1;
    if (Date.now() < userData.dailyCooldown) {
      return ctx.reply(`You baka! This command is still on cooldown. You better wait another **${this.getDuration(userData.dailyCooldown - Date.now())}** before asking again! ${emojis.ban}`)
    }
    const voted = await this.client.topgg.hasVoted(ctx.author.id);
    if (!voted) {
      const embed = this.client.embed(ctx.author.id)
        .setTitle(`You need to upvote for uwu bot to claim your daily rewards! ${emojis.mute}`)
        .setDescription(`With an upvote, you'll gain 200 ${emojis.xp} instantly and double your XP income from all sources for the next 24 hours!   

<:upvote:849393359378448444> [Upvote here!](https://top.gg/bot/${this.client.user.id}/vote) <:upvote:849393359378448444>

Run this command after you've upvoted to gain all the perks! ${emojis.salute}`)
        .setTimestamp()
        .setColor(0x9590EE);
      return ctx.reply({ embeds: [embed] });
    } else {
      
      userData.dailyCooldown = ctx.message.createdTimestamp + 86400000;
      userData.multiplier *= 2;
      let breakpoint = 100 * Math.floor(userData.level / 5) + 25 * userData.level;
      userData.exp += 200; // Ignore multiplier here, since we're applying it afterwards
      while (userData.exp >= breakpoint) {
        userData.level += 1;
        userData.exp -= breakpoint;
        breakpoint = 100 * Math.floor(userData.level / 5) + 25 * userData.level;
        if (userData.notify) {
          let desc = `${emojis.level} **Level:** ${userData.level - 1} ${emojis.shiningarrow} ${userData.level}\n${emojis.xp} **XP until next level:** ${userData.exp}/${breakpoint}`;
          if (userData.level % 5 === 0) desc += `\n\n**You also got:**\n:unlock: New profile icon slot!`
          const embed = this.client.embed(ctx.author)
            .setTitle(`You leveled up! ${emojis.thumbsup}`)
            .setDescription(desc);
          ctx.author.send({ embeds: [embed]});
        }
      }
      await this.client.userUpdate(ctx.author.id, userData);
      const embed = this.client.embed(ctx.author)
        .setTitle(`Thanks for upvoting uwu bot!`)
        .setDescription(`You don't understand how much it helps us. Really.\n\nAs a thank-you gift, enjoy 200 ${emojis.xp} and a **2x multiplier** for XP generation for the next 24 hours. You earned it. ${emojis.love}`);

      return ctx.reply({ embeds: [embed] });
    }

    
  }
}

module.exports = Daily;
