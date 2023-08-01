const Event = require("../structures/Event.js");
const emojis = require("../structures/Emojis");

class GuildCreate extends Event {
  async run(guild) {
    if (!guild.available) return;

    // send to server upon joining

    console.log("Attempting to prepare the welcome message!")
    const joinChannel = guild.channels.cache.find((c) => c.type === "text" &&  c.permissionsFor(guild.me).has("VIEW_CHANNEL") && c.permissionsFor(guild.me).has("SEND_MESSAGES") && c.permissionsFor(guild.me).has("EMBED_LINKS"));
    if (!joinChannel) return;
    const embed = this.client.embed()
      .setTitle("uwu bot is here!")
      .setColor(0xcb14e3)
      .setDescription(`Thank you for choosing **uwu bot!** ${emojis.love}

Look at you, someone with actual taste, choosing the right Discord bot to make your server infinitely better. 

Let's get this party started! Keep in mind: 
${emojis.smug} The default prefix is \`uwu\`. Change this with \`uwu prefix\`!
${emojis.salute} Run \`uwu help\` to get an overview of what the bot can do!
${emojis.takingnotes} If you want to see specific details on a command, check out the documentation: https://docs.uwubot.tk/.

${emojis.pet} Oh! I almost forgot to mention...
If you need help with using the bot, have a juicy new idea in mind, or want to strike up conversation...join the uwu bot's dedicated server!
https://discord.gg/vCMEmNJ

Let's rock! ${emojis.dancing}
    `)
    .setFooter(this.client.user.tag, this.client.user.displayAvatarURL({ size: 32 }));
  console.log("Attempting to send the welcome message!");
  joinChannel.send({ embed })
    .then(() => console.log(`Welcome message logged! | ${guild.name} | Shard ${guild.shard.id + 1}`))
    .catch(() => console.log(`Welcome message failed to log. | ${guild.name} | Shard ${guild.shard.id + 1}`));

    // log this in the statistics channel
    const owner = await this.client.users
      .fetch(guild.ownerId)

    const { log } = this.client;

    log.info(`[GuildCreate] uwu bot JOINED a server: ${guild.name}`);
    await this.client.setActivity();

    const report = async (client) => {
      const channel = client.channels.cache.get("559511019190353920");
      if (!channel) return;

      const embed = client
        .embed()
        .setTitle("uwu bot joined a new server!")
        .setDescription("${guild.name}")
        .setThumbnail(guild.iconURL())
        .addFields({
          name: "Owner",
          value: owner?.tag ?? "No Owner Information",
          inline: true,
        })
        .addFields({
          name: "Member Count",
          value: guild.memberCount.toString(),
          inline: true,
        })
        .setFooter({ text: guild.id });

      await channel.send({ embeds: [embed] });
    };

    if (this.client.shard) {
      return this.client.shard.broadcastEval(report);
    } else {
      return report(this.client);
    }
  }
}

module.exports = GuildCreate;
