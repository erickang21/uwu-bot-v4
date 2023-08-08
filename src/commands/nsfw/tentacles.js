const Command = require("../../structures/Command.js");
const utils = require("../../utils/utils.js");
const { request } = require("undici");

class Tentacles extends Command {
  constructor(...args) {
    super(...args, {
      description: "[NSFW] Tentacles.",
      usage: "tentacles",
      nsfw: true,
    });
  }

  async run(ctx) {
    // TODO: Change url
    const data = await request(
      "https://gelbooru.com/index.php?page=dapi&s=post&q=index&json=1&tags=solo%20catgirl%20cat_girl%20cat_ears%20-loli%20rating:explicit"
    ).then(({ body }) => body.json());
    const urls = data.post.map((entry) => entry.file_url)
    const embed = this.client
      .embed(ctx.author)
      .setTitle("Tentacles :eggplant:")
      .setImage(utils.random(urls));
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Tentacles;
