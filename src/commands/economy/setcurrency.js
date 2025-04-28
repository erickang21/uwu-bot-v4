const Command = require("../../structures/Command.js");
const utils = require("../../utils/utils.js");

class Setcurrency extends Command {
  constructor(...args) {
    super(...args, {
      description: "Customize the icon of the currency used in your server.",
      guildOnly: true,
      usage: "setcurrency <emoji>",
      options: [
        {
          name: "emoji",
          description: "The emoji to set this currency to. Type \"default\" to reset to the original banana icon.",
          type: "string",
          required: true,
        }
      ],
    });
  }

  async run(ctx, options) {
    if(!ctx.member.permissions.has("MANAGE_GUILD")) return ctx.reply("Baka! You need the `Manage Server` permissions to use this command.\n\n(TIP: Want to pay your money to someone else? Use `uwu pay @user amount` instead!)");
    let currencyEmoji = options.getString("emoji");
    if (["default", "reset"].includes(currencyEmoji.toLowerCase())) currencyEmoji = ":banana:";
    const emojiRegex = /(<a?:[A-Za-z0-9]+:[0-9]+>)|(:[A-Za-z0-9]+:)/g;
    if (!emojiRegex.test(currencyEmoji)) return ctx.reply("That is not a valid emoji. You can use a Discord default emoji or custom emojis within your server.");

    this.client.guildUpdate(ctx.guild.id, { economyIcon: currencyEmoji });
    return ctx.reply(`You have set the **currency icon** to: ${currencyEmoji}.\n\nPlease note: Icons chosen must be appropriate and we reserve the right to clear anything deemed inappropriate.`);
  }

}

module.exports = Setcurrency;