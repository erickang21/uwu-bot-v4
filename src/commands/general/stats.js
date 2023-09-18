const Command = require("../../structures/Command.js");
const { version } = require("discord.js");
const { DEVS, EMOJIS } = require("../../utils/constants.js");
const { getBytes, getDuration } = require("../../utils/utils.js");

class Stats extends Command {
  constructor(...args) {
    super(...args, {
      description: "shows relevant statistics for uwu bot!",
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
          inline: true
        },
        {
          name: `Servers ${EMOJIS.TROPHY}`,
          value: `${guildCount}`,
          inline: true
        },
        { name: `Users ${EMOJIS.INVITE}`, value: `${totalUsers}` , inline: true },
        {
          name: `Average Users/Server ${EMOJIS.EARLY_SUPPORTER}`,
          value: `${Math.floor(totalUsers / guildCount)}`,
          inline: true
        },
        { name: `Uptime ${EMOJIS.ON_MY_WAY}`, value: uptime, inline: true },
        { name: `Memory ${EMOJIS.EQ}`, value: getBytes(memUsage), inline: true },
        {
          name: `Commands ${EMOJIS.TROPHY_2}`,
          value: `${this.store.size}`,
          inline: true
        },
        {
          name: `Commands Run (since uptime) ${EMOJIS.CHART_UP}`,
          value: `${this.store.ran}`,
          inline: true
        },
        {
          name: `Node.js Version <:nodejs:874673614375497778>`,
          value: process.version,
          inline: true
        },
        {
          name: `Discord.js Version ${EMOJIS.DISCORD}`,
          value: `v${version}`,
          inline: true
        },
        {
          name: "Bot Links",
          value: [
            `${EMOJIS.DBL} [Top.gg Page](https://top.gg/bot/520682706896683009)`,
            `${EMOJIS.DOCS} [Documentation](https://docs.uwubot.tk)`,
          ].join("\n"),
          inline: true
        },
        {
          name: "Socials",
          value: [
            `${EMOJIS.DISCORD} [banana's hideout ♡](https://discord.gg/vCMEmNJ)`,
            `${EMOJIS.YOUTUBE} [banana bs](https://www.youtube.com/channel/UC6No09LRXzCk8omS1CMnzSw)`,
            `${EMOJIS.TWITCH} [itzbanana69](https://www.twitch.tv/itzbanana69)`,
            `${EMOJIS.GITHUB} [erickang21](https://github.com/erickang21)`,
            `${EMOJIS.INSTAGRAM} [itzbanana69](https://www.instagram.com/itzbanana69)`
          ].join("\n"),
          inline: true
        },
        { name: `Developers ${EMOJIS.CODE}`, value: devList.join("\n"), inline: true }
      );

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Stats;
