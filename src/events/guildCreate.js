const Event = require("../structures/Event.js");
const emojis = require("../structures/Emojis");

class GuildCreate extends Event {
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
          .setTitle(`uwu bot joined a server! ${context.emojis.join}`)
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
          .setColor(0x00ff04);
        await logChannel.send({ embeds: [logEmbed] });
      }
    }

    await this.client.shard.broadcastEval(sendLoggedMessage, { context: { guild, emojis, iconURL: guild.iconURL(), ownerUsername: owner?.tag } });

    log.info(`[GuildCreate] uwu bot JOINED a server: ${guild.name}`);
    await this.client.setActivity();

    // Save to analytics.
    const currentServerCount = await this.client.getGuildCount();
    const users = await this.client.shard.broadcastEval((c) =>
      c.guilds.cache.reduce((sum, guild) => sum + guild.memberCount, 0)
    );
    const totalUsers = users.reduce((a, b) => a + b, 0);
    try {
      await this.client.analyticsManager.serverJoined(guild.memberCount, currentServerCount);
      await this.client.analyticsManager.serverJoinedUpdateUsers(guild.memberCount, totalUsers);
    } catch (error) {
      log.error(`[GuildCreate] Error saving server count to analytics: ${error}`);
    }

    // Permissions
    const VIEW_CHANNEL = BigInt(1 << 10);
    const SEND_MESSAGES = BigInt(1 << 11);
    const EMBED_LINKS = BigInt(1 << 14);
    const USE_EXTERNAL_EMOJIS = BigInt(1 << 18);

    // send to server upon joining
    const botGuildMember = await guild.members.fetch(this.client.user.id);
    console.log("Attempting to prepare the welcome message!");
    let joinChannel;
    joinChannel = guild.channels.cache.find((c) => c.type === 0 && (c.name.includes("general") || c.name.includes("global") || c.name.includes("chat")));
    if (!joinChannel) joinChannel = guild.channels.cache.find((c) => c.type === 0 && c.permissionsFor(botGuildMember).has(VIEW_CHANNEL) && c.permissionsFor(botGuildMember).has(SEND_MESSAGES) && c.permissionsFor(botGuildMember).has(EMBED_LINKS) && c.permissionsFor(botGuildMember).has(USE_EXTERNAL_EMOJIS));
    if (!joinChannel) return;
    const embed = this.client.embed(this.client.user)
      .setTitle(`Thank you for choosing **uwu bot!** ${emojis.love}`)
      .setColor(0xcb14e3)
      .setDescription(`Look at you, so kawaii, choosing the right Discord bot to make your server infinitely better. 

Let's get this party started! Keep in mind: 
${emojis.smug} The default prefix is \`uwu\`.
${emojis.salute} Run \`uwu help\` to get an overview of what the bot can do!
${emojis.takingnotes} If you want to see specific details on a command, run \`uwu help [command]\`.
${emojis.love} Want to be caught up on the latest new features? Run \`uwu updates\` to see the most recent changes!

${emojis.pet} If you need help with using the bot, have a juicy new idea in mind, or want to strike up conversation...join the [uwu bot's dedicated server](https://discord.gg/rxaFuZqffd)!

Let's rock! ${emojis.dancing}
    `)
  console.log("Attempting to send the welcome message!");
  joinChannel.send({ embeds: [embed] })
    .then(() => console.log(`Welcome message logged! | ${guild.name} | Shard ${guild.shard.id + 1}`))
    .catch(() => console.log(`Welcome message failed to log. | ${guild.name} | Shard ${guild.shard.id + 1}`));

    
    
  }
}

module.exports = GuildCreate;
