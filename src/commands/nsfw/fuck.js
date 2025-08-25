const Command = require("../../structures/Command.js");
const { gelbooruAPI } = require("../../helpers/anime");
const utils = require("../../utils/utils.js");

class Fuck extends Command {
  constructor(...args) {
    super(...args, {
      description: "fuck: characters engaging in intercourse",
      usage: "fuck [user]",
      nsfw: true,
      options: [
        {
          name: "user",
          description: "the user you're doing it to",
          type: "user",
        },
      ],
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const result = await gelbooruAPI(["sex"]);
    const urls = result.map((entry) => entry.file_url)
    const embed = this.client
      .embed(ctx.author)
      .setTitle("Fuck :eggplant:")
      .setImage(utils.random(urls));
    if (user.id !== ctx.author.id)
      embed.setTitle(
        `**${ctx.author.username}** is fucking **${user.username}**! :eggplant:`
      );
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Fuck;
