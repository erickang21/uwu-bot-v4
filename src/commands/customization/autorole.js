const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");

class Autorole extends Command {
  constructor(...args) {
    super(...args, {
      description: "control whether all members get a role upon joining.",
      usage: "autorole <on/off> <role name>",
      guildOnly: true,
      aliases: ["ar"],
      userPermissions: ["ManageRoles"],
      botPermissions: ["ManageRoles"],
      options: [
        {
          name: "action",
          description: "the action to take",
          type: "string",
        },
        {
          name: "role",
          description: "role to give to members upon joining",
          type: "role",
        }
      ],
      /*
      subcommands: [
        {
          name: "on",
          description: "enables the autorole",
          options: [
            {
              name: "role",
              description: "role you want to automatically give to members upon joining",
              type: "role",
              required: true
            }
          ]
        },
        {
          name: "off",
          description: "disables the autorole"
        }
      ],
      */
    });
  }
  
  async run(ctx, options) {
    const guildSettings = await this.client.syncGuildSettingsCache(ctx.guild.id);
    let option = options.getString("action");
    
    if (option) option = option.toLowerCase();
    else {
      if (!guildSettings.autorole) return ctx.reply("The autorole for this server is **disabled.**");
      else {
        const role = ctx.guild.roles.cache.find((e) => e.id === guildSettings.autorole);
        return ctx.reply(`The autorole for this server is **enabled**. The role **${role.name}** will be assigned to new users.`);
      }
    }

    if (option === "on") {
      const role = options.getRole("role");
      if (!role) {
        return ctx.reply(`A valid role is required! ${emojis.failure}`);
      }
      this.client.guildUpdate(ctx.guild.id, { autorole: role.id });
      ctx.reply(`The autorole for this server has successfully been updated. ${emojis.success}`)
    } else if (option === "off") {
      if (!guildSettings.autorole) return ctx.reply("The autorole for this server is already off!");
      this.client.guildUpdate(ctx.guild.id, { autorole: null });
      return ctx.reply(`The autorole for this server has been disabled. ${emojis.success}`)
    } 
  }
}

module.exports = Autorole;