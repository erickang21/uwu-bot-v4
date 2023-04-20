const Command = require("../../structures/Command.js");

class Autorole extends Command {
  constructor(...args) {
    super(...args, {
      description: "Set a role that is automatically given upon a member joining.",
      usage: "autorole [on/off] [role name]",
      guildOnly: true,
      aliases: ["ar"]
    });
  }
  
  async run(ctx, [option, ...role]) {
    if (option) option = option.toLowerCase();
    else {
      if (!ctx.guild.settings.autorole) return ctx.reply("The autorole for this server is **disabled.**");
      else {
        const role = ctx.guild.roles.cache.find((e) => e.id === ctx.guild.settings.autorole)
        return ctx.reply(`The autorole for this server is **enabled**. The **${role.name}** will be given when a member joins.`)
      }
    }
    role = role.join(" ")
    if(!ctx.member.permissions.has("MANAGE_ROLES"))
      return ctx.reply("Baka! You need the `Manage Roles` permissions to change the autorole.");
    if (option === "on") {
      role = await this.verifyRole(ctx, role)
      this.client.guildUpdate({ autorole: role.id });
      ctx.reply(`The autorole for this server has successfully been updated. ${this.client.constants.checkmark}`)
    } else if (option === "off") {
      if (!ctx.guild.settings.autorole) return ctx.reply("The autorole for this server is already off!");
      else {
        this.client.guildUpdate(ctx.guild.id, { autorole: null });
        return ctx.reply(`The autorole for this server has been disabled.`)
      }
    } else {
      return ctx.reply("Invalid usage of command. Use `uwu help autorole` for details.")
    }
  
  }
}

module.exports = Autorole;