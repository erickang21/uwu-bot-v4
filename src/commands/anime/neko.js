const Command = require("../../structures/Command.js");
const { nekoAPI } = require("../../helpers/anime.js");

class Neko extends Command {
  constructor(...args) {
    super(...args, {
      description: "get a random picture of a neko!",
      usage: "neko",
    });
  }

  async run(ctx) {
    const url = await nekoAPI("neko");
    const embed = this.client.embed(ctx.author).setTitle(`Neko`).setImage(url);
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Neko;
