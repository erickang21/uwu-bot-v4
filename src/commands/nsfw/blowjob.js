const Command = require("../../structures/Command.js");
const { request } = require("undici");

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
    const { url } = await request("https://api.waifu.pics/nsfw/blowjob")
      .then(({ body }) => body.json());
    const embed = this.client
      .embed(ctx.author)
      .setTitle("Blowjob :eggplant:")
      .setImage(url)
    if (user.id !== ctx.author.id) embed.setTitle(`**${ctx.author.username}** is giving **${user.username}** a BJ! :eggplant:`)
    return ctx.reply({ embeds: [embed] });
      
  }
}


module.exports = Blowjob;
