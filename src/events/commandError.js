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
									"```",
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
								`${EMOJIS.X} **Whoops! Running \`\`${ctx.command.name}\`\` went wrong and the issue has been reported. In the meantime you can join my [support server](https://discord.gg/vCMEmNJ), give them error code \`\`${errorId}\`\`**`,
							),
					],
				})
				.catch(() => null);
		}

		const report = (client) => {
			const channel = client.channels.cache.get("867791409008607276");
			if (!channel) return;

			const embed = client
				.embed(ctx.author)
				.setTitle("Command Error")
				.setDescription(
					`An Error occured in command: ${
						ctx.command.name
					}\n\`\`\`js\n${err.stack || err}\`\`\``,
				)
				.setFields([
					{
						name: "Error ID",
						value: `\`\`${errorId}\`\``,
						inline: true,
					},
					{
						name: "User ID",
						value: `\`\`${ctx.author.id}\`\``,
						inline: true,
					},
					{
						name: "Guild",
						value: ctx.guild ? ctx.guild.name : "DM",
						inline: true,
					},
				])
				.setTimestamp(new Date());

			return channel.send({ embeds: [embed] }).catch(() => null);
		};

		// No point error reporting in dev mode
		if (!ctx.dev) {
			if (this.client.shard) {
				return this.client.shard.broadcastEval(report);
			} else {
				return report(this.client);
			}
		}
	}
}

module.exports = CommandError;
