const Command = require("../../structures/Command.js");
const imageService = require("../../helpers/images.js");
const { AttachmentBuilder } = require("discord.js");

class Poke extends Command {
  constructor(...args) {
    super(...args, {
      description: "notice me senpai :o",
      usage: "poke [user]",
      options: [
        {
          name: "user",
          description: "the user you want to poke",
          type: "user",
        },
      ],
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const result = await imageService.getRandomSFWImage("poke");
    if (!result) return ctx.reply("No images available. Please try again later.");
    const attachment = new AttachmentBuilder(result, { name: "image.gif" });
    const embed = this.client
      .embed(ctx.author)
      .setTitle(`Poke!`)
      .setImage("attachment://image.gif");
    if (user.id !== ctx.author.id)
      embed.setDescription(
        `**${ctx.author.username}** is poking **${user.username}**...`
      );
    return ctx.reply({ embeds: [embed], files: [attachment] });
  }
}

module.exports = Poke;
