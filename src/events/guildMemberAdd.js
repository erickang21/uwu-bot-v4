const Event = require("../structures/Event.js");
const { MessageEmbed } = require("discord.js");

class GuildMemberAdd extends Event {
  async run(member) {
    const settings = await this.client.syncGuildSettingsCache(member.guild.id);
    if (!settings) return;
    if (settings.welcome) {
      if (settings.welcome.channel) {
        const chan = member.guild.channels.cache.get(settings.welcome.channel);
        if (chan) {
          let message = settings.welcome.message;
          message = message
            .replace(/{name}/g, member.user.username)
            .replace(/{mention}/g, `<@${member.id}>`)
            .replace(/{members}/g, `${member.guild.memberCount}`)
            .replace(/{server}/g, member.guild.name);
          chan.send(message);
        }
      }
    }
    if (settings.autorole) {
      const role = member.guild.roles.cache.find((e) => e.id === settings.autorole);
      if (role) await member.roles.add(role);
    }
    if (settings.modlog) {
      const chan = member.guild.channels.cache.get(settings.modlog);
      if (chan) {
        const embed = this.client.embed()
          .setTitle("Member Joined")
          .setColor(0x0ee335)
          .setDescription(`<:join:725705319732477983> ${member.user.tag} joined.`)
          .setTimestamp(member.joinedTimestamp)
        chan.send({ embeds: [embed] })
      } 
    }
  }
}

module.exports = GuildMemberAdd;