const Command = require("../../structures/Command.js");
const utils = require("../../utils/utils.js");
const { request } = require("undici");
const emojis = require("../../structures/Emojis");

class Catgirl extends Command {
  constructor(...args) {
    super(...args, {
      description: "catgirl: characters with cat ears (nekomimi) on their head",
      usage: "catgirl",
      nsfw: true,
    });
  }

  async run(ctx) {
    let data;
    try {
      data = await request(
        "https://gelbooru.com/index.php?page=dapi&s=post&q=index&json=1&tags=solo%20catgirl%20cat_girl%20cat_ears%20-loli%20rating:explicit"
      ).then(({ body }) => body.json());
    } catch (e) {
      return ctx.reply(`An error occurred with the image service. ${emojis.failure}`);
    }
    const urls = data.post.map((entry) => entry.file_url)
    const embed = this.client
      .embed(ctx.author)
      .setTitle("Catgirl :eggplant:")
      .setImage(utils.random(urls));
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Catgirl;
