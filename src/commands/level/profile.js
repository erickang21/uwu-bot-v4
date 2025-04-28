const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");

class Profile extends Command {
  constructor(...args) {
    super(...args, {
      description: "displays your profile and current level.",
      aliases: ["pr"],
      options: [
        {
          name: "user",
          description: "(optional) the user whose profile you want to check",
          type: "user",
        },
      ],
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const userData = await this.client.settings.users.fetch(user.id);
    if (!userData.icons) {
      userData.icons = [];
    }
    let icons = '';
    const slotCount = Math.ceil((userData.level + 1) / 5);
      for (let i = 0; i < slotCount; i++) {
        icons += userData.icons[i] ? `${userData.icons[i]} ` : `${emojis.profileicon_blank} `;
      }
    icons += `:lock:`;
    let breakpoint = 100 * Math.floor(userData.level / 5) + 25 * userData.level;
    const embed = this.client.embed(user)
      .setTitle(user.id === ctx.author.id ? "Your Profile" : `Profile: ${user.username}`)
      .setDescription(`**Your Icons:**\n${icons}\n\n${emojis.level} **Level:** ${userData.level}\n${emojis.xp} **XP until next level:** ${userData.exp}/${breakpoint}${userData.multiplier > 1 ? `\n\n${emojis.sparkles} You currently have a **${userData.multiplier}x** multiplier active!` : ""}${ctx.guild.id === "372526440324923393" ? `\n\n${emojis.pet} You're currently in **${ctx.guild.name}**, which means you'll get a **x3 multiplier** for messages and commands used here!` : `\n\n${emojis.pointup} HELPFUL TIP: Chat more in [**uwu café ˚ʚ♡ɞ˚**](https://discord.gg/vCMEmNJ) to skyrocket your EXP gain! You'll gain a **x3 multiplier** while you chat there.`}\n\n:closed_lock_with_key: Unlock the next profile icon slot at level **${Math.ceil(userData.level / 5) * 5}**.`)
      .setThumbnail("https://cdn.discordapp.com/attachments/520734295112024064/1136078616661348472/849417442471706684.gif");

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Profile;
