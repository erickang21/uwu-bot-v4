const Command = require("../../structures/Command.js");
const { request } = require("undici");

class Bite extends Command {
  constructor(...args) {
    super(...args, {
      description: "Bite someone else.",
      usage: "bite [user]",
      options: [
        {
          name: "user",
          description: "The user you want to bite.",
          type: "user",
        },
      ],
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const { url } = await request("https://api.waifu.pics/sfw/bite").then(
      ({ body }) => body.json()
    );
    const embed = this.client
      .embed(ctx.author)
      .setTitle(`Bite >:(`)
      .setImage(url);
    if (user.id !== ctx.author.id)
      embed.setDescription(
        `**${ctx.author.username}** is biting **${user.username}**! That must have hurt...`
      );
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Bite;
