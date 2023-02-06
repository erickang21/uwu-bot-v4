const Command = require("../../structures/Command.js");
const { inspect } = require("util");
const { getCodeBlock } = require("../../utils/utils.js");
const { request } = require("undici");
const { AttachmentBuilder } = require("discord.js");

class Eval extends Command {
  constructor(...args) {
    super(...args, {
      description: "Evaluates arbitrary JavaScript",
      devOnly: true,
      usage: "eval <code>",
      aliases: ["ev"],
      modes: ["text"],
    });
  }

  async run(ctx) {
    if (!ctx.args.length) {
      return ctx.reply("Baka! You need to give me code to evaluate.");
    }

    const { clean, client } = this;
    const { code } = getCodeBlock(ctx.rawArgs);
    const token = client.token.split("").join("[^]{0,2}");
    const rev = client.token.split("").reverse().join("[^]{0,2}");
    const filter = new RegExp(`${token}|${rev}`, "g");

    try {
      let output = eval(code);
      if (
        output instanceof Promise ||
        (Boolean(output) &&
          typeof output.then === "function" &&
          typeof output.catch === "function")
      )
        output = await output;
      if (ctx.flags.hidden) return;
      const depth = !isNaN(ctx.flags.depth) ? ctx.flags.depth : 0;
      output = inspect(output, { depth, maxArrayLength: null });
      output = output.replace(filter, "[TOKEN]");
      output = clean(output);
      if (output.length < 1950) {
        return ctx.reply(`<:downvote:577978089502670848> **Input:**\n\`\`\`js\n${code}\n\`\`\`\n\n<:upvote:577978089531768832> **Output:**\n\`\`\`js\n${output}\n\`\`\``);
      } else {
        await ctx.channel.send({ 
          content: `<:downvote:577978089502670848> **Input:**\n\`\`\`js\n${code}\n\`\`\``,
          files: [new AttachmentBuilder(Buffer.from(output)).setName('output.txt')] 
        })
      }
    } catch (error) {
      return ctx.reply(`Error: \`\`\`js\n${error}\`\`\``);
    }
  }

  clean(text) {
    return text
      .replace(/`/g, "`" + String.fromCharCode(8203))
      .replace(/@/g, "@" + String.fromCharCode(8203));
  }
}

module.exports = Eval;
