const Event = require("../structures/Event.js");
const { MessageEmbed } = require("discord.js");

class GuildMemberRemove extends Event {
  async run(member) {
    if(!member.guild.available) return;

    

    const settings = await this.client.syncGuildSettingsCache(member.guild.id);
    //await settings.members.delete(`${member.guild.id}.${member.id}`).catch(() => null);

    if (settings.leave) {
      if (settings.leave.channel) {
        const chan = member.guild.channels.cache.get(settings.leave.channel);
        if (chan) {
          let message = settings.leave.message;
          message = message
            .replace(/{name}/g, member.user.username)
            .replace(/{mention}/g, `<@${member.id}>`)
            .replace(/{members}/g, `${member.guild.memberCount}`)
            .replace(/{server}/g, member.guild.name);
          chan.send(message);
        }
      }
    }
    if (settings.modlog) {
      const chan = member.guild.channels.cache.get(settings.modlog);
      if (chan) {
        const embed = this.client.embed()
          .setTitle("Member left")
          .setColor(0xed1405)
          .setDescription(`<:leave:725705319598260224> **${member.user.tag}** left.`)
          .setTimestamp(Date.now())
        chan.send({ embeds: [embed] })
      } 
    }
  }
}

module.exports = GuildMemberRemove;