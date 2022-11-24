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
          description: "The shard to restart."
        }
      ]
    });
  }

  async run(ctx, options) {
    const shard = options.getInteger("shard") ?? this.client.shard?.ids[0];

    await ctx.reply(`Shutting down${shard ? ` shard ${shard}` : ""}...`);
    if (this.client.shard) {
      return this.client.shard.broadcastEval(client => {
        if (client.shard.ids.includes(shard)) process.exit();
      });
    } else {
      process.exit();
    }
  }
}

module.exports = Reboot;
