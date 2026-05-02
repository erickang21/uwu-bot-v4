const Command = require("../../structures/Command.js");
const imageService = require("../../helpers/images.js");
const { AttachmentBuilder } = require("discord.js");

class Neko extends Command {
  constructor(...args) {
    super(...args, {
      description: "get a random picture of a neko!",
      usage: "neko",
    });
  }

  async run(ctx) {
    const result = await imageService.getRandomSFWImage("neko");
    if (!result) return ctx.reply("No images available. Please try again later.");
    const attachment = new AttachmentBuilder(result, { name: "image.gif" });
    const embed = this.client.embed(ctx.author).setTitle(`Neko`).setImage("attachment://image.gif");
    return ctx.reply({ embeds: [embed], files: [attachment] });
  }
}

module.exports = Neko;
