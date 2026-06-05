const Command = require("../../structures/Command.js");
const { getPurrbotAPI } = require("../../helpers/anime");
const emojis = require("../../structures/Emojis");

class Anal extends Command {
  constructor(...args) {
    super(...args, {
      description: "anal: nsfw anal content.",
      usage: "anal",
      nsfw: true,
    });
  }

  async run(ctx) {
    const { url } = await getPurrbotAPI("anal");
    if (!url) return ctx.reply(`No images available. Please try again later. ${emojis.failure}`);
    const embed = this.client
      .embed(ctx.author)
      .setTitle("Anal :eggplant:")
      .setImage(url);
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Anal;
