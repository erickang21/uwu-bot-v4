const Event = require("../structures/Event.js");
const { MessageEmbed } = require("discord.js");

class GuildMemberAdd extends Event {
  async run(member) {
    if (member.guild.settings.welcome) {
      if (member.guild.settings.welcome.channel) {
        const chan = member.guild.channels.cache.get(member.guild.settings.welcome.channel);
        if (chan) {
          let message = member.guild.settings.welcome.message;
          message = message
            .replace(/{name}/g, member.user.username)
            .replace(/{mention}/g, `<@${member.id}>`)
            .replace(/{members}/g, `<@${member.guild.memberCount}>`)
            .replace(/{server}/g, member.guild.name);
          chan.send(message);
        }
      }
    }
    if (member.guild.settings.autorole) {
      const role = member.guild.roles.cache.find((e) => e.id === member.guild.settings.autorole);
      if (role) await member.roles.add(role);
    }
    if (member.guild.settings.modlog) {
      const chan = member.guild.channels.cache.get(member.guild.settings.modlog);
      if (chan) {
        const embed = new MessageEmbed()
          .setColor(0x0ee335)
          .setDescription(`<:join:725705319732477983> ${member.user.tag} joined.`)
          .setFooter("Joined at")
          .setTimestamp(member.joinedTimestamp)
        chan.send({ embed })
      } 
    }
  }
}

module.exports = GuildMemberAdd;