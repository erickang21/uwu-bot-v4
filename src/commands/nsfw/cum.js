const Command = require("../../structures/Command.js");
  const { gelbooruAPI } = require("../../helpers/anime");
  const utils = require("../../utils/utils.js");

class Cum extends Command {
  constructor(...args) {
    super(...args, {
      description: "cum: semen and seminal fluid",
      usage: "cum [user]",
      nsfw: true,
      options: [
        {
          name: "user",
          description: "the user you're doing it to",
          type: "user",
        },
      ],
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const result = imageService.getRandomImage("cum");
    if (!result) return ctx.reply("No images available. Please try again later.");
    const attachment = new AttachmentBuilder(result, { name: "image.jpg" });
    const embed = this.client
      .embed(ctx.author)
      .setTitle("Cum :eggplant:")
      .setImage("attachment://image.jpg");
    if (user.id !== ctx.author.id)
      embed.setTitle(
        `**${ctx.author.username}** cums on **${user.username}**! :eggplant:`
      );
    return ctx.reply({ embeds: [embed], files: [attachment] });
  }
}

module.exports = Cum;
