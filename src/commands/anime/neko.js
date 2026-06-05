const Command = require("../../structures/Command.js");
const { getNekosBestAPI } = require("../../helpers/anime.js");
const imageService = require("../../helpers/images.js");
const { AttachmentBuilder } = require("discord.js");

class Neko extends Command {
  constructor(...args) {
    super(...args, {
      description: "get a random picture of a neko!",
      usage: "neko",
    });
  }

  async run(ctx) {
    let url;
    let animeName;
    let attachment;

    try {
      ({ url, animeName } = await getNekosBestAPI("neko"));
    } catch {}

    if (!url) {
      const fallback = await imageService.getRandomSFWImage("neko");
      if (!fallback) return ctx.reply("No images available. Please try again later.");
      attachment = new AttachmentBuilder(fallback, { name: "image.gif" });
      url = "attachment://image.gif";
      animeName = "Unknown";
    }

    const embed = this.client.embed(ctx.author).setTitle(`Neko`).setImage(url).setFooter({ text: `Anime: ${animeName}` });
    const reply = { embeds: [embed] };
    if (attachment) reply.files = [attachment];
    return ctx.reply(reply);
  }
}

module.exports = Neko;
