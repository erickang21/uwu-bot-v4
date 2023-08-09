
const Command = require("../../structures/Command.js");

class Rate extends Command {
  constructor(...args) {
    super(...args, {
      description: "rate someone based on anything you want!",
      usage: "rate <user> <thing>",
      options: [{
        name: "user",
        description: "the user you want to rate",
        type: "user",
        required: true
      },
      {
        name: "thing",
        description: "what you want to rate them on",
        type: "string",
        required: true,
      },
    ]});
  }
  
  async run(ctx, options) {
    const user = options.getUser("user");
    const thing = options.getString("thing");
    const rating = Math.floor(Math.random() * 100);
    const embed = this.client.embed(user)
      .setTitle(`rating: ${thing}`)
      .setDescription(`${":star:".repeat(Math.floor(rating / 20))} **${rating}%**`)
      .setColor(0x9590EE)
    return ctx.reply({ embeds: [embed] });
  }   
}


module.exports = Rate;