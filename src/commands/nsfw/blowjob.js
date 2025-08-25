const Command = require("../../structures/Command.js");
const utils = require("../../utils/utils.js");
const { gelbooruAPI } = require("../../helpers/anime");

class Blowjob extends Command {
  constructor(...args) {
    super(...args, {
      description: "blowjob: someone uses their mouth to stimulate their partner's penis.",
      aliases: ["bj"],
      usage: "blowjob [user]",
      options: [
        {
          name: "user",
          description: "the user you're giving it to",
          type: "user",
        },
      ],
      nsfw: true
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const result = await gelbooruAPI(["blowjob", "oral"]);
    const urls = result.map((entry) => entry.file_url)
    const embed = this.client
      .embed(ctx.author)
      .setTitle("Blowjob :eggplant:")
      .setImage(utils.random(urls));
    if (user.id !== ctx.author.id)
      embed.setTitle(
        `**${ctx.author.username}** is giving **${user.username}** a BJ! :eggplant:`
      );
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Blowjob;
