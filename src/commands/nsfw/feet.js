const Command = require("../../structures/Command.js");
const utils = require("../../utils/utils.js");
const { gelbooruAPI } = require("../../helpers/anime");

class Feet extends Command {
  constructor(...args) {
    super(...args, {
      description: "feet: focuses on the character's feet",
      usage: "feet",
      nsfw: true,
    });
  }

  async run(ctx) {
    const result = await gelbooruAPI(["solo", "toes", "barefoot", "feet", "legs"]);
    const urls = result.map((entry) => entry.file_url)
    const embed = this.client
      .embed(ctx.author)
      .setTitle("Feet :eggplant:")
      .setImage(utils.random(urls));
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Feet;
