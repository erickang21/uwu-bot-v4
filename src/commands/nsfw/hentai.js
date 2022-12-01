const Command = require("../../structures/Command.js");
const { request } = require("undici");

class Hentai extends Command {
  constructor(...args) {
    super(...args, {
      description: "[NSFW] Hentai.",
      usage: "hentai",
      nsfw: true,
    });
  }

  async run(ctx) {
    const data = await request(
      "https://api.waifu.im/search/?included_tags=hentai&gif=true"
    ).then(({ body }) => body.json());
    const embed = this.client
      .embed(ctx.author)
      .setTitle("Hentai :eggplant:")
      .setImage(data["images"][0]["url"]);
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Hentai;
