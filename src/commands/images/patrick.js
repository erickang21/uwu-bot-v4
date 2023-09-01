const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");

class Shocked extends Command {
  constructor(...args) {
    super(...args, {
      description: "scare Patrick!",
      usage: "patrick [user]",
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
      data = await this.client.imgapi.patrick(user.displayAvatarURL({ size: 512, extension: "png" }));
    } catch (err) {
      return ctx.reply(`An error occurred with the image generation API. ${emojis.failure}`);
    }
    const embed = this.client.embed(ctx.author)
      .setTitle("Patrick")
      .setDescription(`**${user.username}** scares Patrick!`)
      .setImage("attachment://image.png");
    return ctx.reply({ embeds: [embed], files: [ { name: "image.png", attachment: data } ] });
  }
}

module.exports = Shocked;
