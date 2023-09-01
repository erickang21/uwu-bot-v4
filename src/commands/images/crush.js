const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");

class Crush extends Command {
  constructor(...args) {
    super(...args, {
      description: "show someone that you can't stop thinking about them <3",
      usage: "crush <user>",
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
      data = await this.client.imgapi.crush(ctx.author.displayAvatarURL({ size: 512, extension: "png" }), user.displayAvatarURL({ size: 512, extension: "png" }));
    } catch (err) {
      return ctx.reply(`An error occurred with the image generation API. ${emojis.failure}`);
    }
    const embed = this.client.embed(ctx.author)
      .setTitle("Crush")
      .setDescription(`**${ctx.author.username}** can't stop thinking about **${user.username}**...`)
      .setImage("attachment://image.png");
    return ctx.reply({ embeds: [embed], files: [ { name: "image.png", attachment: data } ] });
  }
}

module.exports = Crush;
