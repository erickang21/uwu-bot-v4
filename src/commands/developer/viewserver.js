const Command = require("../../structures/Command.js");

class Viewserver extends Command {
  constructor(...args) {
    super(...args, {
      description: "Views the current configuration for the server.",
      devOnly: true,
      aliases: ["vserver"],
    });
  }

  async run(ctx) {
    const guildData = await this.client.syncGuildSettingsCache(ctx.guild.id);
    let str = "{\n";
    for (const key of Object.keys(guildData)) {
      str += `  ${key}: ${JSON.stringify(guildData[key])},\n`;
    }
    str += "}";
    const embed = this.client.embed(ctx.author)
      .setTitle(`Server Settings`)
      .setDescription(`\`\`\`${str}\`\`\``);
    return ctx.reply({
      embeds: [ embed ],
    });
  }
}

module.exports = Viewserver;
