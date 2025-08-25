const Command = require("../../structures/Command.js");
const utils = require("../../utils/utils.js");
const { gelbooruAPI } = require("../../helpers/anime");

class Yaoi extends Command {
  constructor(...args) {
    super(...args, {
      description: "yaoi: sexual interaction between two or more men",
      usage: "yaoi",
      nsfw: true,
    });
  }

  async run(ctx) {
    const result = await gelbooruAPI(["yaoi", "2boys"]);
    const urls = result.map((entry) => entry.file_url)
    const embed = this.client
      .embed(ctx.author)
      .setTitle("Yaoi :eggplant:")
      .setImage(utils.random(urls));
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Yaoi;
