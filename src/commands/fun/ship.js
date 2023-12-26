
const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");

class Ship extends Command {
  constructor(...args) {
    super(...args, {
      description: "find out how much two people are meant for each other!",
      usage: "ship <user1> <user2>",
      options: [{
        name: "user1",
        description: "the first user",
        type: "user",
        required: true
      },
      {
        name: "user2",
        description: "the second user",
        type: "user",
        required: true,
      },
    ]});
  }
  
  async run(ctx, options) {
    const user1 = options.getUser("user1");
    const user2 = options.getUser("user2");
    const name1 = user1.username;
    const name2 = user2.username;
    let text;
    const rating = Math.floor(Math.random() * 100);
    if (rating < 20) {
      text = `absolutely awful. stay as far away from each other as possible. ${emojis.ship1}`;
    } else if (rating >= 20 && rating < 40) {
      text = `they aren't quite for each other. ${emojis.ship2}`
    } else if (rating >= 40 && rating < 60) {
      text = `it's a decent match, but they can do better. ${emojis.ship3}`
    } else if (rating >= 60 && rating < 80) {
      text = `it's looking good! y'know what would look better? a date. ${emojis.ship4}`
    } else {
      text = `one true pair. go kiss. NOW. ${emojis.ship5}`
    }
    const shipName = name1.substring(0, name1.length / 2) + name2.substring(name2.length / 2, name2.length);
    text += `\n\n**rating:** ${rating}%\n**ship name:** ${shipName.toLowerCase()}`;
    const embed = this.client.embed()
      .setTitle(`ship: ${name1} x ${name2}`)
      .setDescription(text)
      .setColor(0x9590EE)
    return ctx.reply({ embeds: [embed] });
  }   
}

module.exports = Ship;