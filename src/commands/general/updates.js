const Command = require("../../structures/Command.js");

class Updates extends Command {
  constructor(...args) {
    super(...args, {
      description: "shows the latest patch notes for uwu bot. find the TWICE references :)",
      aliases: ["updateinfo", "update", "versioninfo"]
    });
  }

  /*
  Mini version update: v5.1
  __**NSFW Command Improvements!**__
  We definitely heard the suggestions. [MORE & MORE](https://www.youtube.com/watch?v=mH0_XpSHkZo) 18+ commands!
  - NEW COMMANDS: furry, tentacles, bdsm, yaoi
  - Fixed an issue where blowjob would sometimes not work
  
  __**Time for some FUN!**__
  The fun category is coming back soon. To kick it off, I've added a crowd favorite!
  - NEW COMMAND: mimic, where you can pretend to be someone else and send something as them.

  __**Improving descriptions.**__
  We get it. Discord bots can be overwhelming. That's why I made careful changes to all the command and argument descriptions to make them consistent across the board.
  
  - Descriptions of anime commands are made to be more fun and silly.
  - Descriptions of customization, general, level, and mod commands will clearly describe what it's doing.
  - Descriptions of NSFW commands will define lesser known terms for people.
  - Usage strings have fixed syntax now: <argument> represents a REQUIRED argument, [argument] represents an OPTIONAL argument. 

  __**Command Statistics Buffs**__
  I could go into a lot of boring dev talk, but TLDR: we're trying to understand you better! 
  - We're significantly improving command usage statistics. This means that we'll know what to focus on when providing future version updates!
  - We're also trying to understand which categories are used most frequently.
  */

  async run(ctx) {
    const embed = this.client
      .embed(this.client.user)
      .setTitle(`uwu bot v5.0 IS HERE! REJOICE!`)
      .setDescription(
        `This is the biggest update ever released in uwu bot's history. This list of changes is CRAZY LONG. Grab a cup of tea and enjoy a nice long read!

__**THE BIGGEST CHANGE: A NEW XP SYSTEM!**__
This is a GLOBAL XP system (shared across all servers)!

- **Gain 1 XP/message** sent in a server with uwu bot in it.
- **Gain 5 XP/command** used with uwu bot.
- Using messages or commands in the [official server for uwu bot](https://discord.gg/vCMEmNJ) has a 3x XP multiplier. This can stack on top of your daily multiplier!
- **Unlock a new profile icon slot** for every 5 levels.
- **NEW COMMAND: daily**, to instantly get 200 XP and DOUBLE the XP you get from messages and commands for the next 24 hours.
- **NEW COMMAND: levelhelp**, if you’re confused about the levelling system.
- **NEW COMMAND: levelnotify**, to turn on notifications when levelling up (\`uwu levelnotify on/off\`)
- **NEW COMMAND: profile**, to check your (or someone else’s) profile icons, current level and EXP needed for the next level
- **NEW COMMAND: profileicon**, to manage your lineup of profile icons (use \`uwu profileicon help\` for more info)
- There will be more ways to gain instant XP added in the near future. However, it was meant to be a passive accumulation, not a hardcore grind.

__**MASSIVE IMPROVEMENTS to 18+ commands!**__
A very big increase in image quality and variation across the board as we are using a new API!
- **CHANGED COMMAND: hentai**, which can now accept tags! If you want to narrow down your hentai search, run \`uwu hentai [tags]\` where tags is a comma-separated list of tags of the genres/specifics you want. If you leave it blank, it’ll work the same as you remembered!
- **NEW COMMAND: genshin**, search for spicy pictures of your favourite Genshin characters. (NOTE: Not all characters will be available for searching.)
- **NEW COMMANDS:** trap, catgirl, futanari, kemonomimi…someone tell me WHAT THIS MEANS?!?!
- **CHANGED COMMAND: waifu is now a NSFW command** - the waifu pic you get will be…umm, spicier?
- **REMOVED COMMAND: lesbian.** No longer needed since yuri does the same thing. Hey, I'm not THAT clueless.

__**Anime Command Improvements!**__
It ain't much, but it's honest work.

- **NEW COMMAND:** blush, a command that gets a blushing anime girl GIF. You can also tag someone if they make you…[feel special?!](https://www.youtube.com/watch?v=3ymwOvzhwHs)
- **NEW COMMAND:** cringe, a command that gets a cringing anime girl GIF. Tag someone if they made you cringe. @ ravener
- **FIXED COMMAND:** poke
- **REMOVED COMMAND:** baka

__**Moderation and Customization Upgrades:**__
It'll help you do what you want with me. UMM...that's not...what I meant...

- **CUSTOM PREFIX support is back!** Run \`uwu prefix [prefix]\` to change the prefix to whatever tickles your fancy. Run \`[prefix]prefix reset\` to change it back. If you forgot it, simply send a message @uwu bot and it will remind you. Requires Manage Server permission!
- **NEW COMMAND: purge**, a moderation command that deletes a certain amount of messages in a channel. Requires Manage Messages permission!
- **Fixed a bug** where all customization commands would cause an unexpected error.

__**General Improvements:**__
Not AS interesting, but still worthwhile to mention.

- A shiny new profile picture, as with every big update.
- Fixed emojis across the board, and implemented a more standardized system to be used in the future.
- Bot now sends a warm welcome to the server when joining! It automatically will try to search for a channel called “general”/“global”, but if it doesn’t exist, it’ll send it in the first available channel.
- Restored functionality to slash commands (they were temporarily disabled due to a bug)
- General improvements to reliability (we promise the bot to have almost perfect uptime!)

**__JUST ADDED (Aug 4, 2023): BUG HOTFIXES!__**
- Fixed issues that caused certain NSFW commands to stop working.
- Fixed an issue that caused the \`fuck\` command to not work.
- Added yaoi command.
- Shortened command descriptions.
        `
      );
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Updates;
