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

  async run(ctx) {
    const intervals = [
      [1, 10],
      [10, 25],
      [25, 50],
      [50, 100],
      [100, 250],
      [250, 500],
      [500, 1000],
      [1000, 2500],
      [2500, 5000],
      [5000, 10000],
      [10000, 10000000]
    ]
    const categories = new Array(intervals.length).fill(0);
    /* a <= count < b
    1-10
    10-25
    25-50
    50-100
    100-250
    250-500
    500-1k
    1k-5k
    5k-10k
    10k+
     */
    const guildCount = await this.client.getGuildCount();
    // Store top 5 categories
    const topFive = new Array(5).fill([])
    const data = await this.client.shard.broadcastEval((c, context) => {
      const intervals = context.intervals;
      const categories = new Array(intervals.length).fill(0);
      const topFive = new Array(5).fill([])
      c.guilds.cache.forEach((guild) => {
        const m = guild.memberCount;
        intervals.forEach(([start, end], index) => {
          if (start <= m < end) categories[index] += 1;
          if (intervals.length - 1 - index <= 4) {
            const r = intervals.length - 1 - index;
             if (topFive[r].length < 10) topFive[r].push(`- ${guild.name} (Members: ${guild.memberCount})`)
          }
        })
      })
      return { categories, topFive }
    }, { context: { intervals }}
    );
    data.forEach((entry) => {
      for (let i = 0; i < categories.length; i++) categories[i] += entry.categories[i];
      for (let i = 0; i < 5; i++) if (topFive[i].length < 10) topFive[i] = [...topFive[i], ...entry.topFive[i]];
    })
    /*
    description += `\n**__Usage By Category__**\n`;
    const sortedCategories = Object.entries(categoryUses).sort((x, y) => x[1] < y[1] ? 1 : -1);
    index = 0;
    for (const entry of sortedCategories) {
      index++;
      description += `**(#${index}) ${entry[0]}:** ${entry[1]} (${((entry[1] / totalUses) * 100).toFixed(3)}%)\n`;
    }
    */
    let summary = '';
    for (let i= 0; i < intervals.length ;i++) {
      summary +=  `**[${intervals[i][0]}, ${intervals[i][1]})** - ${categories[i]}\n`
    }
    summary += "---------\n";
    for (let i = 4; i >= 0 ; i--) {
      const r = intervals.length - 1 - i;
      summary += `**SOME SERVERS in interval [${intervals[r][0]}, ${intervals[r][1]}):**\n${topFive[i].join("\n")}\n\n`
    }

    const embed = this.client.embed(this.client.user)
      .setTitle(`Server Count Distribution`)
      .setDescription(`**Total Server Count:** ${guildCount}\n\n**(Member Count) - Number of Servers**\n${summary}`);
    return ctx.reply({
      embeds: [ embed ],
    });
  }


}

module.exports = Serverdist;
