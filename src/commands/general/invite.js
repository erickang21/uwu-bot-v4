const Command = require("../../structures/Command.js");

class Invite extends Command {
    constructor(...args) {
        super(...args, {
            description: "Shows invite information for uwu bot.",
        });
    }
    
    async run(ctx) {
      const permissions = new PermissionsBitField(3072n)
        .add(...this.store.map(command => command.botPermissions))
        .bitfield;
      const embed = this.client
        .embed(this.client.user)
        .setTitle(`Invite me!`)
        .setDescription(`**Invite Link:** https://discordapp.com/oauth2/authorize?client_id=${this.client.user.id}&permissions=${permissions}&scope=bot\n\n**Support Server:** https://discord.gg/vCMEmNJ`)
      return ctx.reply({ embeds: [embed] });
    }
}
    
module.exports = Invite;
    