const Command = require("../../structures/Command.js");
const { request } = require("undici");
const utils = require("../../utils/utils.js");
const emojis = require("../../structures/Emojis");

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
      const data = await request(
        "https://api.waifu.im/search/?included_tags=hentai&gif=true"
      ).then(({ body }) => body.json());
      const embed = this.client
        .embed(ctx.author)
        .setTitle("Hentai :eggplant:")
        .setImage(data["images"][0]["url"]);
      return ctx.reply({ embeds: [embed] });
    } else {
      const tagListString = tags.toLowerCase().split(",").join("%20");
      const data = await request(
        `https://gelbooru.com/index.php?page=dapi&s=post&q=index&json=1&tags=${tagListString}%20-loli%20rating:explicit`
      ).then(({ body }) => body.json());
      if (!data.post?.length) return ctx.reply(`No results were found. ${emojis.failure}`);
      const urls = data.post.map((entry) => entry.file_url)
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
