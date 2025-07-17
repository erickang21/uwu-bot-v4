const Command = require("../../structures/Command.js");
const { waifuAPI } = require("../../helpers/anime.js");

class Bonk extends Command {
  constructor(...args) {
    super(...args, {
      description: "hate someone? bonk them.",
      usage: "bonk [user]",
      options: [
        {
          name: "user",
          description: "the user you want to bonk",
          type: "user",
        },
      ],
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const url = await waifuAPI("bonk");
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
