const Command = require("../../structures/Command.js");
const imageService = require("../../helpers/images.js");
const { AttachmentBuilder } = require("discord.js");

class Yuri extends Command {
  constructor(...args) {
    super(...args, {
      description: "yuri: sexual interaction between two or more women",
      usage: "yuri",
      nsfw: true,
      extendedHelp: "yuri is the sexual interaction between two or more women - it doesn't matter if it's mutual or one-sided.\n\n\"it's one of those days. pass the yuri.\" - someone special <3"
    });
  }

  async run(ctx) {
    const result = imageService.getRandomImage("yuri");
    if (!result) return ctx.reply("No images available. Please try again later.");
    const attachment = new AttachmentBuilder(result, { name: "image.jpg" });
    const embed = this.client
      .embed(ctx.author)
      .setTitle("Yuri :eggplant:")
      .setImage("attachment://image.jpg");
    return ctx.reply({ embeds: [embed], files: [attachment] });
  }
}

module.exports = Yuri;
