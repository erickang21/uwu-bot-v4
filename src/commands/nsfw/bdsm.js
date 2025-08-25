const Command = require("../../structures/Command.js");
const utils = require("../../utils/utils.js");
const { gelbooruAPI } = require("../../helpers/anime");

class BDSM extends Command {
  constructor(...args) {
    super(...args, {
      description: "bdsm: physical restraint/bondage, servitude, and other 'rough treatment' of the partner.",
      usage: "bdsm",
      nsfw: true,
    });
  }

  async run(ctx) {
    const result = await gelbooruAPI(["bdsm", "bondage"]);
    const urls = result.map((entry) => entry.file_url)
    const embed = this.client
      .embed(ctx.author)
      .setTitle("BDSM :eggplant:")
      .setImage(utils.random(urls));
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = BDSM;
