const Command = require("../../structures/Command.js");
const imageService = require("../../helpers/images.js");
const { AttachmentBuilder } = require("discord.js");

class Tickle extends Command {
  constructor(...args) {
    super(...args, {
      description: "feeling evil? tickle someone else.",
      usage: "tickle [user]",
      options: [
        {
          name: "user",
          description: "the user you want to tickle",
          type: "user",
        },
      ],
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const result = await imageService.getRandomSFWImage("tickle");
    if (!result) return ctx.reply("No images available. Please try again later.");
    const attachment = new AttachmentBuilder(result, { name: "image.gif" });
    const embed = this.client
      .embed(ctx.author)
      .setTitle(`Tickle!`)
      .setImage("attachment://image.gif");
    if (user.id !== ctx.author.id)
      embed.setDescription(
        `**${ctx.author.username}** is tickling **${user.username}**!`
      );
    return ctx.reply({ embeds: [embed], files: [attachment] });
  }
}

module.exports = Tickle;
