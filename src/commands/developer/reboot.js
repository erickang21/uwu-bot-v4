const Command = require("../../structures/Command.js");

class Reboot extends Command {
  constructor(...args) {
    super(...args, {
      description: "Shuts down/Reboots the bot.",
      devOnly: true,
      aliases: ["shutdown", "restart"],
      modes: ["text"],
      options: [
        {
          name: "shard",
          type: "integer",
          description: "The shard to restart.",
        },
      ],
    });
  }

  async run(ctx, options) {
    const shard = options.getInteger("shard");

    await ctx.reply(
      `Shutting down${
        typeof shard !== "undefined" ? ` shard ${shard}` : " all shards"
      }...`
    );
    if (this.client.shard) {
      return this.client.shard.broadcastEval(
        (client, { shard }) => {
          if (typeof shard !== "undefined") {
            if (client.shard.ids.includes(shard)) process.exit();
          } else {
            process.exit();
          }
        },
        { context: { shard } }
      );
    } else {
      process.exit();
    }
  }
}

module.exports = Reboot;
