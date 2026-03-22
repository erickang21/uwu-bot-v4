const Command = require("../../structures/Command.js");
const { request } = require("undici");
const utils = require("../../utils/utils.js");
const emojis = require("../../structures/Emojis");
const { gelbooruAPI } = require("../../helpers/anime");
const imageService = require("../../helpers/images.js");
const { AttachmentBuilder } = require("discord.js");

class Hentai extends Command {
  constructor(...args) {
    super(...args, {
      description: "hentai - optionally, search for specific genres by adding tags, separated by commas.",
      usage: "hentai",
      nsfw: true,
      options: [
        {
          name: "tags",
          description: "desired genres. if a tag has spaces, use underscore (_). if adding multiple tags, separate with comma (,)",
          type: "string",
        },
      ],
    });
  }

  async run(ctx, options) {
    const tags = options.getString("tags");
    // TODO: Fix tags
    const result = imageService.getRandomImage("hentai");
    if (!result) return ctx.reply("No images available. Please try again later.");
    const attachment = new AttachmentBuilder(result, { name: "image.jpg" });
    const embed = this.client
      .embed(ctx.author)
      .setTitle("Hentai :eggplant:")
      .setImage("attachment://image.jpg");
    if (tags?.length) embed.setDescription(`**Tags:** ${tags.toLowerCase()}`);
    return ctx.reply({ embeds: [embed], files: [attachment] });
  }
}

module.exports = Hentai;
