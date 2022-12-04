const Command = require("../../structures/Command.js");
const { version } = require("discord.js");
const { DEVS, EMOJIS } = require("../../utils/constants.js");
const { getBytes, getDuration } = require("../../utils/utils.js");

class Stats extends Command {
  constructor(...args) {
    super(...args, {
      description: "Shows invite information for uwu bot.",
      aliases: ["info"],
    });
  }

  async run(ctx) {
    const { client } = this;
    const uptime = getDuration(client.uptime);
    const guildCount = await this.client.getGuildCount();
    const users = await this.client.shard.broadcastEval((c) =>
      c.guilds.cache.reduce((sum, guild) => sum + guild.memberCount, 0)
    );
    const totalUsers = users.reduce((a, b) => a + b, 0);
    let memUsage = await this.client.shard.broadcastEval(() => process.memoryUsage().heapUsed);
    memUsage = memUsage.reduce((a, b) => a + b, 0);

    let devList = [];
    for (const d of DEVS) {
      let test = await this.client.users.fetch(d);
      devList.push(test.tag);
    }

    const embed = this.client.embed(this.client.user)
      .setTitle("uwu bot")
      .setDescription("A very useful Discord bot for all your server's needs!")
      .addFields(
        {
          name: `Shard ${EMOJIS.POWERCUBE}`,
          value: `**${ctx.guild.shard.id + 1}** of **${
            this.client.shard.count
          }**`,
        },
        {
          name: `Servers ${EMOJIS.TROPHY}`,
          value: `${guildCount}`,
        },
        { name: `Users ${EMOJIS.INVITE}`, value: `${totalUsers}` },
        {
          name: `Average Users/Server ${EMOJIS.EARLY_SUPPORTER}`,
          value: `${Math.floor(totalUsers / guildCount)}`,
        },
        { name: `Uptime ${EMOJIS.ON_MY_WAY}`, value: uptime },
        { name: `Memory ${EMOJIS.EQ}`, value: getBytes(memUsage) },
        {
          name: `Commands ${EMOJIS.TROPHY_2}`,
          value: `${this.store.size}`,
        },
        {
          name: `Commands Run (since uptime) ${EMOJIS.CHART_UP}`,
          value: `${this.store.ran}`,
        },
        {
          name: `Node.js Version ${EMOJIS.NODEJS}`,
          value: process.version,
        },
        {
          name: `Discord.js Version ${EMOJIS.DISCORD}`,
          value: `v${version}`,
        },
        {
          name: "Bot Links",
          value: [
            `${EMOJIS.DBL} [Top.gg Page](https://top.gg/bot/520682706896683009)`,
            `${EMOJIS.DOCS} [Documentation](https://docs.uwubot.tk)`,
          ].join("\n"),
        },
        {
          name: "Socials",
          value: [
            `${EMOJIS.DISCORD} [banana's hideout ♡](https://discord.gg/vCMEmNJ)`,
            `${EMOJIS.YOUTUBE} [banana bs](https://www.youtube.com/channel/UC6No09LRXzCk8omS1CMnzSw)`,
            `${EMOJIS.TWITTER} [itzbananauwu](https://twitter.com/itzbananauwu)`,
            `${EMOJIS.TWITCH} [itzbananauwu](https://www.twitch.tv/itzbananauwu)`,
            `${EMOJIS.GITHUB} [erickang21](https://github.com/itzbananauwu)`,
          ].join("\n"),
        },
        { name: `Developers ${EMOJIS.CODE}`, value: devList.join("\n") }
      );

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Stats;
