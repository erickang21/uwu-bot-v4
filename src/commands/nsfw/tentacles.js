const Command = require("../../structures/Command.js");
const utils = require("../../utils/utils.js");
const { gelbooruAPI } = require("../../helpers/anime");

class Tentacles extends Command {
  constructor(...args) {
    super(...args, {
      description: "tentacles: an elongated flexible organ present in animals, usually doing something sexual",
      usage: "tentacles",
      nsfw: true,
    });
  }

  async run(ctx) {
    const result = await gelbooruAPI(["tentacles", "tentacle_sex"]);
    const urls = result.map((entry) => entry.file_url)
    const embed = this.client
      .embed(ctx.author)
      .setTitle("Tentacles :eggplant:")
      .setImage(utils.random(urls));
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Tentacles;
