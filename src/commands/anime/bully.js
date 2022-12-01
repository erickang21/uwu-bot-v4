const Command = require("../../structures/Command.js");
const { request } = require("undici");

class Bully extends Command {
  constructor(...args) {
    super(...args, {
      description: "Bully someone else.",
      usage: "bully [user]",
      options: [
        {
          name: "user",
          description: "The user you want to bully.",
          type: "user",
        },
      ],
    });
  }
  
  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const { url } = await request("https://api.waifu.pics/sfw/bully")
      .then(({ body }) => body.json());
    const embed = this.client
      .embed(ctx.author)
      .setTitle(`Bully >:)`)
      .setImage(url)
    if (user.id !== ctx.author.id) embed.setDescription(`**${ctx.author.username}** is bullying **${user.username}**!`)
    return ctx.reply({ embeds: [embed] });
      
  }
}


module.exports = Bully;
