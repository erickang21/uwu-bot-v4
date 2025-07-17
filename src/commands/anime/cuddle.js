const Command = require("../../structures/Command.js");
const { nekoAPI } = require("../../helpers/anime.js");

class Cuddle extends Command {
  constructor(...args) {
    super(...args, {
      description: "send cuddles for that special someone :)",
      usage: "cuddle [user]",
      options: [
        {
          name: "user",
          description: "the user you want to cuddle",
          type: "user",
        },
      ],
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const url = await nekoAPI("cuddle");
    const embed = this.client
      .embed(ctx.author)
      .setTitle(`Cuddle!`)
      .setImage(url);
    if (user.id !== ctx.author.id)
      embed.setDescription(
        `**${ctx.author.username}** is cuddling with **${user.username}**!`
      );
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Cuddle;
