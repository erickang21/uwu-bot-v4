const Command = require("../../structures/Command.js");
const { request } = require("undici");

class Lesbian extends Command {
  constructor(...args) {
    super(...args, {
      description: "[NSFW] Lesbian.",
      usage: "lesbian",
      nsfw: true,
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const { url } = await request(
      "https://anime-api.hisoka17.repl.co/img/nsfw/lesbian"
    ).then(({ body }) => body.json());
    const embed = this.client
      .embed(ctx.author)
      .setTitle("Lesbian :eggplant:")
      .setImage(url);
    if (user.id !== ctx.author.id)
      embed.setTitle(
        `**${ctx.author.username}** is fucking **${user.username}**! :eggplant:`
      );
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Lesbian;
