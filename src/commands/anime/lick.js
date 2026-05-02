const Command = require("../../structures/Command.js");
const imageService = require("../../helpers/images.js");
const { AttachmentBuilder } = require("discord.js");

class Lick extends Command {
  constructor(...args) {
    super(...args, {
      description: "lick someone. better be someone clean!",
      usage: "lick [user]",
      options: [
        {
          name: "user",
          description: "the user you want to lick",
          type: "user",
        },
      ],
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const result = await imageService.getRandomSFWImage("peck"); // Better match needed
    if (!result) return ctx.reply("No images available. Please try again later.");
    const attachment = new AttachmentBuilder(result, { name: "image.gif" });
    const embed = this.client
      .embed(ctx.author)
      .setTitle(`Lick :3`)
      .setImage("attachment://image.gif");
    if (user.id !== ctx.author.id)
      embed.setDescription(
        `**${ctx.author.username}** is licking **${user.username}**!`
      );
    return ctx.reply({ embeds: [embed], files: [attachment] });
  }
}

module.exports = Lick;
