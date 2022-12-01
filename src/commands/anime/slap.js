const Command = require("../../structures/Command.js");
const { request } = require("undici");

class Slap extends Command {
  constructor(...args) {
    super(...args, {
      description: "Slap someone else.",
      usage: "slap [user]",
      options: [
        {
          name: "user",
          description: "The user you want to slap.",
          type: "user",
        },
      ],
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const { url } = await request("https://nekos.life/api/v2/img/slap").then(
      ({ body }) => body.json()
    );
    const embed = this.client.embed(ctx.author).setTitle(`Slap!`).setImage(url);
    if (user.id !== ctx.author.id)
      embed.setDescription(
        `**${ctx.author.username}** is slapping **${user.username}**!`
      );
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Slap;
