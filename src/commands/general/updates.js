const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");

class Updates extends Command {
  constructor(...args) {
    super(...args, {
      description: "Shows invite information for uwu bot.",
      aliases: ["updateinfo", "update", "versioninfo"]
    });
  }

  async run(ctx) {
    const embed = this.client
      .embed(this.client.user)
      .setTitle(`uwu bot v5.0 is coming soon!`)
      .setDescription(
        `Update notes will be here once it's done. It'll be a big one. I promise! ${emojis.salute}`
      );
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Updates;
