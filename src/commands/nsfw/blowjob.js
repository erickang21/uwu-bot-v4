const Command = require("../../structures/Command.js");
const { request } = require("undici");
const utils = require("../../utils/utils.js");

class Blowjob extends Command {
  constructor(...args) {
    super(...args, {
      description: "[NSFW] Blowjob.",
      aliases: ["bj"],
      usage: "blowjob [user]",
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
      "https://gelbooru.com/index.php?page=dapi&s=post&q=index&json=1&tags=blowjob%20oral%20-loli%20rating:explicit"
    ).then(({ body }) => body.json());
    const urls = data.post.map((entry) => entry.file_url)
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
