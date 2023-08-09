const Command = require("../../structures/Command.js");
const { request } = require("undici");

class Feed extends Command {
  constructor(...args) {
    super(...args, {
      description: "feed someone! kinda adorable...",
      usage: "feed [user]",
      options: [
        {
          name: "user",
          description: "the user you want to feed",
          type: "user",
        },
      ],
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const { url } = await request("https://nekos.life/api/v2/img/feed").then(
      ({ body }) => body.json()
    );
    const embed = this.client.embed(ctx.author).setTitle(`Feed!`).setImage(url);
    if (user.id !== ctx.author.id)
      embed.setDescription(
        `**${ctx.author.username}** is feeding **${user.username}**!`
      );
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Feed;
