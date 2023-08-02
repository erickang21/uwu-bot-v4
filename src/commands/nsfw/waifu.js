const Command = require("../../structures/Command.js");
const { request } = require("undici");

class Waifu extends Command {
  constructor(...args) {
    super(...args, {
      description: "[NSFW] Get a spicy pic of an anime waifu.",
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
