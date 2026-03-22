const Command = require("../../structures/Command.js");
const imageService = require("../../helpers/images.js");
const { AttachmentBuilder } = require("discord.js");

class Spank extends Command {
  constructor(...args) {
    super(...args, {
      description: "spank someone.",
      usage: "spank [user]",
      nsfw: true,
      options: [
        {
          name: "user",
          description: "the user you're doing it to",
          type: "user",
        },
      ],
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const result = imageService.getRandomImage("spank");
    if (!result) return ctx.reply("No images available. Please try again later.");
    const attachment = new AttachmentBuilder(result, { name: "image.jpg" });
    const embed = this.client
      .embed(ctx.author)
      .setTitle("Spank :eggplant:")
      .setImage("attachment://image.jpg");
    if (user.id !== ctx.author.id)
      embed.setTitle(
        `**${ctx.author.username}** is spanking **${user.username}**! :eggplant:`
      );
    return ctx.reply({ embeds: [embed], files: [attachment] });
  }
}

module.exports = Spank;
