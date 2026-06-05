const Command = require("../../structures/Command.js");
const { getNekosBestAPI } = require("../../helpers/anime.js");
const imageService = require("../../helpers/images.js");
const { AttachmentBuilder } = require("discord.js");

class Yeet extends Command {
  constructor(...args) {
    super(...args, {
      description: "get rid of them once and for all! yeet them.",
      usage: "yeet [user]",
      options: [
        {
          name: "user",
          description: "the user you want to yeet",
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
      ({ url, animeName } = await getNekosBestAPI("yeet"));
    } catch {
      return ctx.reply("No images available. Please try again later.");
    }

    if (!url) {
      const fallback = await imageService.getRandomSFWImage("yeet");
      if (!fallback) return ctx.reply("No images available. Please try again later.");
      attachment = new AttachmentBuilder(fallback, { name: "image.gif" });
      url = "attachment://image.gif";
      animeName = "Unknown";
    }
    const embed = this.client
      .embed(ctx.author)
      .setTitle(`YEET >:)`)
      .setImage(url)
      .setFooter({ text: `Anime: ${animeName}` });
    if (user.id !== ctx.author.id)
      embed.setDescription(
        `**${ctx.author.username}** is yeeting **${user.username}**! See you later!`
      );
    const reply = { embeds: [embed] };
    if (attachment) reply.files = [attachment];
    return ctx.reply(reply);
  }
}

module.exports = Yeet;
