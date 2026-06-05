const Command = require("../../structures/Command.js");
const imageService = require("../../helpers/images.js");
const { getPurrbotAPI } = require("../../helpers/anime");
const { AttachmentBuilder } = require("discord.js");

class Yaoi extends Command {
  constructor(...args) {
    super(...args, {
      description: "yaoi: sexual interaction between two or more men",
      usage: "yaoi",
      nsfw: true,
    });
  }

  async run(ctx) {
    const { url } = await getPurrbotAPI("yaoi");
    if (url) {
      const embed = this.client
        .embed(ctx.author)
        .setTitle("Yaoi :eggplant:")
        .setImage(url);
      return ctx.reply({ embeds: [embed] });
    }
    const result = await imageService.getRandomNSFWImage("yaoi");
    if (!result) return ctx.reply("No images available. Please try again later.");
    const attachment = new AttachmentBuilder(result, { name: "image.jpg" });
    const embed = this.client
      .embed(ctx.author)
      .setTitle("Yaoi :eggplant:")
      .setImage("attachment://image.jpg");
    return ctx.reply({ embeds: [embed], files: [attachment] });
  }
}

module.exports = Yaoi;
