const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");

class Levelhelp extends Command {
  constructor(...args) {
    super(...args, {
      description: "Read about the new leveling system.",
      aliases: ["helplevel"],
    });
  }

  async run(ctx) {
    const embed = this.client.embed(ctx.author)
      .setTitle(`The Leveling System!`)
      .setDescription(`There's a whole new system to show off your loyalty to uwu bot! WTF is all this?! Let me break it down:

${emojis.racing} **Your Level ${emojis.level} and EXP ${emojis.xp} are global.** This means that your level belongs to the bot itself, and does not change between servers.

${emojis.blush} **Level up when your EXP ${emojis.xp} reaches a new threshold.** The threshold will increase as you level up, so don't get confused where your level up is at! The first few levels will fly by very quickly.

${emojis.pointup} **Gain experience passively.** You'll gain 1 EXP ${emojis.xp} per message in a server you share with uwu bot, and 5 EXP ${emojis.xp} per command you run on uwu bot. 

${emojis.blush} **Want a big boost in EXP?** Use \`uwu daily\` and upvote the bot to gain 200 EXP ${emojis.xp} instantly and a **x2 multiplier!** This will apply to all the passive EXP generation mentioned above too!

${emojis.dancing} **GO EVEN HARDER.** Your EXP ${emojis.xp} gain by chatting or running commands has a **x3 multiplier** when in [the official uwu bot server](https://discord.gg/vCMEmNJ)!

${emojis.takingnotes} **Check your profile at any time!** Run \`uwu profile\` to check your own, or \`uwu profile @user\` to check someone else's, if you're in the mood for competition.

${emojis.thumbsup} **Get notified upon leveling up!** You can enable notifications by running \`uwu levelnotify on\`. When your Level ${emojis.level} increases, you'll have a cute DM waiting for you! 

${emojis.pet} **We don't want to be annoying, though!** Level up notifications are **disabled** by default, and can be turned off at any time by running \`uwu levelnotify off\`.

${emojis.error} **Spice up your profile with a set of profile icons that expands as you level up!** This feature is coming soon...
`)
        .setTimestamp()
        .setColor(0x9590EE);
      return ctx.reply({ embeds: [embed] });
    

    
  }
}

module.exports = Levelhelp;
