const Command = require("../../structures/Command.js");
const { request } = require("undici");

class Spank extends Command {
  constructor(...args) {
    super(...args, {
      description: "[NSFW] Spank.",
      usage: "spank [user]",
      nsfw: true,
      options: [
        {
          name: "user",
          description: "The user.",
          type: "user",
        },
      ],
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const data = await request(
      "https://api.waifu.im/search/?included_tags=ass&gif=true"
    ).then(({ body }) => body.json());
    const embed = this.client
      .embed(ctx.author)
      .setTitle("Spank :eggplant:")
      .setImage(data["images"][0]["url"]);
    if (user.id !== ctx.author.id)
      embed.setTitle(
        `**${ctx.author.username}** is spanking **${user.username}**! :eggplant:`
      );
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Spank;
