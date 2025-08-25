const Command = require("../../structures/Command.js");
const utils = require("../../utils/utils.js");
const { gelbooruAPI } = require("../../helpers/anime");

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
    const result = await gelbooruAPI([`${characterName.toLowerCase().replaceAll(" ", "_")}_(honkai:_star_rail)`, "honkai:_star_rail"]);
    if (!result.length || blacklistedCharacters.includes(characterName.toLowerCase())) return ctx.reply(`No results were found. ${emojis.failure}`);
    const urls = result.map((entry) => entry.file_url)
    const embed = this.client
      .embed(ctx.author)
      .setTitle(`HSR R34: ${characterName} :eggplant:`)
      .setImage(utils.random(urls));
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Hsr;
