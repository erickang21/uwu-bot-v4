const Command = require("../../structures/Command.js");
const { request } = require("undici");

class Poke extends Command {
  constructor(...args) {
    super(...args, {
      description: "Poke someone else.",
      usage: "poke [user]",
      options: [
        {
          name: "user",
          description: "The user you want to poke.",
          type: "user",
        },
      ],
    });
  }
  
  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const { url } = await request("https://nekos.life/api/v2/img/poke")
      .then(({ body }) => body.json());
    const embed = this.client
      .embed(ctx.author)
      .setTitle(`Poke!`)
      .setImage(url)
    if (user.id !== ctx.author.id) embed.setDescription(`**${ctx.author.username}** is poking **${user.username}**!`)
    return ctx.reply({ embeds: [embed] });
      
  }
}


module.exports = Poke;
