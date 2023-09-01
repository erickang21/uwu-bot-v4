const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");

class Trumptweet extends Command {
  constructor(...args) {
    super(...args, {
      description: "tweet something as donald trump.",
      usage: "trumptweet [text]",
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
      data = await this.client.imgapi.tweet(text);
    } catch (err) {
      return ctx.reply(`An error occurred with the image generation API. ${emojis.failure}`);
    }
    const embed = this.client.embed(ctx.author)
      .setTitle("Tweet")
      .setDescription(`you tweeted as donald trump!`)
      .setImage("attachment://image.png");
    return ctx.reply({ embeds: [embed], files: [ { name: "image.png", attachment: data } ] });
  }
}

module.exports = Trumptweet;
2