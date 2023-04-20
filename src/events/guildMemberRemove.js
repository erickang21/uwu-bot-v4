const Event = require("../structures/Event.js");
const { MessageEmbed } = require("discord.js");

class GuildMemberRemove extends Event {
  async run(member) {
    if(!member.guild.available) return;

    await this.client.settings.members.delete(`${member.guild.id}.${member.id}`).catch(() => null);

    if (member.guild.settings.leave) {
      if (member.guild.settings.leave.channel) {
        const chan = member.guild.channels.cache.get(member.guild.settings.leave.channel);
        if (!chan) return;
        let message = member.guild.settings.leave.message;
        message = message
          .replace(/{name}/g, member.user.username)
          .replace(/{members}/g, `<@${member.guild.memberCount}>`)
          .replace(/{server}/g, member.guild.name);
        chan.send(message);
      }
    }
    if (member.guild.settings.modlog) {
      const chan = member.guild.channels.cache.get(member.guild.settings.modlog);
      if (chan) {
        const embed = new MessageEmbed()
          .setColor(0xed1405)
          .setDescription(`<:leave:725705319598260224> **${member.user.tag}** left.`)
          .setFooter("Left at")
          .setTimestamp(Date.now())
        chan.send({ embed })
      } 
    }
  }
}

module.exports = GuildMemberRemove;