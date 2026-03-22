const Command = require("../../structures/Command.js");
const imageService = require("../../helpers/images.js");
const { AttachmentBuilder } = require("discord.js");

class Kemonomimi extends Command {
  constructor(...args) {
    super(...args, {
      description: "kemonomimi: characters with animal ears",
      usage: "kemonomimi",
      nsfw: true,
    });
  }

  async run(ctx) {
    const result = imageService.getRandomImage("kemonomimi");
    if (!result) return ctx.reply("No images available. Please try again later.");
    const attachment = new AttachmentBuilder(result, { name: "image.jpg" });
    const embed = this.client
      .embed(ctx.author)
      .setTitle("Kemonomimi :eggplant:")
      .setImage("attachment://image.jpg");
    return ctx.reply({ embeds: [embed], files: [attachment] });
  }
}

module.exports = Kemonomimi;
