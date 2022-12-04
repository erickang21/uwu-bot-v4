const { DEVS } = require("../utils/constants.js");

class CommandContext {
  constructor(
    command,
    { message, interaction, prefixLength, flags, alias, content, args }
  ) {
    this.command = command;
    this.message = message;
    this.interaction = interaction;
    this.lastReply = null;

    if (message) {
      this.content = content;
      this.prefixLength = prefixLength;
      this.flags = flags;
      this.alias = alias;
      this.args = args.join(" ").split(command.delim);
    }
  }

  get rawArgs() {
    return this.content.slice(this.alias.length).trim();
  }

  get client() {
    return this.interaction?.client ?? this.message.client;
  }

  get mode() {
    return this.interaction ? "slash" : "text";
  }

  get slash() {
    return !!this.interaction;
  }

  get text() {
    return !!this.message;
  }

  get guild() {
    return this.interaction?.guild ?? this.message.guild;
  }

  get author() {
    return this.interaction?.user ?? this.message.author;
  }

  get member() {
    return this.interaction?.member ?? this.message.member;
  }

  get channel() {
    return this.interaction?.channel ?? this.message.channel;
  }

  get settings() {
    if (this.guild) {
      return this.client.settings.guilds.get(this.guild.id);
    }

    return this.client.settings.guilds.defaults;
  }

  updateSettings(options) {
    if (!this.guild) return;
    return this.client.settings.guilds.update(this.guild.id, options);
  }

  get createdTimestamp() {
    return this[this.slash ? "interaction" : "message"].createdTimestamp;
  }

  get dev() {
    return DEVS.includes(this.author.id);
  }

  async reply(options) {
    if (this.slash) return this.interaction.editReply(options);
    if (this.message.lastReply) return this.message.lastReply.edit(options);
    this.message.lastReply = await this.message.reply(options);
    return this.message.lastReply;
  }

  async editReply(options) {
    if (this.slash) return this.interaction.editReply(options);
    if (this.message.lastReply) return this.message.lastReply.edit(options);
    return this.reply(options);
  }

  deferReply({ ephemeral }) {
    if (this.slash) return this.interaction.deferReply({ ephemeral });

    const { username } = this.client.user;
    return this.reply({
      content: `**${username}** is thinking...`,
    });
  }
}

module.exports = CommandContext;
