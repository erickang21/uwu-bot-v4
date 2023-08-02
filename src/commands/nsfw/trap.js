const Command = require("../../structures/Command.js");
const { request } = require("undici");

class Trap extends Command {
  constructor(...args) {
    super(...args, {
      description: "[NSFW] Trap.",
      usage: "tra[",
      nsfw: true,
    });
  }

  async run(ctx) {
    const { url } = await request("https://api.waifu.pics/nsfw/trap").then(
      ({ body }) => body.json()
    );
    const embed = this.client
      .embed(ctx.author)
      .setTitle("Trap :eggplant:")
      .setImage(url);
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Trap;
