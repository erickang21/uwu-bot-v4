const CommandContext = require('./CommandContext.js');
const { distance } = require('fastest-levenshtein');
const { plural, missingPermissions, getDuration, escapeRegex } = require('../utils/utils.js');
const RateLimiter = require('./RateLimiter.js');
const { EMOJIS } = require("../utils/constants.js");
const emojis = require("../structures/Emojis.js");

const quotes = ['"', '\'', '“”', '‘’'];
const flagRegex = new RegExp(`(?:--|—)(\\w[\\w-]+)(?:=(?:${quotes.map((qu) => `[${qu}]((?:[^${qu}\\\\]|\\\\.)*)[${qu}]`).join('|')}|([\\w<>@#&!-]+)))?`, 'g');
const delim = new RegExp('(\\s)(?:\\s)+');

class CommandHandler {
  constructor(client) {
    this.client = client;
    this.ratelimiter = new RateLimiter();
  }

  getFlags(content) {
    const flags = {};
    content = content.replace(flagRegex, (match, fl, ...quote) => {
      flags[fl] = (quote.slice(0, -2).find((el) => el) || fl).replace(/\\/g, '');
      return '';
    }).replace(delim, '$1');

    return { content, flags };
  }

  async handleMessage(message) {
    if (!message.content || message.author.bot) return;
    if (message.channel.partial) await message.channel.fetch();

    const { user } = this.client;
    const settings = this.client.getGuildSettings(message.guild?.id);
    const prefix = settings.prefix || "uwu ";
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
      if (Date.now() > data.dailyCooldown) { // if it's been 24 hours, reset the multiplier
        data.multiplier = 1; 
      }
      let breakpoint = 100 * Math.floor(data.level / 5) + 25 * data.level;
      if (message.guild.id === "372526440324923393") {
        data.exp += 25 * data.multiplier * 3;
      } else {
        data.exp += 25 * data.multiplier;
      }
      if (!data.guilds) data.guilds = [];
      if (!data.guilds.includes(ctx.guild.id)) {
        data.guilds.push(ctx.guild.id);
        console.log(`ghot user ${ctx.author.username} (id: ${ctx.author.id}) in ${ctx.guild.name} (id: ${ctx.guild.id})`)
      }
      while (data.exp >= breakpoint) {
        data.level += 1;
        data.exp -= breakpoint;
        breakpoint = 100 * Math.floor(data.level / 5) + 25 * data.level;
        if (data.notify) {
          let desc = `${emojis.level} **Level:** ${data.level - 1} ${emojis.shiningarrow} ${data.level}\n${emojis.xp} **XP until next level:** ${data.exp}/${breakpoint}`;
          if (data.level % 5 === 0) desc += `\n\n**You also got:**\n:unlock: New profile icon slot!`
          const embed = this.client.embed(message.author)
            .setTitle(`You leveled up! ${emojis.thumbsup}`)
            .setDescription(desc);
          message.author.send({ embeds: [embed]});
        }
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

    const ctx = new CommandContext(command, {
      message, flags, content,
      prefixLength, alias, args
    });

    if (!command) return this.closestCommand(ctx, alias);
    if (!command.modes.includes('text')) return;
    if (!(await this.runChecks(ctx, command))) return;

    await this.handleXP(ctx);
    return command.execute(ctx);
  }

  async handleInteraction(interaction) {
    if (!interaction.isChatInputCommand()) return;
    const command = this.client.commands.get(interaction.commandName);

    if (!command) {
      this.client.log.warn(`Command '${interaction.commandName}' not implemented.`);
      return interaction.reply({
        content: 'This command has not been implemented, this is a bug.',
        ephemeral: true
      });
    }

    const ctx = new CommandContext(command, { interaction });
    if (!(await this.runChecks(ctx, command))) return;
    await this.handleXP(ctx);
    return command.execute(ctx);
  }

  async runChecks(ctx, command) {
    if (command.devOnly && !ctx.dev) {
      await ctx.reply({
        content: `This command can only be used by the developers. ${EMOJIS.GIRL_CHILLING}`,
      });

      return false;
    }

    if (command.guildOnly && !ctx.guild) {
      await ctx.reply({
        content: 'Ba-baka! What do you think you\'re doing in my DMs? That command can only be used in a server!'
      });

      return false;
    }

    if (command.nsfw && !ctx.channel.nsfw) {
      await ctx.reply({
        content: `This command can only be run in NSFW channels. ${EMOJIS.BONK}`,
      });

      return false;
    }

    if (!(await this.checkPermissions(ctx, command))) return false;
    if (!(await this.checkCooldown(ctx, command))) return false;

    return true;
  }

  async checkPermissions(ctx, command) {
    if (!ctx.guild) return true;
    const permissions = ctx.channel.permissionsFor(this.client.user);
    const missing = missingPermissions(permissions, command.botPermissions);

    if (missing.length) {
      await ctx.reply({
        content: `I need the following permission${plural(missing)} to run that command: **${missing.join(', ')}**`
      });

      return false;
    }

    if (ctx.dev) return true;
    if (ctx.slash) return true;

    const userPermissions = ctx.channel.permissionsFor(ctx.author);
    const user = missingPermissions(userPermissions, command.userPermissions);

    if (user.length) {
      await ctx.reply({
        content: `You need the following permission${plural(user)} to run that command: **${user.join(', ')}**`
      });

      return false;
    }

    return true;
  }

  async handleXP(ctx) {
    // When command is successfully executable, add XP: 5/command
    if (!this.client.userCommandCount[ctx.author.id]) this.client.userCommandCount[ctx.author.id] = 1;
    else this.client.userCommandCount[ctx.author.id] += 1;
    // Remain in cache and only request DB upon every 5 commands.
    // Level up by 5 xp/command
    if (this.client.userCommandCount[ctx.author.id] >= 5) {
      const data = await this.client.syncUserSettings(ctx.author.id);
      if (!data.guilds) data.guilds = [];
      if (!data.guilds.includes(ctx.guild.id)) {
        data.guilds.push(ctx.guild.id);
        console.log(`got user ${ctx.author.username} (id: ${ctx.author.id}) in ${ctx.guild.name} (id: ${ctx.guild.id})`)
      }
      if (Date.now() > data.dailyCooldown) { // if it's been 24 hours, reset the multiplier
        data.multiplier = 1; 
      }
      let breakpoint = 100 * Math.floor(data.level / 5) + 25 * data.level;
      if (ctx.guild.id === "372526440324923393") {
        data.exp += 25 * data.multiplier * 3;
      } else {
        data.exp += 25 * data.multiplier;
      }

      while (data.exp >= breakpoint) {
        data.level += 1;
        data.exp -= breakpoint;
        breakpoint = 100 * Math.floor(data.level / 5) + 25 * data.level;
        if (data.notify) {
          let desc = `${emojis.level} **Level:** ${data.level - 1} ${emojis.shiningarrow} ${data.level}\n${emojis.xp} **XP until next level:** ${data.exp}/${breakpoint}`;
          if (data.level % 5 === 0) desc += `\n\n**You also got:**\n:unlock: New profile icon slot!`;
          const embed = this.client.embed(ctx.author)
            .setTitle(`You leveled up! ${emojis.thumbsup}`)
            .setDescription(desc);
          ctx.author.send({ embeds: [embed]});
        }
      }

      this.client.userCommandCount[ctx.author.id] = 0;
      await this.client.userUpdate(ctx.author.id, data);
    }
  }

  async checkCooldown(ctx, command) {
    const { pass, remaining } = this.ratelimiter.check(ctx, command);
    if (pass) return true;

    const duration = getDuration(remaining);
    const content = `You baka! This command is still on cooldown. You better wait another **${duration}** before asking again! ${emojis.ban}`;

    await ctx.reply({ content, ephemeral: true });
    return false;
  }

  closestCommand(ctx, cmd) {
    const commands = this.client.commands.usableCommands(ctx.message);
    const aliases = commands.map(command => command.aliases).flat();
    const arr = [...commands.map(command => command.name), ...aliases];

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
    return ctx.reply(`|\`❔\`| Did you mean \`${match}\`?`);
  }
}

module.exports = CommandHandler;
