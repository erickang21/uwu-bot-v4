const Command = require("../../structures/Command.js");

class Reload extends Command {
  constructor(...args) {
    super(...args, {
      description: "Reloads a command.",
      usage: "<piece>",
      devOnly: true,
      aliases: ["r"],
      modes: ["text"],
      options: [
        {
          name: "piece",
          description: "The piece to reload.",
          type: "string",
          required: true,
        },
      ],
    });
  }

  async run(ctx, options) {
    const pieceName = options.getString("piece");
    const piece =
      this.client.commands.get(pieceName) || this.client.events.get(pieceName);

    if (!piece) return ctx.reply("I could not find that piece.");

    try {
      const reloaded = await piece.reload();
      return ctx.reply(`Successfully reloaded **${reloaded.name}**.`);
    } catch (err) {
      piece.store.set(piece);
      return ctx.reply(
        `Failed to reload **${piece.name}**\n\`\`\`js\n${
          err.message || err.toString()
        }\`\`\``
      );
    }
  }
}

module.exports = Reload;
