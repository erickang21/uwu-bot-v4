const Command = require("../../structures/Command.js");

class Avatar extends Command {
  constructor(...args) {
    super(...args, {
      description: "view someone's profile picture.",
      usage: "avatar [user]",
      aliases: ["av"],
      options: [
        {
          name: "user",
          description: "the user whose avatar you want to see",
          type: "user",
        },
      ],
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const url = user.displayAvatarURL({
      extension: "png",
      forceStatic: true,
      size: 1024,
    });

    const embed = this.client
      .embed(user)
      .setTitle(`${user.username}'s avatar`)
      .setURL(url)
      .setDescription(`[png link](${url})`)
      .setImage(url);

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Avatar;
