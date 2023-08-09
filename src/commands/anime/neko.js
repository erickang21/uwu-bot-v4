const Command = require("../../structures/Command.js");
const { request } = require("undici");

class Neko extends Command {
  constructor(...args) {
    super(...args, {
      description: "get a random picture of a neko!",
      usage: "neko",
    });
  }

  async run(ctx) {
    const { url } = await request("https://nekos.life/api/v2/img/neko").then(
      ({ body }) => body.json()
    );
    const embed = this.client.embed(ctx.author).setTitle(`Neko`).setImage(url);
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Neko;
