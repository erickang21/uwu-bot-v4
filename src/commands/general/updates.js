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
      .setTitle(`v5.3 of uwu bot is HERE!`)
      .setDescription(`This update has been developed with **your (yes, YOUR) user suggestions** in mind. You can give your own by joining the [support server](https://discord.gg/RASYKT4kMV) and writing in the suggestions channel!

__**Audit logs for all moderation actions.**__
No more being a bad boy! Moderators can now see all previous actions taken against someone. (warn, mute, kick, ban)
${blueRightArrow} \`uwu audit @user\` to see all actions taken against them, listed as most recent first.
${blueRightArrow} \`uwu audit @user warn\` to see only warnings, for example.
**Please note:** This only records actions taken with uwu bot. It also doesn't apply retroactively (it won't show actions taken before this update was released.)

__**Command Enable/Disable**__
If you don't like a command on uwu bot, you can do something about it! Server moderators can restrict usage of commands to certain roles or disable them entirely.
For a full explanation on how that works, type \`uwu command help\`.

__**The "banana" economy is back, and better than ever.**__
For the nostalgic feeling of the old uwu bot economy system, I've added it back! Each user now has a server-specific balance of 0 :banana:.
${blueRightArrow} You can gain bananas using: dailycredits(!), freerealestate, gamble, search, simp, work. You can also be generous and use \`pay\` to give your credits to others!
${blueRightArrow} Server moderators can manually hand out currency using \`give\`, like before.
${blueRightArrow} Compete with your friends by checking your ranking using \`lb\`.
${blueRightArrow} Here's the new and improved part - you can customize the currency icon to whatever you want! So if you don't like bananas :banana:, a server moderator can use \`uwu setcurrency [emoji]\` using a custom or default emoji of their choice.
(If you would like a per-server role shop to be implemented, join the support server and voice your opinion in the suggestions channel!)
(!: Not to be confused with \`daily\`, which is for leveling up your profile.)

__**And some other changes.**__
${blueRightArrow} **New rizz command!** Let uwu bot be your wing(man? woman? idk), and type \`uwu rizz @user\` to send them a sweet pickup line.
${blueRightArrow} **Indecisive? We got you.** Type \`uwu choose choice1,choice2,choice3...\` to let uwu bot help you decide!
${blueRightArrow} The \`ship\` and \`rate\` command have been given a makeover and are a lot more user friendly to look at.
${blueRightArrow} Lots of broken emojis all over the place were fixed.
${blueRightArrow} Optimizations across the board.
${blueRightArrow} **We catch errors properly now!** So if you come to our server with an error code, we'll be more than happy to pinpoint the exact issue. Don't be afraid to do that!

If you are enjoying this update, be sure to give us a good rating [here](https://top.gg/bot/520682706896683009#reviews)! `
      );
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Updates;
