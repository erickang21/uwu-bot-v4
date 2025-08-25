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
    if (!tags?.length) {
      let data;
      try {
        data = await request(
          "https://api.waifu.im/search/?included_tags=hentai&gif=true"
        ).then(({ body }) => body.json());
      } catch (e) {
        return ctx.reply(`An error occurred with the image service. ${emojis.failure}`);
      }
      const embed = this.client
        .embed(ctx.author)
        .setTitle("Hentai :eggplant:")
        .setImage(data["images"][0]["url"]);
      return ctx.reply({ embeds: [embed] });
    } else {
      const result = await gelbooruAPI(tags.toLowerCase().split(","));
      if (!result.length) return ctx.reply(`No results were found. ${emojis.failure}`);
      const urls = result.map((entry) => entry.file_url)
      const embed = this.client
        .embed(ctx.author)
        .setDescription(`**Tags:** ${tags.toLowerCase()}`)
        .setTitle("Hentai :eggplant:")
        .setImage(utils.random(urls));
      return ctx.reply({ embeds: [embed] });
    }
  }
    
}

module.exports = Hentai;
