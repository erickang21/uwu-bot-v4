const Event = require("../structures/Event.js");
const CommandContext = require("../structures/CommandContext.js");
const { distance } = require("fastest-levenshtein");
const { escapeRegex, missingPermissions, plural } = require("../utils/utils.js");
const { EMOJIS } = require("../utils/constants.js");

// eslint-disable-next-line quotes
const quotes = ['"', "'", "“”", "‘’"];
const flagRegex = new RegExp(`(?:--|—)(\\w[\\w-]+)(?:=(?:${quotes.map((qu) => `[${qu}]((?:[^${qu}\\\\]|\\\\.)*)[${qu}]`).join("|")}|([\\w<>@#&!-]+)))?`, "g");
const delim = new RegExp("(\\s)(?:\\s)+");

class MessageCreate extends Event {
  getFlags(content) {
    const flags = {};
    content = content.replace(flagRegex, (match, fl, ...quote) => {
      flags[fl] = (quote.slice(0, -2).find((el) => el) || fl).replace(/\\/g, "");
      return "";
    }).replace(delim, "$1");

    return { content, flags };
  }

  async run(message) {
    if (!message.content || message.author.bot) return;
    if (message.channel.partial) await message.channel.fetch();

    const { user } = this.client;
    const settings = this.client.settings.guilds.get(message.guild?.id);

    const prefix = settings.prefix;
    const regex = new RegExp(`^<@!?${user.id}>|^${escapeRegex(prefix)}${!message.guild ? "|" : ""}`);
    const match = message.content.match(regex);
    
    // Update message count
    if (!this.client.userMessageCount[message.author.id]) this.client.userMessageCount[message.author.id] = 1;
    else this.client.userMessageCount[message.author.id] += 1;

    /*
    Leveling System: 100*(x / 5) + 25 * x (increment xp on each level and make it spike at each 5 levels)
    Lv 1: 25
    Lv 2: 50
    Lv 3: 75
    Lv 4: 100
    Lv 5: 225
    Lv 10: 450
    Lv 15: 675
    */
    
    // Remain in cache and only request DB upon every 25 messages.
    // Level up by 1 xp/message
    if (this.client.userMessageCount[message.author.id] >= 25) {
      const data = await this.client.syncUserSettings(message.author.id);
      let breakpoint = 100 * Math.floor(data.level / 5) + 25 * data.level;
      data.exp += 25 * data.multiplier;
      while (data.exp >= breakpoint) {
        data.level += 1;
        data.exp -= breakpoint;
        breakpoint = 100 * Math.floor(data.level / 5) + 25 * data.level;
      }
      this.client.userMessageCount[message.author.id] = 0;
      await this.client.userUpdate(message.author.id, data);
    }
    

    if (!match) return;

    const prefixLength = match[0].length;
    const rawContent = message.content.slice(prefixLength).trim();

    // A mention only.
    if (!rawContent) {
      return message.channel.send(`${EMOJIS.WAVE} Hi there! Run \`\`@uwu bot help\`\` to see all I can do or browse the slash commands by typing \`\`/\`\``);
    }

    const { content, flags } = this.getFlags(rawContent);

    const args = content.split(/ +/g);
    const alias = args.shift().toLowerCase();

    const command = this.client.commands.get(alias);
    if (!command) return this.closestCommand(message, alias);
    if (!command.modes.includes("text")) return;

    const ctx = new CommandContext(command, {
      message, flags,
      content, prefixLength,
      alias, args
    });

    if (command.devOnly && !ctx.dev) {
      return ctx.reply({
        content: `This command can only be used by the developers. ${EMOJIS.GIRL_CHILLING}`,
      });
    }

    if (command.nsfw && !ctx.channel.nsfw) {
      return ctx.reply({
        content: `This command can only be run in NSFW channels. ${EMOJIS.BONK}`,
      });
    }

    if (!(await this.checkPermissions(ctx, command))) return;

    // When command is successfully executable, add XP: 5/command
    if (!this.client.userCommandCount[message.author.id]) this.client.userCommandCount[message.author.id] = 1;
    else this.client.userCommandCount[message.author.id] += 1;
    // Remain in cache and only request DB upon every 5 commands.
    // Level up by 5 xp/command
    if (this.client.userCommandCount[message.author.id] >= 5) {
      const data = await this.client.syncUserSettings(message.author.id);
      let breakpoint = 100 * Math.floor(data.level / 5) + 25 * data.level;
      data.exp += 25 * data.multiplier;
      while (data.exp >= breakpoint) {
        data.level += 1;
        data.exp -= breakpoint;
        breakpoint = 100 * Math.floor(data.level / 5) + 25 * data.level;
      }
      this.client.userCommandCount[message.author.id] = 0;
      await this.client.userUpdate(message.author.id, data);
    }
    return command.execute(ctx);
  }

  async checkPermissions(ctx, command) {
    // No Permissions for DMs
    if (!ctx.guild) return true;

    const permissions = ctx.channel.permissionsFor(this.client.user);
    const missing = missingPermissions(permissions, command.botPermissions);

    if (missing.length) {
      await ctx.reply({
        content: `I need the following permission${plural(missing)} to run that command: **${missing.join(", ")}**`
      });

      return false;
    }

    // Ddvelopers bypasse permission restrictions.
    if (ctx.dev) return true;

    const userPermissions = ctx.channel.permissionsFor(ctx.author);
    const user = missingPermissions(userPermissions, command.userPermissions);

    if (user.length) {
      await ctx.reply({
        content: `You need the following permission(s) to run that command: **${user.join(", ")}**`
      });

      return false;
    }

    return true;
  }

  closestCommand(msg, cmd) {
    const commands = this.client.commands.usableCommands(msg);
    const aliases = commands.map((command) => command.aliases).flat();
    const arr = [...commands.map((command) => command.name), ...aliases];

    let minDistance = Infinity;
    let minIndex = 0;

    for (let i = 0; i < arr.length; i++) {
      const dist = distance(cmd, arr[i]);
      if (dist < minDistance) {
        minDistance = dist;
        minIndex = i;
      }
    }

    if (minDistance > 2) return;

    const match = arr[minIndex];
    return msg.channel.send(`${EMOJIS.QUESTION_MARK} Did you mean \`${match}\`?`);
  }
}

module.exports = MessageCreate;
