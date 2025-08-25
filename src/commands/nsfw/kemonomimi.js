const Command = require("../../structures/Command.js");
const utils = require("../../utils/utils.js");
const { gelbooruAPI } = require("../../helpers/anime");

class Kemonomimi extends Command {
  constructor(...args) {
    super(...args, {
      description: "kemonomimi: characters with animal ears",
      usage: "kemonomimi",
      nsfw: true,
    });
  }

  async run(ctx) {
    const result = await gelbooruAPI(["solo", "kemonomimi"]);
    const urls = result.map((entry) => entry.file_url)
    const embed = this.client
      .embed(ctx.author)
      .setTitle("Kemonomimi :eggplant:")
      .setImage(utils.random(urls));
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Kemonomimi;
