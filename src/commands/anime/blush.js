const Command = require("../../structures/Command.js");
const imageService = require("../../helpers/images.js");
const { AttachmentBuilder } = require("discord.js");

class Blush extends Command {
  constructor(...args) {
    super(...args, {
      description: "are you getting the feels?",
      usage: "blush [user]",
      options: [
        {
          name: "user",
          description: "the user that made you blush",
          type: "user",
        },
      ],
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const result = await imageService.getRandomSFWImage("blush");
    if (!result) return ctx.reply("No images available. Please try again later.");
    const attachment = new AttachmentBuilder(result, { name: "image.gif" });
    const embed = this.client
      .embed(ctx.author)
      .setTitle(`Blush :o`)
      .setImage("attachment://image.gif");
    if (user.id !== ctx.author.id)
      embed.setDescription(
        `**${ctx.author.username}** is blushing after seeing **${user.username}**...`
      );
    return ctx.reply({ embeds: [embed], files: [attachment] });
  }
}

module.exports = Blush;
