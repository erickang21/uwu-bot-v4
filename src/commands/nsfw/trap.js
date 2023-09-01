const Command = require("../../structures/Command.js");
const { request } = require("undici");
const emojis = require("../../structures/Emojis");

class Trap extends Command {
  constructor(...args) {
    super(...args, {
      description: "trap: male characters that have the apperance of a female",
      usage: "trap",
      nsfw: true,
    });
  }

  async run(ctx) {
    let data;
    try {
      data = await request(
        "https://api.waifu.pics/nsfw/trap"
      ).then(({ body }) => body.json());
    } catch (e) {
      return ctx.reply(`An error occurred with the image service. ${emojis.failure}`);
    }
    const embed = this.client
      .embed(ctx.author)
      .setTitle("Trap :eggplant:")
      .setImage(data.url);
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Trap;
