const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");

class Bobross extends Command {
  constructor(...args) {
    super(...args, {
      description: "put yourself on a bob ross painting!",
      usage: "bobross [user]",
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
      data = await this.client.imgapi.bobross(user.displayAvatarURL({ size: 256, extension: "png" }));
    } catch (err) {
      return ctx.reply(`An error occurred with the image generation API. ${emojis.failure}`);
    }
    const embed = this.client.embed(ctx.author)
      .setTitle("Bob Ross")
      .setDescription(`**${user.username}** is on a Bob Ross painting.`)
      .setImage("attachment://image.png");
    return ctx.reply({ embeds: [embed], files: [ { name: "image.png", attachment: data } ] });
  }
}

module.exports = Bobross;
