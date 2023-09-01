const Command = require("../../structures/Command.js");
const utils = require("../../utils/utils.js");
const { request } = require("undici");
const emojis = require("../../structures/Emojis");
class BDSM extends Command {
  constructor(...args) {
    super(...args, {
      description: "bdsm: physical restraint/bondage, servitude, and other 'rough treatment' of the partner.",
      usage: "bdsm",
      nsfw: true,
    });
  }

  async run(ctx) {
    let data;
    try {
      data = await request(
        "https://gelbooru.com/index.php?page=dapi&s=post&q=index&json=1&tags=bdsm%20bondage%20-loli%20rating:explicit"
      ).then(({ body }) => body.json());
    } catch (e) {
      return ctx.reply(`An error occurred with the image service. ${emojis.failure}`);
    }
    const urls = data.post.map((entry) => entry.file_url)
    const embed = this.client
      .embed(ctx.author)
      .setTitle("BDSM :eggplant:")
      .setImage(utils.random(urls));
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = BDSM;
