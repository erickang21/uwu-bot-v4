const Command = require("../../structures/Command.js");
const imageService = require("../../helpers/images.js");
const { AttachmentBuilder } = require("discord.js");

class Tentacles extends Command {
  constructor(...args) {
    super(...args, {
      description: "tentacles: an elongated flexible organ present in animals, usually doing something sexual",
      usage: "tentacles",
      nsfw: true,
    });
  }

  async run(ctx) {
    const result = imageService.getRandomImage("tentacles");
    if (!result) return ctx.reply("No images available. Please try again later.");
    const attachment = new AttachmentBuilder(result, { name: "image.jpg" });
    const embed = this.client
      .embed(ctx.author)
      .setTitle("Tentacles :eggplant:")
      .setImage("attachment://image.jpg");
    return ctx.reply({ embeds: [embed], files: [attachment] });
  }
}

module.exports = Tentacles;
