const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");

class Achievement extends Command {
  constructor(...args) {
    super(...args, {
      description: "get your own minecraft achievement!",
      usage: "achievement [text]",
      options: [
        {
          name: "text",
          description: "the text to display",
          type: "string",
          required: true
        },
      ],
    });
  }

  async run(ctx, options) {
    const text = options.getString("text");
    let data;
    try {
      data = await this.client.imgapi.achievement(ctx.author.displayAvatarURL({ size: 256, extension: "png" }), text);
    } catch (err) {
      return ctx.reply(`An error occurred with the image generation API. ${emojis.failure}`);
    }
    const embed = this.client.embed(ctx.author)
      .setTitle("Achievement!")
      .setDescription(`you got an achievement in minecraft!`)
      .setImage("attachment://image.png");
    return ctx.reply({ embeds: [embed], files: [ { name: "image.png", attachment: data } ] });
  }
}

module.exports = Achievement;
