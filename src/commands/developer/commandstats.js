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
    const cmdstats = await this.client.shard.broadcastEval((client) => client.commandStats).then((x) => x.reduce((a, b) => a.concat(b), []));
    let totalcmdstats = {};
    for (const shard of cmdstats) {
      for (const cmd of Object.keys(shard)) {
        if (!Object.keys(totalcmdstats).includes(cmd)) totalcmdstats[cmd] = shard[cmd];
        else totalcmdstats[cmd] += shard[cmd];
      }
    }
    
    const cmds = Object.entries(totalcmdstats).sort((x, y) => x[1] < y[1] ? 1 : -1);
    let description = "";
    let index = 0;
    for (const entry of cmds.slice(0, amount)) {
      index++;
      description += `**(${index}) ${entry[0]}:** ${entry[1]}\n`     
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
