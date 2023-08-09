const Command = require("../../structures/Command.js");
const { request } = require("undici");

class Pat extends Command {
  constructor(...args) {
    super(...args, {
      description: "send a headpat to someone!",
      usage: "pat [user]",
      options: [
        {
          name: "user",
          description: "the user you want to pat",
          type: "user",
        },
      ],
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const { url } = await request("https://nekos.life/api/v2/img/pat").then(
      ({ body }) => body.json()
    );
    const embed = this.client.embed(ctx.author).setTitle(`Pat!`).setImage(url);
    if (user.id !== ctx.author.id)
      embed.setDescription(
        `**${ctx.author.username}** is patting **${user.username}**!`
      );
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Pat;
