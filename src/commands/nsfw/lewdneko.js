const Command = require("../../structures/Command.js");
const { request } = require("undici");

class Lewdneko extends Command {
  constructor(...args) {
    super(...args, {
      description: "[NSFW] Lewdneko.",
      usage: "lewdneko",
      nsfw: true
    });
  }
  
  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const { url } = await request("https://api.waifu.pics/nsfw/neko")
      .then(({ body }) => body.json());
    const embed = this.client
      .embed(ctx.author)
      .setTitle("Lewd Neko :eggplant:")
      .setImage(url)
    if (user.id !== ctx.author.id) embed.setTitle(`**${ctx.author.username}** is fucking **${user.username}**! :eggplant:`)
    return ctx.reply({ embeds: [embed] });
      
  }
}


module.exports = Lewdneko;
