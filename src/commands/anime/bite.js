const Command = require("../../structures/Command.js");
const imageService = require("../../helpers/images.js");
const { AttachmentBuilder } = require("discord.js");

class Bite extends Command {
  constructor(...args) {
    super(...args, {
      description: "annoyed at someone? bite them! unless they're into that...",
      usage: "bite [user]",
      options: [
        {
          name: "user",
          description: "the user you want to bite",
          type: "user",
        },
      ],
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const result = await imageService.getRandomSFWImage("bite");
    if (!result) return ctx.reply("No images available. Please try again later.");
    const attachment = new AttachmentBuilder(result, { name: "image.gif" });
    const embed = this.client
      .embed(ctx.author)
      .setTitle(`Bite >:(`)
      .setImage("attachment://image.gif");
    if (user.id !== ctx.author.id)
      embed.setDescription(
        `**${ctx.author.username}** is biting **${user.username}**! That must have hurt...`
      );
    return ctx.reply({ embeds: [embed], files: [attachment] });
  }
}

module.exports = Bite;
