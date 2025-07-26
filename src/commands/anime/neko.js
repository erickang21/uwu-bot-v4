const Command = require("../../structures/Command.js");
const { waifuAPI } = require("../../helpers/anime.js");

class Neko extends Command {
  constructor(...args) {
    super(...args, {
      description: "get a random picture of a neko!",
      usage: "neko",
    });
  }

  async run(ctx) {
    const url = await waifuAPI("neko");
    const embed = this.client.embed(ctx.author).setTitle(`Neko`).setImage(url);
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Neko;
