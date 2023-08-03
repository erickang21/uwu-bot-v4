const Command = require("../../structures/Command.js");

class Viewuser extends Command {
  constructor(...args) {
    super(...args, {
      description: "Views the current configuration for the user.",
      usage: "[user]",
      devOnly: true,
      aliases: ["vuser"],
      options: [
        {
          name: "user",
          description: "The user to check.",
          type: "user",
        },
      ],
    });
  }

  async run(ctx, options) {
    const user = options.getUser("user") || ctx.author;
    const userData = await this.client.syncUserSettings(user.id);
    let str = "{\n";
    for (const key of Object.keys(userData)) {
      str += `  ${key}: ${JSON.stringify(userData[key])},\n`;
    }
    str += "}";
    const embed = this.client.embed(user)
      .setTitle(`User Settings`)
      .setDescription(`\`\`\`${str}\`\`\``);
    return ctx.reply({
      embeds: [ embed ],
    });
  }


}

module.exports = Viewuser;
