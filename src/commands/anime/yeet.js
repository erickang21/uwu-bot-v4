const Command = require("../../structures/Command.js");
const { request } = require("undici");

class Yeet extends Command {
  constructor(...args) {
    super(...args, {
      description: "get rid of them once and for all! yeet them.",
      usage: "yeet [user]",
      options: [
        {
          name: "user",
          description: "the user you want to yeet",
          type: "user",
        },
      ],
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const { url } = await request("https://api.waifu.pics/sfw/yeet").then(
      ({ body }) => body.json()
    );
    const embed = this.client
      .embed(ctx.author)
      .setTitle(`YEET >:)`)
      .setImage(url);
    if (user.id !== ctx.author.id)
      embed.setDescription(
        `**${ctx.author.username}** is yeeting **${user.username}**! See you later!`
      );
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Yeet;
