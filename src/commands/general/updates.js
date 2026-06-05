const Command = require("../../structures/Command.js");

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
      .setTitle(`v5.5 of uwu bot has arrived!!`)
      .setDescription(`This update adds some long-awaited buffs to the anime features!

**Arguably the biggest improvement:** You can now see the source of an anime GIF! When using commands in the Anime category, you can see the name of the anime at the bottom, on the footer. A big shoutout to [Nekos.best](https://nekos.best/) for the data :)

We've also boosted image quality for some commands, with some shiny new APIs!

${ctx.channel.nsfw ? `We've also greatly improved some NSFW commands in the process, now using GIFs instead of boring old images!

The following commands have been improved: blowjob, cum, fuck, genshin, hentai, yaoi, yuri

We've also ADDED new commands!! Try out: anal, maid, titties
` : ""}

We're implementing lots of analytics to help understand you better! But as usual, the best way is to submit suggestions in the [support server](https://discord.gg/RASYKT4kMV).
`);
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Updates;
