const Event = require("../structures/Event.js");
const { EmbedBuilder, ActivityType } = require("discord.js");

class GuildCreate extends Event {
  async run(guild) {
    if (!guild.available) return;

    const owner = await this.client.users.fetch(guild.ownerId)
      .catch(() => null);

    const { log } = this.client;

    log.info(`[GuildCreate] uwu bot JOINED a server: ${guild.name}`);
    await this.client.setActivity();

    const report = async (client) => {
      const channel = client.channels.cache.get("559511019190353920");
      if (!channel) return;

      const embed = client.embed()
        .setTitle("uwu bot joined a new server!")
        .setDescription("${guild.name}")
        .setThumbnail(guild.iconURL())
        .addFields({
          name: "Owner",
          value: owner?.tag ?? "No Owner Information",
          inline: true
        })
        .addFields({
          name: "Member Count",
          value: guild.memberCount.toString(),
          inline: true
        })
        .setFooter({ text: guild.id });

      await channel.send({ embeds: [embed] }).catch(() => null);
    };

    if (this.client.shard) {
      return this.client.shard.broadcastEval(report);
    } else {
      return report(this.client);
    } 
  }
}

module.exports = GuildCreate;
