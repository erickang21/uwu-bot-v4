const Command = require("../../structures/Command.js");
const { request } = require("undici");
const utils = require("../../utils/utils.js");
const emojis = require("../../structures/Emojis");
const { gelbooruAPI } = require("../../helpers/anime");

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
    const result = await gelbooruAPI(tags?.length ? tags.toLowerCase().split(",") : ["hentai"]);
    if (!result.length) return ctx.reply(`No results were found. ${emojis.failure}`);
    const urls = result.map((entry) => entry.file_url)
    const embed = this.client
      .embed(ctx.author)
      .setTitle("Hentai :eggplant:")
      .setImage(utils.random(urls));
    if (tags?.length) embed.setDescription(`**Tags:** ${tags.toLowerCase()}`);
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Hentai;
