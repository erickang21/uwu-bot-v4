const Command = require("../../structures/Command.js");
const imageService = require("../../helpers/images.js");
const { AttachmentBuilder } = require("discord.js");

class Cringe extends Command {
  constructor(...args) {
    super(...args, {
      description: "show that someone made you cringe!",
      usage: "cringe [user]",
      options: [
        {
          name: "user",
          description: "the user that made you cringe",
          type: "user",
        },
      ],
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const result = await imageService.getRandomSFWImage("confused");
    if (!result) return ctx.reply("No images available. Please try again later.");
    const attachment = new AttachmentBuilder(result, { name: "image.gif" });
    const embed = this.client
      .embed(ctx.author)
      .setTitle(`Cringe`)
      .setImage("attachment://image.gif");
    if (user.id !== ctx.author.id)
      embed.setDescription(
        `**${ctx.author.username}** is cringing because of **${user.username}**...`
      );
    return ctx.reply({ embeds: [embed], files: [attachment] });
  }
}

module.exports = Cringe;
