const Command = require("../../structures/Command.js");
const { stripIndents } = require("common-tags");
const { toProperCase } = require("../../utils/utils.js");

class Help extends Command {
  constructor(...args) {
    super(...args, {
      description: "confused? get a list of commands, or how they're used!",
      usage: "help [command]",
      options: [
        {
          name: "command",
          description: "(optional) the command to view details for",
          type: "string",
        },
      ],
    });
  }

  async run(ctx, options) {
    const command = options.getString("command");
    const map = {}; // Map<Category, Array<Command.Name>>
    const userData = await this.client.syncUserSettings(ctx.author.id);
    const breakpoint = 100 * Math.floor(userData.level / 5) + 25 * userData.level;

    for (const command of this.store.values()) {
      // Check for hidden commands first so if all commands in a category is hidden we won't even show the category.
      if (command.hidden) continue;
      if (command.devOnly && !ctx.dev) continue;
      if (command.nsfw && !ctx.channel.nsfw) continue;

      if (!map[command.category]) map[command.category] = [];
      map[command.category].push(command.name);
    }

    const categories = Object.keys(map).sort();

    if (command) {
      const cmd = this.store.get(command);

      /*
      To be added when docs are added back
      \n\n**Documentation:** https://docs.uwubot.tk/modules/${command
                .toLowerCase()
                .replace(/ /g, "-")}
      */
      if (!cmd) {
        if (categories.includes(toProperCase(command))) {
          const embed = this.client
            .embed()
            .setTitle(`${toProperCase(command)} Commands`)
            .setFooter({ text: `${ctx.author.username} | Level ${userData.level} (${userData.exp}/${breakpoint} XP)`, iconURL: ctx.author.displayAvatarURL({ size: 32, extension: 'png' }) })
            .setDescription(
              `${map[toProperCase(command)].join(
                ", "
              )}`
            );
          return ctx.reply({ embeds: [embed] });
        } else {
          return ctx.reply(
            "That command does not exist! Why would you think I'd have such a thing?"
          );
        }
      } else {
        if (cmd.nsfw && ctx.guild && !ctx.channel.nsfw) {
          return ctx.reply(
            "Baka! You can't view details of that command in a non NSFW channel."
          );
        }

        // TODO: database stuff later.
        const prefix = "uwu ";
        
        const embed = this.client.embed()
          .setTitle(`Help - ${cmd.name}`)
          .setDescription(
            [
              `**Description:** ${cmd.description}`,
              `**Category:** ${cmd.category}`,
              `**Aliases:** ${
                cmd.aliases.length ? cmd.aliases.join("\n") : "None"
              }`,
              `**Cooldown:** ${
                cmd.cooldown ? cmd.cooldown + " Seconds" : "None"
              }`,
              `**Usage:** ${prefix}${cmd.usage}`,
              `**Extended Help:** ${cmd.extendedHelp}`,
            ].join("\n")
          )
          .setFooter({ text: `${ctx.author.username} | Level ${userData.level} (${userData.exp}/${breakpoint} XP)`, iconURL: ctx.author.displayAvatarURL({ size: 32, extension: 'png' }) });

        return ctx.reply({ embeds: [embed] });
      }
    }

    const embed = this.client
      .embed()
      .setTitle("Help - Commands").setDescription(stripIndents`Want to check out what's poppin' in **v5 of uwu bot?** Read all the update notes by running \`uwu updates\`!
      
      **__Commands__**
        Run \`uwu help <category>\` to view all commands in the category, or click the given links to see detailed documentation.
        Run \`uwu help <command>\`to get details of that command.      
      `)
      .setFooter({ text: `${ctx.author.username} | Level ${userData.level} (${userData.exp}/${breakpoint} XP)`, iconURL: ctx.author.displayAvatarURL({ size: 32, extension: 'png' }) })

    // Sort the categories alphabetically.
    const keys = Object.keys(map).sort();

    /*
    To be added when docs comes back:
    \n[More Info](https://docs.uwubot.tk/modules/${category
          .toLowerCase()
          .replace(/ /g, "-")})
    */
    for (const category of keys) {
      embed.addFields({
        name: category,
        value: `\`uwu help ${category.toLowerCase()}\``,
        inline: true,
      });
    }

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Help;
