const Command = require("../../structures/Command.js");
const utils = require("../../utils/utils.js");
const { gelbooruAPI } = require("../../helpers/anime");

class Genshin extends Command {
  constructor(...args) {
    super(...args, {
      description: "find nsfw content of a genshin character.",
      usage: "genshin [character]",
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
    const blacklistedCharacters = ['klee', 'qiqi', 'sayu', 'diona', 'nahida'];
    const characterName = options.getString("character");
    const result = await gelbooruAPI([`${characterName.toLowerCase().replaceAll(" ", "_")}_(genshin_impact)`, "genshin_impact"]);
    if (!result.length || blacklistedCharacters.includes(characterName.toLowerCase())) return ctx.reply(`No results were found. ${emojis.failure}`);
    const urls = result.map((entry) => entry.file_url)
    const embed = this.client
      .embed(ctx.author)
      .setTitle(`Genshin R34: ${characterName} :eggplant:`)
      .setImage(utils.random(urls));
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Genshin;
