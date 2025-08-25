const Command = require("../../structures/Command.js");
const utils = require("../../utils/utils.js");
const { gelbooruAPI } = require("../../helpers/anime");

class Futanari extends Command {
  constructor(...args) {
    super(...args, {
      description: "futanari: female character with male genitalia",
      usage: "futanari",
      nsfw: true,
    });
  }

  async run(ctx) {
    const result = await gelbooruAPI(["solo", "futanari"]);
    const urls = result.map((entry) => entry.file_url)
    const embed = this.client
      .embed(ctx.author)
      .setTitle("Futanari :eggplant:")
      .setImage(utils.random(urls));
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Futanari;
