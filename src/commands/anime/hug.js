const Command = require("../../structures/Command.js");
const { waifuAPI } = require("../../helpers/anime.js");

class Hug extends Command {
  constructor(...args) {
    super(...args, {
      description: "send a hug to someone. ingredients: 100% wholesomeness!",
      usage: "hug [user]",
      options: [
        {
          name: "user",
          description: "the user you want to hug",
          type: "user",
        },
      ],
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const url = await waifuAPI("hug");
    const embed = this.client.embed(ctx.author).setTitle(`Hug!`).setImage(url);
    if (user.id !== ctx.author.id)
      embed.setDescription(
        `**${ctx.author.username}** is hugging **${user.username}**!`
      );
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Hug;
