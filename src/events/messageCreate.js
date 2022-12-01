const Event = require("../structures/Event.js");
const CommandContext = require("../structures/CommandContext.js");
const { distance } = require("fastest-levenshtein");
const { escapeRegex } = require("../utils/utils.js");
const { EMOJIS } = require("../utils/constants.js");

// eslint-disable-next-line quotes
const quotes = ['"', "'", "“”", "‘’"];
const flagRegex = new RegExp(
  `(?:--|—)(\\w[\\w-]+)(?:=(?:${quotes
    .map((qu) => `[${qu}]((?:[^${qu}\\\\]|\\\\.)*)[${qu}]`)
    .join("|")}|([\\w<>@#&!-]+)))?`,
  "g"
);
const delim = new RegExp("(\\s)(?:\\s)+");

class MessageCreate extends Event {
  getFlags(content) {
    const flags = {};
    content = content
      .replace(flagRegex, (match, fl, ...quote) => {
        flags[fl] = (quote.slice(0, -2).find((el) => el) || fl).replace(
          /\\/g,
          ""
        );
        return "";
      })
      .replace(delim, "$1");

    return { content, flags };
  }

  async run(message) {
    if (!message.content || message.author.bot) return;
    if (message.channel.partial) await message.channel.fetch();

    const { user } = this.client;

    const prefix = "uwu"; // TODO: this will need to use database later.
    const regex = new RegExp(
      `^<@!?${user.id}>|^${escapeRegex(prefix)}${!message.guild ? "|" : ""}`
    );
    const match = message.content.match(regex);

    if (!match) return;

    const prefixLength = match[0].length;
    const rawContent = message.content.slice(prefixLength).trim();

    // A mention only.
    if (!rawContent) {
      return message.channel.send(
        `${EMOJIS.WAVE} Hi there! Run \`\`@uwu bot help\`\` to see all I can do or browse the slash commands by typing \`\`/\`\``
      );
    }

    const { content, flags } = this.getFlags(rawContent);

    const args = content.split(/ +/g);
    const alias = args.shift().toLowerCase();

    const command = this.client.commands.get(alias);
    if (!command) return this.closestCommand(message, alias);
    if (!command.modes.includes("text")) return;

    const ctx = new CommandContext(command, {
      message,
      flags,
      content,
      prefixLength,
      alias,
      args,
    });

    if (command.devOnly && !ctx.dev) {
      return ctx.reply({
        content: `This command can only be used by the developers. ${EMOJIS.GIRL_CHILLING}`,
      });
    }

    if (command.nsfw && !ctx.channel.nsfw) {
      return ctx.reply({
        content: `This command can only be run in NSFW channels. ${EMOJIS.BONK}`,
      });
    }

    return command.execute(ctx);
  }

  closestCommand(msg, cmd) {
    const commands = this.client.commands.usableCommands(msg);
    const aliases = commands.map((command) => command.aliases).flat();
    const arr = [...commands.map((command) => command.name), ...aliases];

    let minDistance = Infinity;
    let minIndex = 0;

    for (let i = 0; i < arr.length; i++) {
      const dist = distance(cmd, arr[i]);
      if (dist < minDistance) {
        minDistance = dist;
        minIndex = i;
      }
    }

    if (minDistance > 2) return;

    const match = arr[minIndex];
    return msg.channel.send(
      `${EMOJIS.QUESTION_MARK} Did you mean \`${match}\`?`
    );
  }
}

module.exports = MessageCreate;
