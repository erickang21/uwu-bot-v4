const Command = require("../../structures/Command.js");
const { request } = require("undici");

class Holdhand extends Command {
  constructor(...args) {
    super(...args, {
      description: "Hold hands with someone else!",
      usage: "holdhand [user]",
      options: [
        {
          name: "user",
          description: "The user you want to hold hands with.",
          type: "user",
        },
      ],
    });
  }
  
  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const { url } = await request("https://api.waifu.pics/sfw/handhold")
      .then(({ body }) => body.json());
    const embed = this.client
      .embed(ctx.author)
      .setTitle(`HOLD HANDS! :3`)
      .setImage(url)
    if (user.id !== ctx.author.id) embed.setDescription(`**${ctx.author.username}** is holding hands with **${user.username}**!`)
    return ctx.reply({ embeds: [embed] });
      
  }
}


module.exports = Holdhand;
