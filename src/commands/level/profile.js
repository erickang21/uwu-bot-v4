const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");

class Profile extends Command {
  constructor(...args) {
    super(...args, {
      description: "Displays your profile and current level.",
      aliases: ["pr"],
      options: [
        {
          name: "user",
          description: "(Optional) The user whose profile you want to check.",
          type: "user",
        },
      ],
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const userData = this.client.syncUserSettings(user.id);
    let breakpoint = 100 * (userData.level / 5) + 25 * userData.level;
    const embed = this.client.embed(user)
      .setTitle("Your Profile")
      .setDescription(`${emojis.level} **Level:** ${userData.level}\n${emojis.xp} **XP until next level:** ${userData.exp}/${breakpoint}`)
      .setThumbnail("https://cdn.discordapp.com/attachments/520734295112024064/1136078616661348472/849417442471706684.gif");

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Profile;
