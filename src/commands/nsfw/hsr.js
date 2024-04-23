const Command = require("../../structures/Command.js");
const utils = require("../../utils/utils.js");
const { request } = require("undici");
const emojis = require("../../structures/Emojis");

class Hsr extends Command {
  constructor(...args) {
    super(...args, {
      description: "find nsfw content of a hsr character.",
      usage: "hsr [character]",
      nsfw: true,
      options: [
        {
          name: "character",
          description: "character name (not every character is available here)",
          type: "string",
          required: true,
        },
      ],
    });
  }

  async run(ctx, options) {
    const blacklistedCharacters = ["huohuo", "clara", "hook"];
    const characterName = options.getString("character");
    let data;
    try {
      data = await request(
        `https://gelbooru.com/index.php?page=dapi&s=post&q=index&json=1&tags=${characterName.toLowerCase().replaceAll(" ", "_")}_(honkai:_star_rail)%20honkai:_star_rail%20feet%20-loli%20rating:explicit`
      ).then(({ body }) => body.json());
    } catch (e) {
      return ctx.reply(`An error occurred with the image service. ${emojis.failure}`);
    }
    if (!data.post?.length || blacklistedCharacters.includes(characterName.toLowerCase())) return ctx.reply(`No results were found. ${emojis.failure}`);
    const urls = data.post.map((entry) => entry.file_url)
    const embed = this.client
      .embed(ctx.author)
      .setTitle(`HSR R34: ${characterName} :eggplant:`)
      .setImage(utils.random(urls));
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Hsr;
