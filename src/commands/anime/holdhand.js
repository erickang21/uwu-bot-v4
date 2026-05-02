const Command = require("../../structures/Command.js");
const imageService = require("../../helpers/images.js");
const { AttachmentBuilder } = require("discord.js");

class Holdhand extends Command {
  constructor(...args) {
    super(...args, {
      description: "hold hands with that special someone...",
      usage: "holdhand [user]",
      options: [
        {
          name: "user",
          description: "the user you want to hold hands with",
          type: "user",
        },
      ],
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const result = await imageService.getRandomSFWImage("handhold");
    if (!result) return ctx.reply("No images available. Please try again later.");
    const attachment = new AttachmentBuilder(result, { name: "image.jpg" });
    const embed = this.client
      .embed(ctx.author)
      .setTitle(`HOLD HANDS! :3`)
      .setImage("attachment://image.jpg");
    if (user.id !== ctx.author.id)
      embed.setDescription(
        `**${ctx.author.username}** is holding hands with **${user.username}**!`
      );
    return ctx.reply({ embeds: [embed], files: [attachment] });
  }
}

module.exports = Holdhand;
