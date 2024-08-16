const Command = require("../../structures/Command.js");

class Causeerror extends Command {
  constructor(...args) {
    super(...args, {
      description: "Intentionally cause an error.",
      devOnly: true,
    });
  }

  async run(ctx) {
    const a = [];
    return ctx.reply(a[0].test);
  }
}

module.exports = Causeerror;
