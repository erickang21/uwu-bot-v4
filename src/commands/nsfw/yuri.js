const Command = require("../../structures/Command.js");
const { request } = require("undici");
const utils = require("../../utils/utils.js");

class Yuri extends Command {
  constructor(...args) {
    super(...args, {
      description: "yuri: sexual interaction between two or more women",
      usage: "yuri",
      nsfw: true,
      extendedHelp: "yuri is the sexual interaction between two or more women - it doesn't matter if it's mutual or one-sided.\n\n\"it's one of those days. pass the yuri.\" - someone special <3"
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
