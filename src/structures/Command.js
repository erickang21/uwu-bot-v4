const { PermissionsBitField, SlashCommandBuilder } = require("discord.js");
const { toProperCase } = require("../utils/utils.js");
const { basename } = require("node:path");
const Base = require("./Base.js");
const CommandOptions = require("./CommandOptions.js");
const emojis = require("../structures/Emojis");

class Command extends Base {
  constructor(client, store, file, options = {}) {
    super(client, store, file, options);

    this.description = options.description ?? "No Description Provided.";
    this.extendedHelp = options.extendedHelp ?? "No extended help provided.";
    this.modes = options.modes ?? ["slash", "text"];
    this.devOnly = options.devOnly ?? false;
    this.aliases = options.aliases ?? [];
    this.cooldown = options.cooldown ?? 0;
    this.bucket = options.bucket ?? 'user';
    this.nsfw = options.nsfw ?? false;
    this.category =
      options.category ?? toProperCase(basename(file.dir)) ?? "General";
    this.guildOnly = options.guildOnly ?? false;
    this.hidden = options.hidden ?? false;
    this.usage = options.usage ?? this.name;
    this.loading = options.loading;
    this.options = options.options ?? [];
    this.delim = options.delim ?? " ";
    this.ephemeral = options.ephemeral ?? false;
    this.subcommands = options.subcommands ?? [];

    this.botPermissions = new PermissionsBitField(
      options.botPermissions ?? []
    ).freeze();
    this.userPermissions = new PermissionsBitField(
      options.userPermissions ?? []
    ).freeze();
  }

  async execute(ctx) {
    try {
      this.client.log.debug(`Running command '${this.name}'`);

      const options = ctx.slash
        ? ctx.interaction.options
        : await this._parseArgs(ctx);
      ctx.options = options;

      const check = await this.check(ctx, options);
      if (!check) return;

      if (typeof check === "string") {
        return ctx.reply({ content: check });
      }

      const results = await this.run(ctx, options);
      this.client.commands.ran++;

      if (typeof results === "string") {
        return ctx.reply({ content: results });
      }
    } catch (err) {
      this.client.emit("commandError", ctx, err);
    }
  }

  getSlashCommandData() {
    if (!this.modes.includes("slash")) return null;

    const builder = new SlashCommandBuilder()
      .setName(this.name)
      .setDescription(this.description)
      .setDMPermission(!this.guildOnly);

    if (this.userPermissions.bitfield > 0) {
      builder.setDefaultMemberPermissions(this.userPermissions.bitfield);
    }

    if (typeof this.options === "function") {
      this.options(builder);
    } else {
      for (const data of this.options) {
        builder[`add${toProperCase(data.type)}Option`]((option) => {
          option.setName(data.name);
          if (data.description) option.setDescription(data.description);
          if (data.required) option.setRequired(true);
          if (data.choices) option.addChoices(...data.choices);
          return option;
        });
      }
    }

    // if there are subcommands, add them
    for (const sub of this.subcommands) {
      builder.addSubcommand(subcommand => {
        subcommand
          .setName(sub.name)
          .setDescription(sub.description);
        for (const subData of sub.options) {
          builder[`add${toProperCase(subData.type)}Option`]((option) => {
            option.setName(subData.name);
            if (subData.description) option.setDescription(subData.description);
            if (subData.required) option.setRequired(true);
            if (subData.choices) option.addChoices(...subData.choices);
          });
        }
      })
    }

    return builder;
  }

  async _parseArg(ctx, i) {
    const message = ctx.message;
    const option = this.options[i];
    const arg = ctx.args[i];
    const last = i === this.options.length - 1;

    if (option.type === "user") {
      return this.verifyUser(message, arg, option.required);
    }

    if (option.type === "member") {
      return this.verifyMember(message, arg, option.required);
    }

    if (option.type === "channel") {
      return this.verifyChannel(message, arg, option.required);
    }

    if (option.type === "role") {
      return this.verifyRole(message, arg, option.required);
    }

    if (option.type === "string") {
      if (option.required && !arg) {
        throw `Argument **${option.name}** is required.`;
      }

      if (last) return ctx.args.slice(i).join(" ");
      return arg;
    }

    if (option.type === "integer") {
      if (!option.required && !arg) return;
      return this.verifyInt(arg);
    }
  }

