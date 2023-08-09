const Command = require("../../structures/Command.js");

class Invite extends Command {
  constructor(...args) {
    super(...args, {
      description: "get invite information for the bot.",
      usage: "invite",
    });
  }

  async run(ctx) {
    const embed = this.client
      .embed(this.client.user)
      .setTitle(`Invite me!`)
      .setDescription(
        `**Invite Link:** https://discordapp.com/oauth2/authorize?client_id=${this.client.user.id}&permissions=8&scope=bot\n\n**Support Server:** https://discord.gg/vCMEmNJ`
      );
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Invite;
