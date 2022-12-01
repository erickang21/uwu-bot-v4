const Command = require("../../structures/Command.js");
const { request } = require("undici");

class Hug extends Command {
  constructor(...args) {
    super(...args, {
      description: "Hug someone else.",
      usage: "hug [user]",
      options: [
        {
          name: "user",
          description: "The user you want to hug.",
          type: "user",
        },
      ],
    });
  }
  
  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const { url } = await request("https://nekos.life/api/v2/img/hug")
      .then(({ body }) => body.json());
    const embed = this.client
      .embed(user)
      .setTitle(`Hug!`)
      .setImage(url)
      //.setFooter(`Requested by: ${ctx.author.tag} | Powered by nekos.life`, ctx.author.displayAvatarURL({ size: 32 }));
    if (user.id !== ctx.author.id) embed.setDescription(`**${ctx.author.username}** is hugging **${user.username}**!`)
    return ctx.reply({ embeds: [embed] });
      
  }
}


module.exports = Hug;
