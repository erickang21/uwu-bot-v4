const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");

class Monster extends Command {
  constructor(...args) {
    super(...args, {
      description: "call out that monster hiding under your bed!",
      usage: "monster <user>",
      options: [
        {
          name: "user",
          description: "the profile picture to use",
          type: "user",
          required: true
        },
      ],
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user");
    let data;
    try {
      data = await this.client.imgapi.monster(ctx.author.displayAvatarURL({ size: 128, extension: "png" }), user.displayAvatarURL({ size: 128, extension: "png" }));
    } catch (err) {
      return ctx.reply(`An error occurred with the image generation API. ${emojis.failure}`);
    }
    const embed = this.client.embed(ctx.author)
      .setTitle("Monster")
      .setDescription(`turns out **${user.username}** was that monster under the bed...`)
      .setImage("attachment://image.png");
    return ctx.reply({ embeds: [embed], files: [ { name: "image.png", attachment: data } ] });
  }
}

module.exports = Monster;
