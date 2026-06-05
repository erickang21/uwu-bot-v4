const Command = require("../../structures/Command.js");
const { getWaifuIm } = require("../../helpers/anime");
const emojis = require("../../structures/Emojis");

class Maid extends Command {
  constructor(...args) {
    super(...args, {
      description: "maid: nsfw maid content.",
      usage: "maid",
      nsfw: true,
    });
  }

  async run(ctx) {
    const { url } = await getWaifuIm({ includedTags: "maid", isNsfw: true });
    if (!url) return ctx.reply(`No images available. Please try again later. ${emojis.failure}`);
    const embed = this.client
      .embed(ctx.author)
      .setTitle("Maid :eggplant:")
      .setImage(url);
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Maid;
