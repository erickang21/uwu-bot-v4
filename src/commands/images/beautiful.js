const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");

class Beautiful extends Command {
  constructor(...args) {
    super(...args, {
      description: "show how you're the prettiest :)",
      usage: "beautiful [user]",
      options: [
        {
          name: "user",
          description: "the profile picture to use",
          type: "user",
        },
      ],
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    let data;
    try {
      data = await this.client.imgapi.beautiful(user.displayAvatarURL({ size: 256, extension: "png" }));
    } catch (err) {
      return ctx.reply(`An error occurred with the image generation API. ${emojis.failure}`);
    }
    const embed = this.client.embed(ctx.author)
      .setTitle("Painting")
      .setDescription(`**${user.username}** is beautiful.`)
      .setImage("attachment://image.png");
    return ctx.reply({ embeds: [embed], files: [ { name: "image.png", attachment: data } ] });
  }
}

module.exports = Beautiful;
