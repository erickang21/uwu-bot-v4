
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
    const shipName = name1.substring(0, name1.length / 2) + name2.substring(name2.length / 2, name2.length);
    const heartCount = 1 + Math.floor(rating / 20);
    if (rating < 20) {
      text = `Absolutely awful. **${name1}** and **${name2}** should stay as far away from each other as possible. ${emojis.ship1}`;
    } else if (rating >= 20 && rating < 40) {
      text = `I think **${name1}** and **${name2}** aren't quite for each other. ${emojis.ship2}`
    } else if (rating >= 40 && rating < 60) {
      text = `It's a decent match. I'm rooting for you, **${[name1, name2][Math.floor(Math.random() * 1.99)]}**! ${emojis.ship3}`
    } else if (rating >= 60 && rating < 80) {
      text = `Looking great! Y'know what would look better? If **${name1}** took **${name2}** on a date. ${emojis.ship4}`
    } else {
      text = `**${name1}** and **${name2}** are one true pair. Go kiss. NOW. ${emojis.ship5}`
    }

    text += `\n\n**Rating:** ${rating}% ${emojis.FloatingHearts.repeat(heartCount)}${emojis.outline.repeat(5 - heartCount)}\n**Ship Name:** ${shipName.toLowerCase()}`;
    const embed = this.client.embed()
      .setTitle(`${name1} x ${name2}`)
      .setDescription(text)
      .setColor(0x9590EE)
    return ctx.reply({ embeds: [embed] });
  }   
}

module.exports = Ship;