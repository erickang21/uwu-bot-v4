const CommandContext = require('./CommandContext.js');
const { PermissionFlagsBits } = require('discord.js');
const { distance } = require('fastest-levenshtein');
const { missingPermissions, getDuration, escapeRegex } = require('../utils/utils.js');
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

  async isMemberInGuild(guildId, memberId) {
    const findMember = async (client, context) => {
      const guild = client.guilds.cache.get(context.guildId);
      if (guild) {
        const memberMatch = await guild.members.fetch(context.memberId);
        return !!memberMatch;
      }
    }
    const results = await this.client.shard.broadcastEval(findMember, { context: { guildId, memberId } });
    return results.includes(true);
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
    //if (!this.client.userMessageCount[message.author.id]) this.client.userMessageCount[message.author.id] = 1;
    //else this.client.userMessageCount[message.author.id] += 1;

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
      if (!data.guilds.includes(message.guild.id)) {
        // check to make sure they're actually in the server
        const inGuild = await this.isMemberInGuild(message.guild.id, message.author.id);
        if (inGuild) {
          data.guilds.push(message.guild.id);
          //console.log(`ghot user ${message.author.username} (id: ${message.author.id}) in ${message.guild.name} (id: ${message.guild.id})`)
        }
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

    // Don't run a command if we don't have the most basic permissions.
    if (!message.channel.permissionsFor(this.client.user).has([
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.EmbedLinks
    ])) return;

    const prefixLength = match[0].length;
    const rawContent = message.content.slice(prefixLength).trim();

    // A mention only.
    if (!rawContent) {
      return message.channel.send(`${emojis.wave} Hey there, senpai~ Did you forget how to use me? Run \`\`${prefix}help\`\` to see all my commands, or browse the slash commands by typing \`\`/\`\``);
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
    const serverSpecificPermission = await this.checkServerSpecific(ctx, command);
    if (!serverSpecificPermission.allowed && serverSpecificPermission.errorMessage) {
      return message.channel.send(serverSpecificPermission.errorMessage);
    }

    await this.handleXP(ctx);
    await this.trackCmdStats(ctx, command);
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
    //TODO: check server specific perms as well
    //await this.handleXP(ctx);
    //await this.trackCmdStats(ctx, command);
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
        content: `I need the following permission(s) to run that command: **${missing.join(', ')}**`
      });

      return false;
    }

    if (ctx.dev) return true;
    if (ctx.slash) return true;

    const userPermissions = ctx.channel.permissionsFor(ctx.author);
    const user = missingPermissions(userPermissions, command.userPermissions);

    if (user.length) {
      await ctx.reply({
        content: `You need the following permission(s) to run that command: **${user.join(', ')}**`
      });

      return false;
    }

    return true;
  }

  async checkServerSpecific(ctx, command) {
    if (!ctx.guild) return { allowed: true };
    const guildSettings = await this.client.syncGuildSettingsCache(ctx.guild.id);
    if (!guildSettings.commandConfig) {
      return { allowed: true };
    }
    else if (!guildSettings.commandConfig[command.name]) {
      return { allowed: true };
    }
    else {
      const commandConfig = guildSettings.commandConfig[command.name];
      if (commandConfig.use === "all") return { allowed: true };
      else if (commandConfig.use === "some") {
        // "some" = allowed roles only. Check that it's list of allowed roles.
        if (Array(...ctx.member.roles.cache.keys()).some(id => commandConfig.roles[id])) {
          return { allowed: true };
        } else {
          const requiredRoleNames = Object.keys(commandConfig.roles).map((r) => ctx.guild.roles.cache.get(r).name).join(", ");
          return { allowed: false, errorMessage: `You cannot run this command in this server. You need one of these roles:\n**${requiredRoleNames}**` };
        }
      } else if (commandConfig.use === "someNot") {
        if (!Array(...ctx.member.roles.cache.keys()).some(id => commandConfig.roles[id])) {
          return { allowed: true };
        } else {
          const bannedRoleNames = Object.keys(commandConfig.roles).map((r) => ctx.guild.roles.cache.get(r).name).join(", ");
          return { allowed: false, errorMessage: `You cannot run this command in this server, since you have one or more of these roles:\n**${bannedRoleNames}**` };
        }
      } else if (commandConfig.use === "none") {
        console.log("No command specific None")
        return { allowed: false, errorMessage: "This server has disabled this command." };
      }
    }
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
        // check to make sure they're actually in the server
        const inGuild = await this.isMemberInGuild(ctx.guild.id, ctx.author.id);
        if (inGuild) {
          data.guilds.push(ctx.guild.id);
          console.log(`got user ${ctx.author.username} (id: ${ctx.author.id}) in ${ctx.guild.name} (id: ${ctx.guild.id})`)
        }
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

  async trackCmdStats(ctx, command) {
    if (ctx.author.id === "304737539846045696") return; // ignore commands from owner; often needs to spam commands for testing.
    // update stats for last login
    if (!this.client.commandStats[command.name]) this.client.commandStats[command.name] = 1;
    else this.client.commandStats[command.name] += 1;
    this.client.totalCommandUses += 1;
    
    // update lifetime stats
    if (!this.client.lifetimeCommandStats[command.name]) this.client.lifetimeCommandStats[command.name] = 1;
    else this.client.lifetimeCommandStats[command.name] += 1;
    const totalUses = await this.client.shard.broadcastEval((client) => client.totalCommandUses).then((x) => x.reduce((a, b) => a + b));
    if (totalUses >= 25) { // avoid excessive DB writes.
      const cmdData = await this.client.syncCommandSettings("1");
      let totalLifetimeCmdStats = {};
      const lifetimeStatsList = await this.client.shard.broadcastEval((client) => client.lifetimeCommandStats).then((x) => x.reduce((a, b) => a.concat(b), []));
      for (const shard of lifetimeStatsList) {
        for (const cmd of Object.keys(shard)) {
          if (!Object.keys(totalLifetimeCmdStats).includes(cmd)) totalLifetimeCmdStats[cmd] = shard[cmd];
          else totalLifetimeCmdStats[cmd] += shard[cmd];
        }
      }
      for (const cmdName of Object.keys(totalLifetimeCmdStats)) {
        if (!cmdData[cmdName]) cmdData[cmdName] = totalLifetimeCmdStats[command.name];
        else cmdData[cmdName] += totalLifetimeCmdStats[command.name];
      }
      await this.client.shard.broadcastEval((client) => client.lifetimeCommandStats = {});
      await this.client.commandUpdate("1", cmdData);
      await this.client.shard.broadcastEval((client) => client.totalCommandUses = 0);
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
