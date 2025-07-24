const Command = require("../../structures/Command.js");
const { up, down, blueRightArrow, star } = require("../../structures/Emojis.js");
const { DateTime } = require("luxon");

class Serverstats extends Command {
  constructor(...args) {
    super(...args, {
      description: "shows trend of servers over time.",
      aliases: ["info"],
      devOnly: true,
    });
  }

  async run(ctx) {
    const embed = this.client.embed()
      .setTitle("Server Stats")
    .setDescription("Shows trend of servers over time.")
    const today = DateTime.utc();
    for (let i = 0; i < 7; i++) {
      const date = today.minus({ days: i });
      const dateString = date.toFormat("yyyy-MM-dd");
      const serverData = await this.client.analyticsManager.getServerCount(dateString) ?? { count: 0, increase: 0, decrease: 0 };
      const dataStr = `${blueRightArrow} ${serverData.count}\n${up} ${serverData.increase}\n${down} ${serverData.decrease}`;
      embed.addFields({ name: `${dateString}${i === 0 ? ` ${star}` : ""}`, value: dataStr, inline: true });
    }
    embed.setFooter({ text: `Analytics recorded since: 07-21-2025` });
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Serverstats;
