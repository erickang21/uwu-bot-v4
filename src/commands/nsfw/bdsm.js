const Command = require("../../structures/Command.js");
const utils = require("../../utils/utils.js");
const imageService = require("../../helpers/images.js");
const { AttachmentBuilder } = require("discord.js");

class BDSM extends Command {
  constructor(...args) {
    super(...args, {
      description: "bdsm: physical restraint/bondage, servitude, and other 'rough treatment' of the partner.",
      usage: "bdsm",
      nsfw: true,
    });
  }

  async run(ctx) {
    const result = imageService.getRandomImage("bdsm");
    if (!result) return ctx.reply("No images available. Please try again later.");
    const attachment = new AttachmentBuilder(result, { name: "image.jpg" });
    const embed = this.client
      .embed(ctx.author)
      .setTitle("BDSM :eggplant:")
      .setImage("attachment://image.jpg");  
    return ctx.reply({ embeds: [embed], files: [attachment] });
  }
}

module.exports = BDSM;
