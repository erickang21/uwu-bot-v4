const Command = require("../../structures/Command.js");
const { waifuAPI } = require("../../helpers/anime.js");

class Poke extends Command {
  constructor(...args) {
    super(...args, {
      description: "notice me senpai :o",
      usage: "poke [user]",
      options: [
        {
          name: "user",
          description: "the user you want to poke",
          type: "user",
        },
      ],
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const url = await waifuAPI("poke");
    const embed = this.client
      .embed(ctx.author)
      .setTitle(`Poke!`)
      .setImage(url);
    if (user.id !== ctx.author.id)
      embed.setDescription(
        `**${ctx.author.username}** is poking **${user.username}**...`
      );
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Poke;
