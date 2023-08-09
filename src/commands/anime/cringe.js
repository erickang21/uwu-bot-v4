const Command = require("../../structures/Command.js");
const { request } = require("undici");

class Cringe extends Command {
  constructor(...args) {
    super(...args, {
      description: "show that someone made you cringe!",
      usage: "cringe [user]",
      options: [
        {
          name: "user",
          description: "the user that made you cringe",
          type: "user",
        },
      ],
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const { url } = await request("https://api.waifu.pics/sfw/cringe").then(
      ({ body }) => body.json()
    );
    const embed = this.client
      .embed(ctx.author)
      .setTitle(`Cringe`)
      .setImage(url);
    if (user.id !== ctx.author.id)
      embed.setDescription(
        `**${ctx.author.username}** is cringing because of **${user.username}**...`
      );
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Cringe;
