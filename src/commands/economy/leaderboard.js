const Command = require("../../structures/Command.js");
const { MessageEmbed } = require("discord.js");

// CREDIT: ravener
class Leaderboard extends Command {
  constructor(...args) {
    super(...args, {
      description: "View the server leaderboard.",
      usage: "leaderboard [page]",
      guildOnly: true,
      aliases: ["lb", "top"],
      options: [{
        name: "page",
        description: "The page to be viewed. Each page has 10 entries!",
        type: "integer",
      }]
    });
  }

  async run(ctx, options) {
    const PAGE_SIZE = 10;
    const page = options.getInteger("page") ?? 1;
    const guildSettings = this.client.settings.guilds.get(ctx.guild.id);
    const serverEconomy = guildSettings?.economy;
    if(!serverEconomy || Object.entries(serverEconomy).length <= 1) return ctx.reply("I'm unable to create a leaderboard! This is probably because no one in the server has used an economy command yet.")
    const emoji = guildSettings?.economyIcon || ":banana:";
    const entries = Object.entries(serverEconomy);

    entries.sort((a, b) => {
      if (a[1] < b[1]) return 1;
      if (a[1] > b[1]) return -1;
      return 0;
    });
    const totalPages = Math.max(Math.ceil(entries.length / PAGE_SIZE), 1);

    if(page > totalPages) return ctx.reply(`There are only **${totalPages || 1}** pages in the leaderboard.`);
    const leaderboard = [];

    const top = entries.slice((page - 1) * 10, page * 10); // Users probably think in 1-indexing :)
    await top.forEach(async ([userId, amount], index) => {

      const user = await this.client.users.fetch(userId);
      const place = (page - 1) * 10 + (index + 1);
      let rankTxt = "";
      switch (place) {
        case 1:
          rankTxt = ":first_place:";
          break;
        case 2:
          rankTxt = ":second_place:";
          break;
        case 3:
          rankTxt = ":third_place:";
          break;
        default:
          rankTxt = place.toString().padStart(2, "0");
          break;
      }
      leaderboard.push(`**${rankTxt}** ❯ ${user.username}\n    → ${parseInt(amount).toLocaleString()} ${emoji}`);
    })

    const selfIndex = entries.findIndex(([key, value]) => key === ctx.author.id);
    const selfPos = selfIndex + 1;
    let rankTxt = "";
    switch (selfPos) {
      case 1:
        rankTxt = ":first_place:";
        break;
      case 2:
        rankTxt = ":second_place:";
        break;
      case 3:
        rankTxt = ":third_place:";
        break;
      default:
        rankTxt = selfPos.toString().padStart(2, "0");
        break;
    }
    leaderboard.push(`\n**${rankTxt} ❯ YOU\n    => ${parseInt(entries[selfIndex][1]).toLocaleString()} ${emoji}**`);
    const embed = this.client.embed()
      .setTitle(`Leaderboard: ${ctx.guild.name}`)
      .setColor(0xfc2eff)
      .setDescription(leaderboard.join("\n"))
      .setFooter({ text: `Page ${page}/${totalPages || 1} • "uwu lb [page]" to see other pages!` })
    return ctx.reply({ embeds: [embed]});
  }
}

module.exports = Leaderboard;