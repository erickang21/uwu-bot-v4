const Command = require("../../structures/Command.js");
const fetch = require("node-fetch");

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
    const { url } = await fetch("https://nekos.life/api/v2/img/hug")
      .then((r) => r.json());
    const embed = this.client
      .embed(null)
      .setTitle(`Hug!`)
      .setColor(0x05a2fc)
      .setImage(url)
      .setFooter(`Requested by: ${ctx.author.tag} | Powered by nekos.life`, ctx.author.displayAvatarURL({ size: 32 }));
    if (user.id !== ctx.author.id) embed.setDescription(`**${ctx.author.username}** is hugging **${user.username}**!`)
    return ctx.reply({ embeds: [embed] });
      
  }
}


module.exports = Hug;
