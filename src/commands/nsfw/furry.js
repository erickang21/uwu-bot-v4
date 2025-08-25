const Command = require("../../structures/Command.js");
const utils = require("../../utils/utils.js");
const { gelbooruAPI } = require("../../helpers/anime");

class Furry extends Command {
  constructor(...args) {
    super(...args, {
      description: "furry: characters that have body fur, feathers, or scales",
      usage: "furry",
      nsfw: true,
    });
  }

  async run(ctx) {
    const result = await gelbooruAPI(["furry"]);
    const urls = result.map((entry) => entry.file_url)
    const embed = this.client
      .embed(ctx.author)
      .setTitle("Furry :eggplant:")
      .setImage(utils.random(urls));
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Furry;
