const Command = require("../../structures/Command.js");
const { request } = require("undici");

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
    const data = await request(
      "https://api.waifu.im/search/?included_tags=ero&gif=true"
    ).then(({ body }) => body.json());
    const embed = this.client
      .embed(ctx.author)
      .setTitle("Fuck :eggplant:")
      .setImage(data["images"][0]["url"]);
    if (user.id !== ctx.author.id)
      embed.setTitle(
        `**${ctx.author.username}** is fucking **${user.username}**! :eggplant:`
      );
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Fuck;
