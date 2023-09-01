const Command = require("../../structures/Command.js");
const { request } = require("undici");
const emojis = require("../../structures/Emojis");

class Lewdneko extends Command {
  constructor(...args) {
    super(...args, {
      description: "lewdneko: lewd images of nekos (similar to catgirls)",
      usage: "lewdneko",
      nsfw: true,
    });
  }

  async run(ctx) {
    let data;
    try {
      data = await request(
        "https://api.waifu.pics/nsfw/neko"
      ).then(({ body }) => body.json());
    } catch (e) {
      return ctx.reply(`An error occurred with the image service. ${emojis.failure}`);
    }
    const embed = this.client
      .embed(ctx.author)
      .setTitle("Lewd Neko :eggplant:")
      .setImage(data.url);
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Lewdneko;
