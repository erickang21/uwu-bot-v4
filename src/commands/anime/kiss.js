const Command = require("../../structures/Command.js");
const { nekoAPI } = require("../../helpers/anime.js");

class Kiss extends Command {
  constructor(...args) {
    super(...args, {
      description: "pull them in...kiss them...yes...",
      usage: "kiss [user]",
      options: [
        {
          name: "user",
          description: "the user you want to kiss",
          type: "user",
        },
      ],
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const url = await nekoAPI("kiss");
    const embed = this.client.embed(ctx.author).setTitle(`Kiss!`).setImage(url);
    if (user.id !== ctx.author.id)
      embed.setDescription(
        `**${ctx.author.username}** is kissing **${user.username}**!`
      );
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Kiss;
