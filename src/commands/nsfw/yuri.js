const Command = require("../../structures/Command.js");
const { request } = require("undici");
const utils = require("../../utils/utils.js");

class Yuri extends Command {
  constructor(...args) {
    super(...args, {
      description: "[NSFW] Yuri.",
      usage: "yuri",
      nsfw: true,
    });
  }

  async run(ctx) {
    const data = await request(
      "https://gelbooru.com/index.php?page=dapi&s=post&q=index&json=1&tags=yuri%202girls%20-loli%20rating:explicit"
    ).then(({ body }) => body.json());
    const urls = data.post.map((entry) => entry.file_url)
    const embed = this.client
      .embed(ctx.author)
      .setTitle("Yuri :eggplant:")
      .setImage(utils.random(urls));
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Yuri;
