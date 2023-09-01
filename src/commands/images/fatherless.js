const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");

class Fatherless extends Command {
  constructor(...args) {
    super(...args, {
      description: "give a bad take that gets you disowned",
      usage: "fatherless [text]",
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
      data = await this.client.imgapi.father(ctx.author.displayAvatarURL({ size: 256, extension: "png" }), text);
    } catch (err) {
      return ctx.reply(`An error occurred with the image generation API. ${emojis.failure}`);
    }
    const embed = this.client.embed(ctx.author)
      .setTitle("Fatherless")
      .setDescription(`your opinion gets you disowned!`)
      .setImage("attachment://image.png");
    return ctx.reply({ embeds: [embed], files: [ { name: "image.png", attachment: data } ] });
  }
}

module.exports = Fatherless;