  async _parseArgs(ctx) {
    const options = {};

    for (let i = 0; i < this.options.length; i++) {
      const option = this.options[i];
      options[option.name] = await this._parseArg(ctx, i);
    }

    return new CommandOptions(options);
  }

  /**
   * Verifies that a user is given.
   */
  async verifyUser(msg, user, required) {
    // if (!user && defaultToAuthor) return msg.author;
    if (!user && required) {
      throw "Please enter a valid user mention or an ID!";
    } else if (!user) {
      return;
    }

    if (user.toLowerCase() === "me") return msg.author;
    if (user.toLowerCase() === "you") return this.client.user;

    const match = /^(?:<@!?)?(\d{17,19})>?$/.exec(user);

    if (!match) {
      throw "Baka! That's not a user mention or an ID. What were you trying to do?";
    }

    user = await this.client.users.fetch(match[1]).catch(() => null);
    // We will assume they gave IDs as mentions are highly unlikely to fail.
    if (!user) {
      throw "I couldn't find that user! Make sure the ID is correct.";
    }

    return user;
  }

  /**
   * Verifies that a member is given.
   */
  async verifyMember(msg, member, required) {
    const user = await this.verifyUser(msg, member, required);
    const guildMember = await msg.guild.members.fetch(user).catch(() => null);
    if (!guildMember) throw "Baka! That user is not in this server.";
    return guildMember;
  }

  async verifyChannel(msg, channel, required = false) {
    // if (!channel && defaultToCurrent) return msg.channel;
    if (!channel && required) {
      throw `You need to mention a channel or provide an ID. ${emojis.failure}`;
    } else if (!channel) {
      return;
    }

    const match = /^(?:<#)?(\d{17,19})>?$/.exec(channel);
    if (!match) throw `Invalid channel, must be a mention or an ID. ${emojis.failure}`;

    const chan = await this.client.channels.fetch(match[1]).catch(() => null);
    if (!chan) throw `Couldn't find this channel. Ensure the channel mentioned is valid and visible to me! ${emojis.failure}`;

    return chan;
  }

  verifyRole(msg, rolename, required = false) {
    if (!rolename && !required) return null;
    if (!rolename) throw `Baka! You must provide a role name or ID. ${emojis.failure}`;
    rolename = rolename.toLowerCase();

    // We check by ID or name. Nobody mentions roles for an argument.
    const role = msg.guild.roles.cache.find(
      (role) => role.id === rolename || role.name.toLowerCase() === rolename
    );

    if (!role) throw `Couldn't find this role. Ensure the name or ID provided is valid. ${emojis.failure}`

    return role;
  }

  verifyInt(num, def) {
    if (typeof def === "number" && !num) return def;
    const parsed = parseInt(num && num.replace(/,/g, ""));
    if (isNaN(parsed)) throw "Baka! You must provide a valid number.";
    return parsed;
  }

  /**
   * Executed before the command is ran.
   * A boolean is to be returned to either allow command execution or not.
   * A string can be returned to block execution with an error message.
   * @abstract
   * @returns {Boolean|String}
   */
  async check() {
    return true;
  }

  /**
   * The actual command implementation, must be implemented in a subclass.
   * @abstract
   */
  async run(msg) {
    return msg.send(
      `${this.constructor.name} does not provide a \`run()\` implementation.${
        msg.author.id !== this.client.constants.ownerID
          ? " This is a bug, please report this in our server at https://discord.gg/mDkMbEh"
          : ""
      }`
    );
  }
}

module.exports = Command;
