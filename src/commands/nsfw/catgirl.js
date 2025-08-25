const Command = require("../../structures/Command.js");
const utils = require("../../utils/utils.js");
const { gelbooruAPI } = require("../../helpers/anime");

class Catgirl extends Command {
  constructor(...args) {
    super(...args, {
      description: "catgirl: characters with cat ears (nekomimi) on their head",
      usage: "catgirl",
      nsfw: true,
    });
  }

  async run(ctx) {
    const result = await gelbooruAPI(["solo", "catgirl", "cat_girl", "cat_ears"]);
    const urls = result.map((entry) => entry.file_url)
    const embed = this.client
      .embed(ctx.author)
      .setTitle("Catgirl :eggplant:")
      .setImage(utils.random(urls));
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Catgirl;
