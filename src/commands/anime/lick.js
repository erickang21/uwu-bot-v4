const Command = require("../../structures/Command.js");
const { waifuAPI } = require("../../helpers/anime.js");

class Lick extends Command {
  constructor(...args) {
    super(...args, {
      description: "lick someone. better be someone clean!",
      usage: "lick [user]",
      options: [
        {
          name: "user",
          description: "the user you want to lick",
          type: "user",
        },
      ],
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const url = await waifuAPI("lick");
    const embed = this.client
      .embed(ctx.author)
      .setTitle(`Lick :3`)
      .setImage(url);
    if (user.id !== ctx.author.id)
      embed.setDescription(
        `**${ctx.author.username}** is licking **${user.username}**!`
      );
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Lick;
