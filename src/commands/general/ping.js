const Command = require("../../structures/Command.js");

class Ping extends Command {
  constructor(...args) {
    super(...args, {
      description: "Pong! Checks Bot latency.",
    });
  }

  async run(ctx) {
    const msg = await ctx.reply({
      content: "Ping?",
      fetchReply: true,
    });

    const took = msg.createdTimestamp - ctx.createdTimestamp;
    const latency = this.client.ws.ping;

    return ctx.editReply({
      content: `Pong! That took **${took} ms**. The API Latency is **${latency} ms**`,
    });
  }
}

module.exports = Ping;
