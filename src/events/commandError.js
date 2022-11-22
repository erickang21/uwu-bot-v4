const Event = require("../structures/Event.js");
const { EMOJIS } = require("../utils/constants.js");

class CommandError extends Event {
  async run(ctx, err) {
    // Allow throw "string" to unwind stack from deepest calls
    // for replying with an error message.
    if (typeof err === "string") {
      return ctx.reply({ content: err });
    }

    this.client.log.error(err);

    if (ctx.dev) {
      await ctx.reply({
        embeds: [this.client.embed(ctx.author).setDescription(`${EMOJIS.X} **\`\`${ctx.command.name}\`\` threw an error**` + "\n```js\n" + err + "```")]
      })
        .catch(() => null);
      
    } else {
      // TODO(banana): Personalize this response for your bot.
      // TODO: update support server with constant
      await ctx.reply({
        embeds: [this.client.embed(ctx.author).setDescription(`${EMOJIS.X} **Whoops! Running \`\`${ctx.command.name}\`\` went wrong and the issue has been reported. In the meantime you can join my [support server!](https://discord.gg/vCMEmNJ)**`)]
      })
        .catch(() => null);
    }

    const channel = this.client.channels.cache.get("513368885144190986");
    if (!channel) return;

    const embed = this.client.embed(ctx.author)
      .setTitle("Command Error")
      .setDescription(`An Error occured in command: ${ctx.command.name}\n\`\`\`js\n${err.stack || err}\`\`\``)
      .setFooter({
        text: `User ID: ${ctx.author.id}, Guild: ${ctx.guild ? ctx.guild.name : "DM"}`
      });

    return channel.send({ embeds: [embed] }).catch(() => null);
  }
}

module.exports = CommandError;
