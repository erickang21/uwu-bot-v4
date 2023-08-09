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

  This is a pretty sizable follow-up update to version 5.0, improving more on uwu bot's best features!

  __**Slash commands are back!**__
  Sorry if we gave you trust issues. Buuuut...we kinda lied about slash commands being available last time. It wasn't on purpose, though!
  - Type / and select \"uwu bot\" in any server to look at a list of commands.
  - Do note that not every command works in slash format. We'll be trying our best to work around this in the future.

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
      .setTitle(`A not-so-mini mini version update: v5.1`)
      .setDescription(`This is a pretty sizable follow-up update to version 5.0, improving more on uwu bot's best features!
      
__**Slash commands are back!**__
Sorry if we gave you trust issues. Buuuut...we kinda lied about slash commands being available last time. It wasn't on purpose, though!
- Type / and select "uwu bot" in any server to look at a list of commands.
- Do note that not every command works in slash format. We'll be trying our best to work around this in the future.
- NSFW commands **will not** be available as slash commands. You must run them using the legacy prefix method.

__**NSFW Command Improvements!**__
We definitely heard the suggestions. [MORE & MORE](https://www.youtube.com/watch?v=mH0_XpSHkZo) 18+ commands!
- NEW COMMANDS: furry, tentacles, bdsm, yaoi
- Fixed an issue where blowjob would sometimes not work

__**Time for some FUN!**__
The fun category is coming back soon. To kick it off, I've added a crowd favorite! And a few more!
- NEW COMMAND: mimic, where you can pretend to be someone else and send something as them.
- NEW COMMAND: 8ball, to ask a question about your fate.
- NEW COMMAND: rate, where you can rate anyone at anything. (eg. \`uwu rate @banana weeb\`)
- NEW COMMAND: ship, where you can find out how much two users are meant for each other.
      
__**Improving Descriptions**__
We get it. Discord bots can be overwhelming. That's why I made careful changes to all the command and argument descriptions to make them consistent across the board.
- Descriptions of anime commands are made to be more fun and silly.
- Descriptions of customization, general, level, and mod commands will clearly describe what it's doing.
- Descriptions of NSFW commands will define fandom terminology, especially less known ones.
- Usage strings have fixed syntax now: <argument> represents a REQUIRED argument, [argument] represents an OPTIONAL argument. 
      
__**Command Statistics Buffs**__
I could go into a lot of boring dev talk, but TLDR: we're trying to understand you better! 
- We're significantly improving command usage statistics. This means that we'll know what to focus on when providing future version updates!
- We're also trying to understand which categories are used most frequently.

Missed the v5.0 update notes? They're long as hell! Read it on <https://top.gg/bot/520682706896683009?tab=updates>.
`
      );
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Updates;
