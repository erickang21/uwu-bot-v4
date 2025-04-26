const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");

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

  async run(ctx, options) {
    if(!ctx.member.permissions.has("MANAGE_GUILD"))
      return ctx.reply(`Baka! You need the \`Manage Server\` permissions to change modlogs. ${emojis.failure}`);
    const guildSettings = await this.client.syncGuildSettingsCache(ctx.guild.id);
    let option = options.getString("action");
    let command = options.getString("command");
    let roles = [1,2,3,4,5].map((i) => options.getRole(`role${i}`));
    roles = roles.filter((x) => x); // Filter out any that are unused.


    if (option) option = option.toLowerCase();
    else {
      if (!guildSettings.commandConfig) return ctx.reply("There are no custom configurations for commands in this server.");
      else {
        // TODO: RESPOND WITH the status
        return ctx.reply("Here you wuold receive a summary of the status in your server.")
      }
    }
    const originalConfig = guildSettings.commandConfig || {};
    let newConfig = guildSettings.commandConfig || {};

    if (option === "help") {
      return ctx.reply("Help is coming soon.")
    } else if (option === "enable") {
      // Make sure they specified a command.
      if (!command) return ctx.reply("You need to specify the command to be changed!");
      // Case 1: Didn't mention any roles. Command is enabled for whole server.
      if (!roles.length) {
        newConfig[command] = { use: "all", roles: {} }
      }
      // Case 2: They did, enable commands for those roles.
      else {
        newConfig[command].use = "some";
        const roleIds = Object.fromEntries(roles.map(key => [key, true]));
        newConfig[command].roles = {...originalConfig[command].roles, ...roleIds};
      }
      this.client.guildUpdate(ctx.guild.id, { commandConfig: newConfig });
      ctx.reply("Updated")
    } else if (option === "disable") {
      // Make sure they specified a command.
      if (!command) return ctx.reply("You need to specify the command to be changed!");
      // Case 1: Didn't mention any roles. Command is DISABLED for whole server.
      if (!roles.length) {
        newConfig[command] = { use: "none", roles: {} }
      }
      // Case 2: They did, DISABLE commands for those roles.
      else {
        newConfig[command].use = "someNot";
        const roleIds = Object.fromEntries(roles.map(key => [key, true]));
        newConfig[command].roles = {...originalConfig[command].roles, ...roleIds};
      }
      this.client.guildUpdate(ctx.guild.id, { commandConfig: newConfig });
      ctx.reply("Updated")
    } else {
      return ctx.reply("Invalid usage of command. Use `uwu command help` for details.")
    }

  }
}

module.exports = ManageCommands;
