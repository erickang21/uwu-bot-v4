const Command = require("../../structures/Command.js");

class Serverdist extends Command {
  constructor(...args) {
    super(...args, {
      description: "Find the distribution of servers.",
      usage: "cmdstats",
      devOnly: true,
      aliases: ["serverdistribution"],
    });
  }

  async run(ctx, options) {
    const categories = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    /* a <= count < b
    1-10
    10-25
    25-50
    50-100
    100-250
    250-500
    500-1000
    1000-5000
    5000-10k
    10k+
     */
    const guildCount = await this.client.getGuildCount();
    const users = await this.client.shard.broadcastEval((c) =>
      c.guilds.cache.reduce((sum, guild) => sum + guild.memberCount, 0)
    );
    /*
    description += `\n**__Usage By Category__**\n`;
    const sortedCategories = Object.entries(categoryUses).sort((x, y) => x[1] < y[1] ? 1 : -1);
    index = 0;
    for (const entry of sortedCategories) {
      index++;
      description += `**(#${index}) ${entry[0]}:** ${entry[1]} (${((entry[1] / totalUses) * 100).toFixed(3)}%)\n`;
    }
    */

    const embed = this.client.embed(this.client.user)
      .setTitle(`Server Count Distribution`)
      .setDescription("WIP.");
    return ctx.reply({
      embeds: [ embed ],
    });
  }


}

module.exports = Serverdist;
