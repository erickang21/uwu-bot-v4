const Command = require("../../structures/Command.js");
const { request } = require("undici");

class Owoify extends Command {
  constructor(...args) {
    super(...args, {
      description: "need help being cute? this will translate for you!",
      usage: "owoify <text>",
      options: [
        {
          name: "text",
          description: "the text to owoify",
          type: "string",
          required: true,
        },
      ],
    });
  }

  async run(ctx, options) {
    const text = options.getString("text");
    const { owo } = await request(
      `https://nekos.life/api/v2/owoify?text=${text}`
    ).then(({ body }) => body.json());
    if (owo.length > 1994) return ctx.reply("Your text is too long!");
    return ctx.reply(owo);
  }
}

module.exports = Owoify;
