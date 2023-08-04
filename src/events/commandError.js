const Event = require("../structures/Event.js");
const { EMOJIS } = require("../utils/constants.js");
const emojis = require("../structures/Emojis");

class CommandError extends Event {
  async run(ctx, err) {
    // Allow throw "string" to unwind stack from deepest calls
    // for replying with an error message.
    if (typeof err === "string") {
      return ctx.reply({ content: err });
    }

    this.client.log.error(err);

    const errorId =
      Date.now().toString(36) + Math.random().toString(36).substring(100);

    if (ctx.dev) {
      await ctx
        .reply({
          embeds: [
            this.client
              .embed(ctx.author)
              .setDescription(
                `${EMOJIS.X} **\`\`${ctx.command.name}\`\` threw an error**` +
                  "\n```js\n" +
                  err +
                  "```"
              ),
          ],
        })
        .catch(() => null);
    } else {
      // TODO(banana): Personalize this response for your bot.
      // TODO: update support server with constant
      await ctx
        .reply({
          embeds: [
            this.client
              .embed(ctx.author)
              .setDescription(
                `${emojis.error} NANI?! An error has occurred while running \`\`${ctx.command.name}\`\`. \n\nPlease join [uwu bot official server](https://discord.gg/vCMEmNJ and give the developers the error code: \`\`${errorId}\`\`.`
              ),
          ],
        })
        .catch(() => null);
    }

    const report = async (client, context) => {
      const channel = await client.channels.fetch("513368885144190986");
      if (!channel) return;

      const embed = client.embed()
        .setTitle("Command Error")
        .setDescription(
          `An error occurred with command: **${context.cmdName}**\n\`\`\`js\n${
            context.err.stack || context.err
          }\`\`\``
        )
        .setFields([
          {
            name: "Error ID",
            value: `\`\`${context.errorId}\`\``,
            inline: true,
          },
          {
            name: "User ID",
            value: `\`\`${context.userId}\`\``,
            inline: true,
          },
          {
            name: "Guild",
            value: context.guildName,
            inline: true,
          },
        ])
        .setTimestamp(new Date());

      return channel.send({ embeds: [embed] }).catch(() => null);
    };

    if (!ctx.dev) {
      if (this.client.shard) {
        return this.client.shard.broadcastEval(report, { context: { errorId, cmdName: ctx.command.name, userId: ctx.author.id, guildName: ctx.guild.name, err }});
      } else {
        return report(this.client);
      }
    }
  }
}

module.exports = CommandError;
