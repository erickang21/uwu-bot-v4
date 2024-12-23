const Event = require("../structures/Event.js");

class EventError extends Event {
  async run(event, err) {
    this.client.log.error(err);
    console.log(err.stack);
    const report = (client) => {
      const channel = client.channels.cache.get("513368885144190986");
      if (!channel) return;

      const embed = client
        .embed()
        .setTitle("Event Error")
        .setDescription(
          `An Error occured in event: ${event.name}\n\`\`\`js\n${
            err.stack || err
          }\`\`\``
        );

      return channel.send({ embeds: [embed] }).catch(() => null);
    };

    if (this.client.shard) {
      return this.client.shard.broadcastEval(report);
    } else {
      return report(this.client);
    }
  }
}

module.exports = EventError;
