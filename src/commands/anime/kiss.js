const Command = require("../../structures/Command.js");
const { request } = require("undici");

class Kiss extends Command {
  constructor(...args) {
    super(...args, {
      description: "Kiss someone else.",
      usage: "kiss [user]",
      options: [
        {
          name: "user",
          description: "The user you want to kiss.",
          type: "user",
        },
      ],
    });
  }
  
  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const { url } = await request("https://nekos.life/api/v2/img/kiss")
      .then(({ body }) => body.json());
    const embed = this.client
      .embed(ctx.author)
      .setTitle(`Kiss!`)
      .setImage(url)
    if (user.id !== ctx.author.id) embed.setDescription(`**${ctx.author.username}** is kissing **${user.username}**!`)
    return ctx.reply({ embeds: [embed] });
      
  }
}


module.exports = Kiss;
