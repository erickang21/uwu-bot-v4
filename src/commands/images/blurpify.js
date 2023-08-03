const Command = require("../../structures/Command.js");
const { request } = require("undici");

class Blurpify extends Command {
  constructor(...args) {
    super(...args, {
      description: "Blurpify someone's profile picture!",
      usage: "blurpify @user",
      options: [
        {
          name: "user",
          description: "The user you want to kiss.",
          type: "user",
        },
      ],
    });
  }

  // Image Based
  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const res = await request(`https://nekobot.xyz/api/imagegen?type=blurpify&image=${user.displayAvatarURL({ size: 1024, extension: "png", dynamic: true })}`)
      .then(({ body }) => body.json());
    console.log(res);
    if (!res.success) return ctx.reply("An unexpected error occurred with the API.");
    const embed = this.client.embed(user)
      .setTitle("Blurpify")
      .setImage(res.message)
    return ctx.reply({ embed });
  }
}


module.exports = Blurpify;