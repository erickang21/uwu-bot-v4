const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");

class Balance extends Command {
  constructor(...args) {
    super(...args, {
      description: "Displays your credit balance in this server.",
      aliases: ["bal"],
      options: [
        {
          name: "user",
          description: "(optional) the user whose balance you want to check. leave blank to check your own!",
          type: "user",
        },
      ],
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const guildSettings = this.client.settings.guilds.get(ctx.guild.id);
    const serverEconomy = guildSettings?.economy;
    let balance;
    let emoji = guildSettings?.economyIcon || ":banana:";
    if (!serverEconomy) {
      balance = 0;
      emoji = ":banana:";
    } else if (!serverEconomy[user.id]) {
      balance = 0;
    } else {
      balance = serverEconomy[user.id];
    }
    return ctx.reply(`${user.id === ctx.author.id ? "You currently have " : `**${user.username}** currently has `}**${balance.toLocaleString()}** ${emoji}!`);
  }
}

module.exports = Balance;
