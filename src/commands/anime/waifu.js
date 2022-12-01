const Command = require("../../structures/Command.js");
const { request } = require("undici");

class Waifu extends Command {
  constructor(...args) {
    super(...args, {
      description: "For those who believe in waifu supremacy.",
      usage: "waifu"
    });
  }
  
  async run(ctx, options) {
    const { url } = await request("https://nekos.life/api/v2/img/waifu")
      .then(({ body }) => body.json());
    const embed = this.client
      .embed(ctx.author)
      .setTitle(`Waifu`)
      .setImage(url)
    return ctx.reply({ embeds: [embed] });
      
  }
}


module.exports = Waifu;
