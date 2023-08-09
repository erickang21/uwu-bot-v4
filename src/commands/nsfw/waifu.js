const Command = require("../../structures/Command.js");
const { request } = require("undici");

class Waifu extends Command {
  constructor(...args) {
    super(...args, {
      description: "get a spicy pic of a waifu.",
      usage: "waifu",
      nsfw: true
    });
  }

  async run(ctx) {
    const { url } = await request("https://api.waifu.pics/nsfw/waifu").then(
      ({ body }) => body.json()
    );
    const embed = this.client.embed(ctx.author).setTitle(`Waifu :eggplant:`).setImage(url);
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Waifu;
