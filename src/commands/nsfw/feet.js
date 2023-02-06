const Command = require("../../structures/Command.js");
const utils = require("../../utils/utils.js");

class Feet extends Command {
  constructor(...args) {
    super(...args, {
      description: "[NSFW] Feet.",
      usage: "feet",
      nsfw: true,
    });
  }

  async run(ctx) {
    const pics = [
      "https://cdn.discordapp.com/attachments/971571880286896149/971572183300177960/SPOILER_182928192_314856043495566_2596319609186372900_n.jpg",
      "https://cdn.discordapp.com/attachments/971571880286896149/971572509755469924/SPOILER_182928192_1121327441682131_1534067970548676476_n.jpg",
      "https://cdn.discordapp.com/attachments/971571880286896149/971572545218289704/SPOILER_184127222_883083415606989_978225082224040113_n.jpg",
      "https://cdn.discordapp.com/attachments/971571880286896149/971572579900985434/SPOILER_210590935_314314557055217_5682915470510538396_n.jpg",
      "https://cdn.discordapp.com/attachments/971571880286896149/971572639581745152/SPOILER_233081049_356249222828024_6190339157898801915_n.jpg",
      "https://cdn.discordapp.com/attachments/971571880286896149/971572679079518329/SPOILER_234128597_239653597888088_6030148581855752475_n.jpg",
      "https://cdn.discordapp.com/attachments/971571880286896149/971572724071825438/SPOILER_cute_anime_feet_140058301_846404376137436_5359714323893029709_n.jpg",
      "https://cdn.discordapp.com/attachments/971571880286896149/971572760251879464/SPOILER_Screenshot_20200724-225139_Instagram.jpg",
      "https://cdn.discordapp.com/attachments/971571880286896149/971572782792065084/SPOILER_Screenshot_20200724-225152_Instagram.jpg",
      "https://cdn.discordapp.com/attachments/971571880286896149/971572831613775872/SPOILER_Screenshot_20200727-235645_Instagram.jpg",
      "https://cdn.discordapp.com/attachments/971571880286896149/971572883304366120/SPOILER_cute_anime_feet_133027419_432967321208700_8498552615561769828_n.jpg",
      "https://cdn.discordapp.com/attachments/971571880286896149/971572916913311784/SPOILER_cute_anime_feet_246787656_383420296856380_4263360150901068195_n.jpg",
      "https://cdn.discordapp.com/attachments/971571880286896149/971572971179212820/SPOILER_cute_anime_feet_269991837_610883456830042_415488698944999837_n.jpg",
      "https://cdn.discordapp.com/attachments/971571880286896149/971573000304488489/SPOILER_cute_anime_feet_270785799_1146616162743225_5460415321169942173_n.jpg",
      "https://cdn.discordapp.com/attachments/971571880286896149/971573120815226970/SPOILER_cute_anime_feet_271500083_3559827660808533_896690456879456074_n.jpg",
      "https://cdn.discordapp.com/attachments/971571880286896149/971573459572392006/SPOILER_cute_anime_feet_271843736_610298360044271_6102515142732944555_n.webp.jpg",
      "https://cdn.discordapp.com/attachments/971571880286896149/971573487338684476/SPOILER_cute_anime_feet_272004448_444314797426605_4343918375050499031_n.webp.jpg",
      "https://cdn.discordapp.com/attachments/971571880286896149/971573522486935552/SPOILER_cute_anime_feet_272007138_374371974452428_5775323839595552101_n.webp.jpg",
    ];
    const embed = this.client
      .embed(ctx.author)
      .setTitle("Feet :eggplant:")
      .setImage(utils.random(pics));
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Feet;
