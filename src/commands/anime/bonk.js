const Command = require("../../structures/Command.js");
const imageService = require("../../helpers/images.js");
const { AttachmentBuilder } = require("discord.js");

class Bonk extends Command {
  constructor(...args) {
    super(...args, {
      description: "hate someone? bonk them.",
      usage: "bonk [user]",
      options: [
        {
          name: "user",
          description: "the user you want to bonk",
          type: "user",
        },
      ],
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const result = await imageService.getRandomSFWImage("bonk");
    if (!result) return ctx.reply("No images available. Please try again later.");
    const attachment = new AttachmentBuilder(result, { name: "image.gif" });
    const embed = this.client
      .embed(ctx.author)
      .setTitle(`Bonk >:(`)
      .setImage("attachment://image.gif");
    if (user.id !== ctx.author.id)
      embed.setDescription(
        `**${ctx.author.username}** is bonking **${user.username}**! That must have hurt...`
      );
    return ctx.reply({ embeds: [embed], files: [attachment] });
  }
}

module.exports = Bonk;
