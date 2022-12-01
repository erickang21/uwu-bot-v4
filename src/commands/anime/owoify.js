const Command = require("../../structures/Command.js");
const { request } = require("undici");

class Owoify extends Command {
  constructor(...args) {
    super(...args, {
      description: "Make your text more kawaii..",
      usage: "kiss [text]",
      options: [
        {
          name: "text",
          description: "The text you want to transform.",
          type: "string",
          required: true
        },
      ],
    });
  }
  
  async run(ctx, options) {
    const text = options.getString("text");
    const processedText = encodeURIComponent(text.join(" "))
    const { owo } = await request(`https://nekos.life/api/v2/owoify?text=${text}`)
      .then(({ body }) => body.json());
    if (owo.length > 1994) return ctx.reply("Your text is too long!")
    return ctx.reply(owo);
      
  }
}


module.exports = Owoify;
