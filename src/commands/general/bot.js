const Command = require("../../structures/Command.js");
const { wave } = require("../../structures/Emojis.js");

class Bot extends Command {
  constructor(...args) {
    super(...args, {
      description: "Interaction if someone mentions it.",
      usage: "bot",
      hidden: true,
    });
  }

  async run(ctx) {
    return ctx.reply(`Hey, that's me! ${wave}\n\nTo check out my commands, use \`uwu help\`. To invite me, use uwu invite\`.`);
  }
}

module.exports = Bot;
