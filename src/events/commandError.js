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
    console.log("Error caught!!")
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
              .setTitle("An error occurred.")
              .setDescription(
                `${emojis.error} Something went wrong while running \`\`${ctx.command.name}\`\`. Don't worry, it's not your fault! \n\nPlease join [uwu bot official server](https://discord.gg/WzgYaGTbEG), and give the developers this error code: \`\`${errorId}\`\`.`
              ),
          ],
        })
        .catch(() => null);
    }

    const report = async (client, context) => {
      const channel = await client.channels.fetch("513368885144190986");
      if (!channel) return;

      const embed = client.embed()
        .setTitle(`Command Error ${context.errorEmoji}`)
        .setDescription(
          `An error occurred with command: **${context.cmdName}**\n\`\`\`js\n${
            context.err
          }\`\`\``
        )
        .setFields([
          {
            name: "User ID",
            value: `\`\`${context.userId}\`\``,
            inline: true,
          },
          {
            name: "Guild",
            value: `${context.guildName || "Could not get guild name."} (ID: ${context.guildId})`,
            inline: true,
          },
          {
            name: "Command Usage",
            value: context.content || "Could not get message content.",
            inline: true,
          }
        ])
        .setTimestamp(new Date());

      return channel.send({ content: `**Error ID:** \`${context.errorId}\``, embeds: [embed] }).catch(() => null)
    };
    console.log("Attempting to send a error message")
    if (!this.client.dev) {
      console.log("Attempting to send a error message, isn't dev")
      if (this.client.shard) {
        console.log("Attempting to send now")
        return this.client.shard.broadcastEval(report, { context: { content: ctx.content, errorEmoji:  emojis.commandError, errorId, cmdName: ctx.command.name, userId: ctx.author.id, guildId: ctx.guild.id, guildName: ctx.guild.name, err: err.stack.toString() || err.toString() }});
      } else {
        console.log("Did not to send a error message")
        return report(this.client);
      }
    }
  }
}

module.exports = CommandError;
