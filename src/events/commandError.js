const Event = require("../structures/Event.js");
const { EMOJIS } = require("../utils/constants.js");
const emojis = require("../structures/Emojis");
const { getMessageContent } = require("../helpers/helpers.js");
const { ApiError } = require("../utils/errors.js");

class CommandError extends Event {
  /**
   * An ApiError means a provider failed us, a bare string means the user was
   * told they did something wrong, anything else means we have a bug. Only the
   * last kind should ever move the needle on our own error rate.
   */
  static classify(err) {
    if (err instanceof ApiError) return "api";
    if (typeof err === "string") return "validation";
    return "logic";
  }

  record(ctx, err) {
    this.client.analyticsManager?.commandErrored({
      command: ctx.command?.name,
      category: ctx.command?.category,
      kind: CommandError.classify(err)
    });
  }

  async run(ctx, err) {
    this.record(ctx, err);

    // An upstream provider failed. The user sees the same message a bare string
    // throw produces; only the analytics attribution differs.
    if (err instanceof ApiError) {
      return ctx.reply({ content: err.message });
    }

    // Allow throw "string" to unwind stack from deepest calls
    // for replying with an error message.
    if (typeof err === "string") {
      return ctx.reply({ content: err });
    }

    this.client.log.error(err);

    const errorId =
      Date.now().toString(36) + Math.random().toString(36).substring(100);
    if (ctx.dev) {
      // Prevent spam of error logs due to testing
      return await ctx
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
    if (!this.client.dev) {
      if (this.client.shard) {
        return this.client.shard.broadcastEval(report, { context: { content: getMessageContent(ctx), errorEmoji:  emojis.commandError, errorId, cmdName: ctx.command.name, userId: ctx.author.id, guildId: ctx.guild.id, guildName: ctx.guild.name, err: err.stack.toString() || err.toString() }});
      } else {
        return report(this.client);
      }
    }
  }
}

module.exports = CommandError;
