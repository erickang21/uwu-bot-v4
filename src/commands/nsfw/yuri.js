const Command = require("../../structures/Command.js");
const utils = require("../../utils/utils.js");
const { gelbooruAPI } = require("../../helpers/anime");

class Yuri extends Command {
  constructor(...args) {
    super(...args, {
      description: "yuri: sexual interaction between two or more women",
      usage: "yuri",
      nsfw: true,
      extendedHelp: "yuri is the sexual interaction between two or more women - it doesn't matter if it's mutual or one-sided.\n\n\"it's one of those days. pass the yuri.\" - someone special <3"
    });
  }

  async run(ctx) {
    const result = await gelbooruAPI(["yuri", "2girls"]);
    const urls = result.map((entry) => entry.file_url)
    const embed = this.client
      .embed(ctx.author)
      .setTitle("Yuri :eggplant:")
      .setImage(utils.random(urls));
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Yuri;
