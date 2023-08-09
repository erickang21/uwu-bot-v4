const Command = require("../../structures/Command.js");
const { request } = require("undici");

class Wave extends Command {
  constructor(...args) {
    super(...args, {
      description: "wave at someone. better wave back!",
      usage: "wave [user]",
      options: [
        {
          name: "user",
          description: "the user you want to wave at",
          type: "user",
        },
      ],
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const { url } = await request("https://api.waifu.pics/sfw/wave").then(
      ({ body }) => body.json()
    );
    const embed = this.client
      .embed(ctx.author)
      .setTitle(`Wave :3`)
      .setImage(url);
    if (user.id !== ctx.author.id)
      embed.setDescription(
        `**${ctx.author.username}** is waving at **${user.username}**!`
      );
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Wave;
