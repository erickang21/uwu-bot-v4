const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");
const { stripIndents } = require("common-tags");

class ManageCommands extends Command {
  constructor(...args) {
    super(...args, {
      name: "command",
      description: "Turn on/off commands server-wide. (Use help for more details)",
      usage: "command <enable/disable/help> <... specific roles>",
      guildOnly: true,

      options: [
        {
          name: "action",
          description: "The action (enable/disable/help). Use help if you don't know how to use the command!",
          type: "string",
          choices: [{ name: "enable", value: "enable"}, { name: "disable", value: "disable"}, { name: "help", value: "help"}]
        },
        {
          name: "command",
          description: "The command that will be enabled or disabled.",
          type: "string",
        },
        {
          name: "role1",
          description: "Enable: These roles can access the command. | Disable: These roles cannot access the command.",
          type: "role",
        },
        {
          name: "role2",
          description: "Enable: These roles can access the command. | Disable: These roles cannot access the command.",
          type: "role",
        },
        {
          name: "role3",
          description: "Enable: These roles can access the command. | Disable: These roles cannot access the command.",
          type: "role",
        },
        {
          name: "role4",
          description: "Enable: These roles can access the command. | Disable: These roles cannot access the command.",
          type: "role",
        },
        {
          name: "role5",
          description: "Enable: These roles can access the command. | Disable: These roles cannot access the command.",
          type: "role",
        }
      ],
    });
  }

  summarizeChanges(cmd, cmdConfig, rolesCache) {
    let entry;
    if (cmdConfig.use === "all") {
      entry = `${emojis.online} **${cmd}**: Enabled for everyone.`;
    } else if (cmdConfig.use === "some") {
      const requiredRoleNames = Object.keys(cmdConfig.roles).map((r) => rolesCache.get(r).name).join(", ");
      entry = `${emojis.idle} **${cmd}**: Enabled for these roles: ${requiredRoleNames}`;
    } else if (cmdConfig.use === "someNot") {
      const requiredRoleNames = Object.keys(cmdConfig.roles).map((r) => rolesCache.get(r).name).join(", ");
      entry = `${emojis.dnd} **${cmd}**: Disabled for these roles: ${requiredRoleNames}`;
    } else if (cmdConfig.use === "none") {
      entry = `${emojis.offline} **${cmd}**: Disabled for everyone.`;
    } else {
      entry = `**${cmd}**: Invalid data entry.`;
    }
    return entry;
  }

  async run(ctx, options) {
    const MANAGE_GUILD = BigInt(1 << 5);
    if(!ctx.member.permissions.has(MANAGE_GUILD))
      return ctx.reply(`Baka! You need the \`Manage Server\` permissions to change this. ${emojis.failure}`);
    const guildSettings = this.client.settings.guilds.get(ctx.guild.id);
    let option = options.getString("action");
    let command = options.getString("command");
    let roles = [1,2,3,4,5].map((i) => options.getRole(`role${i}`)?.id);
    roles = roles.filter((x) => x); // Filter out any that are unused.


    if (option) option = option.toLowerCase();
    else {
      if (!guildSettings.commandConfig) return ctx.reply("There are no custom configurations for commands in this server.");
      else {
        const embed = this.client.embed(ctx.author)
          .setTitle(`Custom Command Configuration`)
        let desc = "";
        Object.entries(guildSettings.commandConfig).forEach(([cmd, cmdConfig]) => {
          desc += `${this.summarizeChanges(cmd, cmdConfig, ctx.guild.roles.cache)}\n\n`;
        });
          embed
            .setDescription(desc)
            .setFooter({ text: ctx.guild.name, iconURL: ctx.guild.iconURL({ size: 128, extension: 'png' }) });

        return ctx.reply({ embeds: [embed] });
      }
    }
    const originalConfig = guildSettings.commandConfig || {};


    if (option === "help") {
      const embed = this.client.embed(ctx.author)
        .setTitle(`Command Customization Help ${emojis.info}`)
        .setDescription(stripIndents`You can customize access to commands, whether it's for certain roles or disabling them entirely.
        
${emojis.blueRightArrow} \`uwu command enable <command>\`: Enables a command for the entire server. This is the case by default.
${emojis.blueRightArrow} \`uwu command enable <command> <role1> <role2> <role3> ...\`: Sets a command to be usable **only** for users that have **one or more** of the specified roles. Up to 5 roles can be specified.
${emojis.blueRightArrow} \`uwu command disable <command>\`: Disables a command for the entire server. Useful if you don't like a command and don't want anyone to use it.
${emojis.blueRightArrow} \`uwu command disable <command> <role1> <role2> <role3> ...\`: Sets a command to **not be usable** if the user has **one or more** of the specified roles. Up to 5 roles can be specified.

To specify roles with spaces in them, it might be easier to use the slash command (/) version instead of typing the prefix \`uwu\`.

Side Note: You can set more than 5 roles by running the command multiple times. If you do \`enable <command> role1 role2\` and then \`enable <command> role3 role 4\` later on, the allowed list will be both of them combined.
However, if you go from \`enable\` to \`disable\`, it will overwrite the list.

If you're still confused, join the [support server](https://discord.gg/WzgYaGTbEG) and we'll help you work it out!
`)
      return ctx.reply({ embeds: [embed] })
    } else if (option === "enable" || option === "disable") {
      // Make sure they specified a command.
      if (!command) return ctx.reply("You need to specify the command to be changed!");
      else if (command.toLowerCase() === "command" || command.devOnly) return ctx.reply("You cannot modify access to this command.");
      else if (!this.client.commands.has(command)) return ctx.reply("This is not a valid command of uwu bot.");
      // GET CONFIG INFORMATION
      const originalCommandConfig = originalConfig[command] || { use: "all", roles: {} };
      let newCommandConfig = { ...originalCommandConfig };
      // Case 1: Didn't mention any roles. Command is enabled/disabled for whole server
      if (!roles.length) {
        newCommandConfig = { use: option === "enable" ? "all" : "none", roles: {} }
      }
      // Case 2: They did, enable commands for those roles.
      else {
        newCommandConfig.use = option === "enable" ? "some" : "someNot";
        const roleIds = Object.fromEntries(roles.map(key => [key, true]));
        // Stack with previous allowed list ONLY if configuration was the same, else overwrite it.
        if (originalCommandConfig.use === newCommandConfig.use) newCommandConfig.roles = {...originalCommandConfig.roles, ...roleIds};
        else newCommandConfig.roles = { ...roleIds };
      }
      this.client.guildUpdate(ctx.guild.id, { commandConfig: {...originalConfig, [command]: newCommandConfig } });
      const embed = this.client.embed(ctx.author)
        .setTitle(`Successfully updated access to a command. ${emojis.checkmark}`)
        .setDescription(`**Changes:**\n${this.summarizeChanges(command, originalCommandConfig, ctx.guild.roles.cache)}\n${emojis.downArrow}\n${this.summarizeChanges(command, newCommandConfig, ctx.guild.roles.cache)}`)
        .setFooter({ text: ctx.guild.name, iconURL: ctx.guild.iconURL({ size: 128, extension: 'png' }) });
      return ctx.reply({ embeds: [embed] });
    } else {
      return ctx.reply("Invalid usage of command. Use `uwu command help` for details.")
    }

  }
}

module.exports = ManageCommands;
