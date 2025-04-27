const Command = require("../../structures/Command.js");
const { request } = require("undici");

class Rizz extends Command {
  constructor(...args) {
    super(...args, {
      description: "if you dare? send someone a nice pickup line",
      usage: "rizz [user]",
      options: [
        {
          name: "user",
          description: "the user that you wanna rizz up",
          type: "user",
        },
      ],
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const { text } = await request("https://rizzapi.vercel.app/random").then(
      ({ body }) => body.json()
    );
    return ctx.reply(`Hey, **${user.username}*! ${text}`);
  }
}

module.exports = Rizz;
