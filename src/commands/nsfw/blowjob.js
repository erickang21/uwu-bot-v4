const Command = require("../../structures/Command.js");
const { request } = require("undici");
const utils = require("../../utils/utils.js");
const emojis = require("../../structures/Emojis");

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
    let data;
    try {
      data = await request(
        "https://gelbooru.com/index.php?page=dapi&s=post&q=index&json=1&tags=blowjob%20oral%20-loli%20rating:explicit"
      ).then(({ body }) => body.json());
    } catch (e) {
      return ctx.reply(`An error occurred with the image service. ${emojis.failure}`);
    }
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
