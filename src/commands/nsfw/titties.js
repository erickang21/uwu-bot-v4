const Command = require("../../structures/Command.js");
const { getWaifuIm } = require("../../helpers/anime");
const emojis = require("../../structures/Emojis");

class Titties extends Command {
  constructor(...args) {
    super(...args, {
      description: "paizuri: nsfw paizuri content.",
      usage: "titties",
      nsfw: true,
    });
  }

  async run(ctx) {
    const { url } = await getWaifuIm({ includedTags: "paizuri", isNsfw: true });
    if (!url) return ctx.reply(`No images available. Please try again later. ${emojis.failure}`);
    const embed = this.client
      .embed(ctx.author)
      .setTitle("Titties :eggplant:")
      .setImage(url);
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Titties;
