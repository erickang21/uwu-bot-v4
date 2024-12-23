const Event = require("../structures/Event.js");
const emojis = require("../structures/Emojis");

class GuildDelete extends Event {
  async run(guild) {
    if (!guild.available) return;

    // log this in the statistics channel
    const owner = await this.client.users
      .fetch(guild.ownerId)

    const { log } = this.client;

    const sendLoggedMessage = async (client, context) => {
      const logChannel = await client.channels.fetch("559511019190353920");
      if (logChannel) {
        const logEmbed = client.embed()
          .setTitle(`uwu bot left a server. ${context.emojis.leave}`)
          .setDescription(`${context.guild.name}`)
          .setThumbnail(context.iconURL)
          .addFields({
            name: "Owner",
            value: context.ownerUsername ?? "No Owner Information",
            inline: true,
          })
          .addFields({
            name: "Member Count",
            value: context.guild.memberCount.toString(),
            inline: true,
          })
          .setFooter({ text: context.guild.id })
          .setColor(0xff0000);

        await logChannel.send({ embeds: [logEmbed] });
      }
    }

    await this.client.shard.broadcastEval(sendLoggedMessage, { context: { guild, emojis, iconURL: guild.iconURL(), ownerUsername: owner?.tag } });

    log.info(`[GuildCreate] uwu bot LEFT a server: ${guild.name}`);
    await this.client.setActivity();    
  }
}

module.exports = GuildDelete;
