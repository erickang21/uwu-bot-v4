const Command = require("../../structures/Command.js");
const imageService = require("../../helpers/images.js");
const { AttachmentBuilder } = require("discord.js");

class Feed extends Command {
  constructor(...args) {
    super(...args, {
      description: "feed someone! kinda adorable...",
      usage: "feed [user]",
      options: [
        {
          name: "user",
          description: "the user you want to feed",
          type: "user",
        },
      ],
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const result = await imageService.getRandomSFWImage("feed");
    if (!result) return ctx.reply("No images available. Please try again later.");
    const attachment = new AttachmentBuilder(result, { name: "image.jpg" });
    const embed = this.client.embed(ctx.author).setTitle(`Feed!`).setImage("attachment://image.jpg");
    if (user.id !== ctx.author.id)
      embed.setDescription(
        `**${ctx.author.username}** is feeding **${user.username}**!`
      );
    return ctx.reply({ embeds: [embed], files: [attachment] });
  }
}

module.exports = Feed;
