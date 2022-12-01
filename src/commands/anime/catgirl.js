const Command = require("../../structures/Command.js");
const { request } = require("undici");

class Catgirl extends Command {
  constructor(...args) {
    super(...args, {
      description: "For those who believe in catgirl supremacy.",
      usage: "catgirl",
    });
  }

  async run(ctx) {
    const { url } = await request("https://nekos.life/api/v2/img/gecg").then(
      ({ body }) => body.json()
    );
    const embed = this.client
      .embed(ctx.author)
      .setTitle(`Catgirl`)
      .setImage(url);
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Catgirl;
