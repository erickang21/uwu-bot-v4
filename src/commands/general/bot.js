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
    return ctx.reply(`Hey, that's me! ${wave}\n\nTo check out my commands, use \`${ctx.prefix}help\`. To invite me, use \`${ctx.prefix}invite\`.`);
  }
}

module.exports = Bot;
