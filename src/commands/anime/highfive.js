const Command = require("../../structures/Command.js");
const { waifuAPI } = require("../../helpers/anime.js");

class Highfive extends Command {
  constructor(...args) {
    super(...args, {
      description: "send someone a high-five!",
      usage: "highfive [user]",
      options: [
        {
          name: "user",
          description: "the user you want to high-five",
          type: "user",
        },
      ],
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const url = await waifuAPI("highfive");
    const embed = this.client
      .embed(ctx.author)
      .setTitle(`HIGH-FIVE! :D`)
      .setImage(url);
    if (user.id !== ctx.author.id)
      embed.setDescription(
        `**${ctx.author.username}** is high-fiving **${user.username}**!`
      );
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Highfive;
