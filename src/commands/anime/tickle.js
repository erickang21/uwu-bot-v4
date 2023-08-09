const Command = require("../../structures/Command.js");
const { request } = require("undici");

class Tickle extends Command {
  constructor(...args) {
    super(...args, {
      description: "feeling evil? tickle someone else.",
      usage: "tickle [user]",
      options: [
        {
          name: "user",
          description: "the user you want to tickle",
          type: "user",
        },
      ],
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const { url } = await request("https://nekos.life/api/v2/img/tickle").then(
      ({ body }) => body.json()
    );
    const embed = this.client
      .embed(ctx.author)
      .setTitle(`Tickle!`)
      .setImage(url);
    if (user.id !== ctx.author.id)
      embed.setDescription(
        `**${ctx.author.username}** is tickling **${user.username}**!`
      );
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Tickle;
