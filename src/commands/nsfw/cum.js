const Command = require("../../structures/Command.js");
const { gelbooruAPI } = require("../../helpers/anime");
const utils = require("../../utils/utils.js");

class Cum extends Command {
  constructor(...args) {
    super(...args, {
      description: "cum: semen and seminal fluid",
      usage: "cum [user]",
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
    const result = await gelbooruAPI(["cum"]);
    const urls = result.map((entry) => entry.file_url)
    const embed = this.client
      .embed(ctx.author)
      .setTitle("Cum :eggplant:")
      .setImage(utils.random(urls));
    if (user.id !== ctx.author.id)
      embed.setTitle(
        `**${ctx.author.username}** cums on **${user.username}**! :eggplant:`
      );
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Cum;
