const Event = require("../structures/Event.js");
const emojis = require("../structures/Emojis");

class GuildCreate extends Event {
  async run(guild) {
    if (!guild.available) return;

    // log this in the statistics channel
    const owner = await this.client.users
      .fetch(guild.ownerId)

    const { log } = this.client;

    log.info(`[GuildCreate] uwu bot JOINED a server: ${guild.name}`);
    await this.client.setActivity();
    const shardEntries = await this.client.shard.broadcastEval((client) => client.channels.cache.get("559511019190353920"));
    const logChannel = shardEntries.filter((entry) => !!entry)[0];
    if (!logChannel) {
      console.log("[WARNING] Join/Leave log channel is missing.");
      return;
    }
    const logEmbed = this.client.embed()
      .setTitle("uwu bot joined a new server!")
      .setDescription(`${guild.name}`)
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

    await logChannel.send({ embeds: [logEmbed] });

    // send to server upon joining
    const botGuildMember = await guild.members.fetch(this.client.user.id);
    console.log("Attempting to prepare the welcome message!");
    const joinChannel = guild.channels.cache.find((c) => c.type === "text" &&  c.permissionsFor(botGuildMember).has("VIEW_CHANNEL") && c.permissionsFor(botGuildMember).has("SEND_MESSAGES") && c.permissionsFor(botGuildMember).has("EMBED_LINKS"));
    if (!joinChannel) return;
    const embed = this.client.embed()
      .setTitle(`Thank you for choosing **uwu bot!** ${emojis.love}`)
      .setColor(0xcb14e3)
      .setDescription(`Look at you, someone with actual taste, choosing the right Discord bot to make your server infinitely better. 

Let's get this party started! Keep in mind: 
${emojis.smug} The default prefix is \`uwu\`. Change this with \`uwu prefix\`!
${emojis.salute} Run \`uwu help\` to get an overview of what the bot can do!
${emojis.takingnotes} If you want to see specific details on a command, check out the documentation: https://docs.uwubot.tk/.

${emojis.pet} Oh! I almost forgot to mention...
If you need help with using the bot, have a juicy new idea in mind, or want to strike up conversation...join the uwu bot's dedicated server!
https://discord.gg/vCMEmNJ

Let's rock! ${emojis.dancing}
    `)
    .setFooter(this.client.user.username, this.client.user.displayAvatarURL({ size: 32 }));
  console.log("Attempting to send the welcome message!");
  joinChannel.send({ embeds: [embed] })
    .then(() => console.log(`Welcome message logged! | ${guild.name} | Shard ${guild.shard.id + 1}`))
    .catch(() => console.log(`Welcome message failed to log. | ${guild.name} | Shard ${guild.shard.id + 1}`));

    
    
  }
}

module.exports = GuildCreate;
