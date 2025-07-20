const Command = require("../../structures/Command.js");
const { blueRightArrow } = require("../../structures/Emojis");

class Updates extends Command {
  constructor(...args) {
    super(...args, {
      description: "Shows the latest patch notes for uwu bot.",
      aliases: ["updateinfo", "update", "versioninfo"]
    });
  }

  /*
Another version update: v5.2

We're adding a new category!

__**Image Manipulation!**__
Slap your face (well...profile picture) onto some meme templates!

  __**Command Statistics Buffs**__
  I could go into a lot of boring dev talk, but TLDR: we're trying to understand you better! 
  - We're significantly improving command usage statistics. This means that we'll know what to focus on when providing future version updates!
  - We're also trying to understand which categories are used most frequently.
  */

  async run(ctx) {
    const embed = this.client
      .embed(this.client.user)
      .setTitle(`v5.4 of uwu bot has just dropped :)`)
      .setDescription(`This update fixes many bugs and unexplained errors. If you notice any other bugs, be sure to join the [support server](https://discord.gg/RASYKT4kMV) and voice your opinion in the suggestions or support channel!

__**No more erroring on missing permissions.**__
We understand that it was annoying to get the default error message for no reason. 
${blueRightArrow} For all moderation and customization commands, the error is due to missing permissions. This has been fixed now.
${blueRightArrow} And for other random commands like \`profileicon\`, the erroring has been fixed.

__**Performance buff.**__
Both regular and slash comamnds became way faster! We improved performance across the board.

__**Improved error reporting.**__
We sometimes couldn't help in the support channel  because some error information was missing. Now we've fixed that, and will be able to read all errors!`
      );
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Updates;
