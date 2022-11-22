const Event = require("../structures/Event.js");

class EventError extends Event {
  async run(event, err) {
    this.client.log.error(err);

    const channel = this.client.channels.cache.get("513368885144190986");
    if (!channel) return;

    const embed = this.client.embed()
      .setTitle("Event Error")
      .setDescription(`An Error occured in event: ${event.name}\n\`\`\`js\n${err.stack || err}\`\`\``);

    return channel.send({ embeds: [embed] }).catch(() => null);
  }
}

module.exports = EventError;
