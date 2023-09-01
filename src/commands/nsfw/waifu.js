const Command = require("../../structures/Command.js");
const { request } = require("undici");
const emojis = require("../../structures/Emojis");

class Waifu extends Command {
  constructor(...args) {
    super(...args, {
      description: "get a spicy pic of a waifu.",
      usage: "waifu",
      nsfw: true
    });
  }

  async run(ctx) {
    let data;
    try {
      data = await request(
        "https://api.waifu.pics/nsfw/waifu"
      ).then(({ body }) => body.json());
    } catch (e) {
      return ctx.reply(`An error occurred with the image service. ${emojis.failure}`);
    }
    const embed = this.client.embed(ctx.author).setTitle(`Waifu :eggplant:`).setImage(data.url);
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Waifu;
