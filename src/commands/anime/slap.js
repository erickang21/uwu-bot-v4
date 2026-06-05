const Command = require("../../structures/Command.js");
const { getNekosBestAPI } = require("../../helpers/anime.js");
const imageService = require("../../helpers/images.js");
const { AttachmentBuilder } = require("discord.js");

class Slap extends Command {
  constructor(...args) {
    super(...args, {
      description: "friend being stupid? slap some sense into them.",
      usage: "slap [user]",
      options: [
        {
          name: "user",
          description: "the user you want to slap",
          type: "user",
        },
      ],
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    let url;
    let animeName;
    let attachment;

    try {
      ({ url, animeName } = await getNekosBestAPI("slap"));
    } catch {
      return ctx.reply("No images available. Please try again later.");
    }

    if (!url) {
      const fallback = await imageService.getRandomSFWImage("slap");
      if (!fallback) return ctx.reply("No images available. Please try again later.");
      attachment = new AttachmentBuilder(fallback, { name: "image.gif" });
      url = "attachment://image.gif";
      animeName = "Unknown";
    }
    const embed = this.client.embed(ctx.author).setTitle(`Slap!`).setImage(url).setFooter({ text: `Anime: ${animeName}` });
    if (user.id !== ctx.author.id)
      embed.setDescription(
        `**${ctx.author.username}** is slapping **${user.username}**!`
      );
    const reply = { embeds: [embed] };
    if (attachment) reply.files = [attachment];
    return ctx.reply(reply);
  }
}

module.exports = Slap;
