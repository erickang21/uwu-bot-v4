const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");

class Ping extends Command {
  constructor(...args) {
    super(...args, {
      description: "ping? pong! checks the bot's response time.",
    });
  }

  async run(ctx) {
    const msg = await ctx.reply({
      content: `Ping? ${emojis.loading}`,
      fetchReply: true,
    });

    const took = msg.createdTimestamp - ctx.createdTimestamp;
    const latency = this.client.ws.ping;

    return ctx.editReply({
      content: `Pong! That took **${took} ms**. The API Latency is **${latency} ms.** ${emojis.dancing}`,
    });
  }
}

module.exports = Ping;
