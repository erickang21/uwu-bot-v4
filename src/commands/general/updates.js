const Command = require("../../structures/Command.js");

class Updates extends Command {
  constructor(...args) {
    super(...args, {
      description: "shows the latest patch notes for uwu bot. find the TWICE references :)",
      aliases: ["updateinfo", "update", "versioninfo"]
    });
  }

  /*
Another version update: v5.2

We're adding a new category!

__**Image Manipulation!**__
Slap your face (well...profile picture) onto some meme templates!

  __**Command Statistics Buffs**__
  I could go into a lot of boring dev talk, but TLDR: we're trying to understand you better! 
  - We're significantly improving command usage statistics. This means that we'll know what to focus on when providing future version updates!
  - We're also trying to understand which categories are used most frequently.
  */

  async run(ctx) {
    const embed = this.client
      .embed(this.client.user)
      .setTitle(`A not-so-mini mini version update: v5.2`)
      .setDescription(`This is a pretty sizable follow-up update to version 5.0, improving more on uwu bot's best features!
      
__**Image manipulation has entered the chat!**__
Slap your face (well...profile picture) onto some meme templates! There's 2 types of commands:

Text-based commands (type text to display on a template)
- NEW COMMANDS: achievement, fatherless, trumptweet

Image-based commands (use your profile picture or tag someone else to use theirs!)
- NEW COMMANDS: beautiful, bobross, delete, fear, painting, patrick, religion, respect, sacred

__**A lot of bug fixing!**__
We've kept our nose close to the error logs, and understand your frustration with errors related to customization commands! We've done a lot of bug squashing!
- There should no longer be unknown errors.
- Commands should now be compatible with slash command functionality. 
- Additionally, the purge command should work properly. We promise!

__**Improved error tracking!**__
More boring dev talk, but we've implemented better logging to improve our understanding of the context of errors. So we can address bugs faster!

Missed the v5.0 update notes? They're long as hell! Read it on <https://top.gg/bot/520682706896683009?tab=updates>.
`
      );
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Updates;
