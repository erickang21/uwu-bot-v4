const Command = require("../../structures/Command.js");
const { request } = require("undici");

class Bonk extends Command {
  constructor(...args) {
    super(...args, {
      description: "Bonk someone else.",
      usage: "bonk [user]",
      options: [
        {
          name: "user",
          description: "The user you want to bonk.",
          type: "user",
        },
      ],
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const { url } = await request("https://api.waifu.pics/sfw/bonk").then(
      ({ body }) => body.json()
    );
    const embed = this.client
      .embed(ctx.author)
      .setTitle(`Bonk >:(`)
      .setImage(url);
    if (user.id !== ctx.author.id)
      embed.setDescription(
        `**${ctx.author.username}** is bonking **${user.username}**! That must have hurt...`
      );
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Bonk;
