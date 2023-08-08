const Command = require("../../structures/Command.js");

class Commandstats extends Command {
  constructor(...args) {
    super(...args, {
      description: "Views how often commands are used.",
      usage: "cmdstats",
      devOnly: true,
      aliases: ["cmdstats"],
      options: [
        {
          name: "amount",
          description: "The amount of commands to view data for.",
          type: "integer",
        },
      ],
    });
  }

  async run(ctx, options) {
    const amount = options.getInteger("amount");
    const lifetimeCmdStats = await this.client.syncCommandSettings("1");
    let categoryUses = {};
    let totalUses = 0;
    const cmdstats = await this.client.shard.broadcastEval((client) => client.commandStats).then((x) => x.reduce((a, b) => a.concat(b), []));
    let totalcmdstats = {};
    for (const shard of cmdstats) {
      for (const cmd of Object.keys(shard)) {
        if (!Object.keys(totalcmdstats).includes(cmd)) totalcmdstats[cmd] = shard[cmd];
        else totalcmdstats[cmd] += shard[cmd];
      }
    }
    
    const lifetimeCmds = Object.entries(lifetimeCmdStats).sort((x, y) => x[1] < y[1] ? 1 : -1);
    let description = `${amount ? `Showing **${amount}**/${Object.keys(totalcmdstats).length} commands\n\n` : ""}[Command Name]: [Lifetime Uses] | [Uses Since Last Restart]\n\n`;
    let index = 0;
    for (const entry of lifetimeCmds.slice(0, amount)) {
      const category = this.client.commands.get(entry[0]).category;
      if (!categoryUses[category]) {
        categoryUses[category] += entry[1];
        totalUses += entry[1];
      }
      index++;
      description += `**(${index}) ${entry[0]}:** ${entry[1]} | ${totalcmdstats[entry[0]]}\n`     
    }
    description += `\n**__Lifetime Command Usage (By Category)__**\n\n`;
    for (const cat of Object.keys(categoryUses)) {
      description += `${cat}: ${categoryUses[cat]} (${((categoryUses[cat] / totalUses) * 100).toFixed(3)}%)\n`;
    }
    const embed = this.client.embed(this.client.user)
      .setTitle(`Command Statistics`)
      .setDescription(description);
    return ctx.reply({
      embeds: [ embed ],
    });
  }


}

module.exports = Commandstats;
