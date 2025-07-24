const Command = require("../../structures/Command.js");
const Emojis = require("../../structures/Emojis.js");

class Serverdist extends Command {
  constructor(...args) {
    super(...args, {
      description: "Find the distribution of servers.",
      usage: "serverdist <showid>",
      devOnly: true,
      aliases: ["serverdistribution"],
      options: [
        {
          name: "showid",
          description: "Whether to show server IDs.",
          type: "string",
        },
      ],
    });
  }

  async run(ctx, options) {
    const showId = options.getString("showid") === "true";
    const totalServers = await this.client.getGuildCount();
    const memberSizes = await this.client.shard.broadcastEval(() => {
      return this.guilds.cache.map(guild => ({
        id: guild.id,
        name: guild.name,
        memberCount: guild.memberCount
      }));
    })
    const memberSizeCounts = memberSizes.flat();
    const totalMembers = memberSizeCounts.reduce((acc, data) => acc + data.memberCount, 0);
    const memberSizeMap = new Map();
    memberSizeCounts.forEach((data) => {
      const key = this.client.analyticsManager.getInterval(data.memberCount);
      if (!memberSizeMap.has(key)) {
        memberSizeMap.set(key, []);
      }
      const arr = memberSizeMap.get(key);
      if (arr.length < 10) arr.push(data);
    });
    const embed = this.client.embed()
      .setTitle("Server Distribution")
      .setDescription(`Total Servers: ${totalServers.toLocaleString()}\nTotal Members: ${totalMembers.toLocaleString()}`)
    const sortedBuckets = [...memberSizeMap.entries()].sort((a, b) => {
      const extractMin = (key) => {
        if (key.endsWith("+")) return parseInt(key);
        return parseInt(key.split("-")[0]);
      };
    
      return extractMin(b[0]) - extractMin(a[0]); // descending
    });
    const padRight = (str, len) => str + ' '.repeat(Math.max(0, len - str.length));
    sortedBuckets.forEach(async ([key, serversInBucket]) => {
      serversInBucket.sort((a, b) => b.memberCount - a.memberCount);
      const MAX_ROW_LEN = 28;
      const longestName = Math.min(MAX_ROW_LEN, serversInBucket.reduce((max, data) => Math.max(max, data.name.length), 0));
      const truncate = (str, max) => {
        return str.length > max ? str.slice(0, max - 3) + "..." : str;
      };
      embed.addFields({ 
        name: key, 
        value: serversInBucket ? 
        serversInBucket.map((data, index) => `**#${index + 1}: ${padRight(truncate(data.name, MAX_ROW_LEN), longestName)}**\n${Emojis.blueRightArrow} ${data.memberCount.toLocaleString()}${showId ? `\n(ID: ${data.id})` : ""}`).join("\n") 
        : "No servers.", 
        inline: true 
      });
    });
    await ctx.reply({ embeds: [embed] });
  }
}

module.exports = Serverdist;
