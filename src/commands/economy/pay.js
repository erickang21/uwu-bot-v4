const Command = require("../../structures/Command.js");
const utils = require("../../utils/Utils.js");

class Pay extends Command {
  constructor(...args) {
    super(...args, {
      description: "Feelin' generous? Give some of your credit to others!",
      guildOnly: true,
      usage: "pay [@user] [amount]",
      options: [
        {
          name: "user",
          description: "The user to give these credits to.",
          type: "user",
          required: true,
        },
        {
          name: "amount",
          description: "The amount to pay.",
          type: "integer",
          required: true,
        }
      ],
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user");
    const amount = options.getInteger("amount");
    if (user.bot) return ctx.reply("You cannot pay a bot!");
    if (user.id === ctx.author.id) return ctx.reply("Nice try, baka. You can't pay yourself!");
    if (amount <= 0) return ctx.reply("The amount to pay must be a positive number.");
    const guildSettings = await this.client.syncGuildSettingsCache(ctx.guild.id);
    let updatedServerEconomy = guildSettings.economy;
    if (!updatedServerEconomy) {
      updatedServerEconomy = { 1: { icon: ":banana:" }};
    }
    if (!updatedServerEconomy[user.id]) {
      updatedServerEconomy[user.id] = 0;
    }
    if (!updatedServerEconomy[ctx.author.id] || updatedServerEconomy[ctx.author.id] < amount) return ctx.reply("You don't have enough credits to pay this. Help yourself before you help others!");
    updatedServerEconomy[ctx.author.id] -= amount;
    updatedServerEconomy[user.id] += amount;
    const emoji = updatedServerEconomy[1].icon || ":banana:";
    this.client.guildUpdate(ctx.guild.id, { economy: updatedServerEconomy });
    return ctx.reply(`So generous! You paid **${amount}** ${emoji} to **${user.username}**.`);
  }

}

module.exports = Pay;