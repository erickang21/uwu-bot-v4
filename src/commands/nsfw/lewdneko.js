const Command = require("../../structures/Command.js");
const { request } = require("undici");

class Lewdneko extends Command {
  constructor(...args) {
    super(...args, {
      description: "lewdneko: lewd images of nekos (similar to catgirls)",
      usage: "lewdneko",
      nsfw: true,
    });
  }

  async run(ctx) {
    const { url } = await request("https://api.waifu.pics/nsfw/neko").then(
      ({ body }) => body.json()
    );
    const embed = this.client
      .embed(ctx.author)
      .setTitle("Lewd Neko :eggplant:")
      .setImage(url);
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Lewdneko;
