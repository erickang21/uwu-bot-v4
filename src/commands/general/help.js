const Command = require("../../structures/Command.js");
const { stripIndents } = require("common-tags");
const { toProperCase } = require("../../utils/utils.js");

class Help extends Command {
  constructor(...args) {
    super(...args, {
      description: "View help for commands.",
      usage: "help [command]",
      options: [
        {
          name: "command",
          description: "The command to view help for.",
          type: "string"
        }
      ]
    });
  }

  async run(ctx, options) {
    const command = options.getString("command");
    const map = {}; // Map<Category, Array<Command.Name>>

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

      if (!cmd) {
        if (categories.includes(toProperCase(command))) {
          const embed = this.client.embed(this.client.user)
            .setTitle(`${toProperCase(command)} Commands`)
            .setDescription(`${map[toProperCase(command)].join(", ")}\n\n**Documentation:** https://docs.uwubot.tk/modules/${command.toLowerCase().replace(/ /g, "-")}`);
          return ctx.reply({ embeds: [embed] });
        } else {
          return ctx.reply("That command does not exist! Why would you think I'd have such a thing?");
        }
      } else {
        if (cmd.nsfw && (ctx.guild && !ctx.channel.nsfw)) {
          return ctx.reply("Baka! You can't view details of that command in a non NSFW channel.");
        }

        // TODO: database stuff later.
        const prefix = "uwu ";

        const embed = this.client.embed(this.client.user)
          .setTitle(`Help - ${cmd.name}`) 
          .setDescription([
            `**Description:** ${cmd.description}`,
            `**Category:** ${cmd.category}`,
            `**Aliases:** ${cmd.aliases.length ? cmd.aliases.join("\n") : "None"}`,
            `**Cooldown:** ${cmd.cooldown ? cmd.cooldown + " Seconds" : "None"}`,
            `**Usage:** ${prefix}${cmd.usage}`,
            `**Extended Help:** ${cmd.extendedHelp}`
          ].join("\n"));

        return ctx.reply({ embeds: [embed] });
      }
    }

    const embed = this.client.embed(this.client.user)
      .setTitle("Help - Commands") 
      .setDescription(stripIndents`**__Commands__**
        Run \`uwu help <category>\` to view all commands in the category, or click the given links to see detailed documentation.
        Run \`uwu help <command>\`to get details of that command.      
      `);

    // Sort the categories alphabetically.
    const keys = Object.keys(map).sort();

    for (const category of keys) {
      embed.addFields({
        name: category,
        value: `\`uwu help ${category.toLowerCase()}\`\n[More Info](https://docs.uwubot.tk/modules/${category.toLowerCase().replace(/ /g, "-")})`,
        inline: true
      });
    }

    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Help;
