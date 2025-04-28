const Command = require("../../structures/Command.js");
const utils = require("../../utils/utils.js");

class Give extends Command {
  constructor(...args) {
    super(...args, {
      description: "Server manager command to manually give money.",
      guildOnly: true,
      usage: "give [@user] [amount]",
      options: [
        {
          name: "user",
          description: "The user to give this balance to.",
          type: "user",
          required: true,
        },
        {
          name: "amount",
          description: "The amount. Be careful to not inflate your economy!",
          type: "integer",
          required: true,
        }
      ],
    });
  }

  async run(ctx, options) {
    if(!ctx.member.permissions.has("MANAGE_GUILD")) return ctx.reply("Baka! You need the `Manage Server` permissions to use this command.\n\n(TIP: Want to pay your money to someone else? Use `uwu pay @user amount` instead!)");
    const user = options.getUser("user");
    const amount = options.getInteger("amount");

    const guildSettings = await this.client.syncGuildSettingsCache(ctx.guild.id);
    let updatedServerEconomy = guildSettings.economy;
    if (!updatedServerEconomy) {
      updatedServerEconomy = { 1: { icon: ":banana:" }};
    }
    if (!updatedServerEconomy[user.id]) {
      updatedServerEconomy[user.id] = 0;
    }
    updatedServerEconomy[user.id] += amount;
    const emoji = updatedServerEconomy[1].icon || ":banana:";
    this.client.guildUpdate(ctx.guild.id, { economy: updatedServerEconomy });
    return ctx.reply(`**Moderation Action:** You have paid **${amount}** ${emoji} to **${user.username}**.`);
  }

}

module.exports = Give;