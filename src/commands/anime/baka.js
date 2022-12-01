const Command = require("../../structures/Command.js");
const { request } = require("undici");

class Baka extends Command {
  constructor(...args) {
    super(...args, {
      description: "Baka!",
      usage: "baka"
    });
  }
  
  async run(ctx, options) {
    const { url } = await request("https://nekos.life/api/v2/img/baka")
      .then(({ body }) => body.json());
    const embed = this.client
      .embed(ctx.author)
      .setTitle(`Baka!`)
      .setImage(url)
    return ctx.reply({ embeds: [embed] });
      
  }
}


module.exports = Hug;
