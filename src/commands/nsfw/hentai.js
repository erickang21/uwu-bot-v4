const Command = require("../../structures/Command.js");
const imageService = require("../../helpers/images.js");
const { getWaifuIm } = require("../../helpers/anime");
const { AttachmentBuilder } = require("discord.js");

class Hentai extends Command {
  constructor(...args) {
    super(...args, {
      description: "hentai - optionally, search for specific genres by adding tags, separated by commas.",
      usage: "hentai",
      nsfw: true,
    });
  }

  async run(ctx) {
    const { url } = await getWaifuIm({ includedTags: "hentai", isNsfw: true, isAnimated: true });
    if (url) {
      const embed = this.client
        .embed(ctx.author)
        .setTitle("Hentai :eggplant:")
        .setImage(url);
      return ctx.reply({ embeds: [embed] });
    }
    const result = await imageService.getRandomNSFWImage("hentai");
    if (!result) return ctx.reply("No images available. Please try again later.");
    const attachment = new AttachmentBuilder(result, { name: "image.jpg" });
    const embed = this.client
      .embed(ctx.author)
      .setTitle("Hentai :eggplant:")
      .setImage("attachment://image.jpg");
    return ctx.reply({ embeds: [embed], files: [attachment] });
  }
}

module.exports = Hentai;
