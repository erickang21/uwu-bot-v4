const Command = require("../../structures/Command.js");
const { request } = require("undici");

class Blush extends Command {
  constructor(...args) {
    super(...args, {
      description: "Did someone make you blush?",
      usage: "blush [user]",
      options: [
        {
          name: "user",
          description: "The user that made you blush.",
          type: "user",
        },
      ],
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const { url } = await request("https://api.waifu.pics/sfw/blush").then(
      ({ body }) => body.json()
    );
    const embed = this.client
      .embed(ctx.author)
      .setTitle(`Blush :o`)
      .setImage(url);
    if (user.id !== ctx.author.id)
      embed.setDescription(
        `**${ctx.author.username}** is blushing after seeing **${user.username}**...`
      );
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Blush;
