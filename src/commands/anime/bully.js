const Command = require("../../structures/Command.js");
const { waifuAPI } = require("../../helpers/anime.js");

class Bully extends Command {
  constructor(...args) {
    super(...args, {
      description: "go bully someone...maybe choose a short friend...",
      usage: "bully [user]",
      options: [
        {
          name: "user",
          description: "the user to bully",
          type: "user",
        },
      ],
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const url = await waifuAPI("bully");
    const embed = this.client
      .embed(ctx.author)
      .setTitle(`Bully >:)`)
      .setImage(url);
    if (user.id !== ctx.author.id)
      embed.setDescription(
        `**${ctx.author.username}** is bullying **${user.username}**!`
      );
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Bully;
