const Command = require("../../structures/Command.js");
const imageService = require("../../helpers/images.js");
const { AttachmentBuilder } = require("discord.js");

class Blowjob extends Command {
  constructor(...args) {
    super(...args, {
      description: "blowjob: someone uses their mouth to stimulate their partner's penis.",
      aliases: ["bj"],
      usage: "blowjob [user]",
      options: [
        {
          name: "user",
          description: "the user you're giving it to",
          type: "user",
        },
      ],
      nsfw: true
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const result = imageService.getRandomImage("blowjob");
    if (!result) return ctx.reply("No images available. Please try again later.");
    const attachment = new AttachmentBuilder(result, { name: "image.jpg" });
    const embed = this.client
      .embed(ctx.author)
      .setTitle("Blowjob :eggplant:")
      .setImage("attachment://image.jpg");
    if (user.id !== ctx.author.id)
      embed.setTitle(
        `**${ctx.author.username}** is giving **${user.username}** a BJ! :eggplant:`
      );
    return ctx.reply({ embeds: [embed], files: [attachment] });
  }
}

module.exports = Blowjob;
