const Command = require("../../structures/Command.js");
const imageService = require("../../helpers/images.js");
const { AttachmentBuilder } = require("discord.js");

class Futanari extends Command {
  constructor(...args) {
    super(...args, {
      description: "futanari: female character with male genitalia",
      usage: "futanari",
      nsfw: true,
    });
  }

  async run(ctx) {
    const result = imageService.getRandomImage("futanari");
    if (!result) return ctx.reply("No images available. Please try again later.");
    const attachment = new AttachmentBuilder(result, { name: "image.jpg" });
    const embed = this.client
      .embed(ctx.author)
      .setTitle("Futanari :eggplant:")
      .setImage("attachment://image.jpg");
    return ctx.reply({ embeds: [embed], files: [attachment] });
  }
}

module.exports = Futanari;
