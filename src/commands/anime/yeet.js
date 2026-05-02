const Command = require("../../structures/Command.js");
const imageService = require("../../helpers/images.js");
const { AttachmentBuilder } = require("discord.js");

class Yeet extends Command {
  constructor(...args) {
    super(...args, {
      description: "get rid of them once and for all! yeet them.",
      usage: "yeet [user]",
      options: [
        {
          name: "user",
          description: "the user you want to yeet",
          type: "user",
        },
      ],
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const result = await imageService.getRandomSFWImage("yeet");
    if (!result) return ctx.reply("No images available. Please try again later.");
    const attachment = new AttachmentBuilder(result, { name: "image.gif" });
    const embed = this.client
      .embed(ctx.author)
      .setTitle(`YEET >:)`)
      .setImage("attachment://image.gif");
    if (user.id !== ctx.author.id)
      embed.setDescription(
        `**${ctx.author.username}** is yeeting **${user.username}**! See you later!`
      );
    return ctx.reply({ embeds: [embed], files: [attachment] });
  }
}

module.exports = Yeet;
