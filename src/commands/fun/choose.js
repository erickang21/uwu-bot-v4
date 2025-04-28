const Command = require("../../structures/Command.js");
const { random } = require("../../utils/utils");

class Choose extends Command {
  constructor(...args) {
    super(...args, {
      description: "Indecisive? Let uwu bot pick for you!",
      usage: "choose <choices>",
      options: [{
        name: "choices",
        description: "Choices you want to choose between, separated WITH COMMAS.",
        type: "string",
        required: true,
      }],
    });
  }

  async run(ctx, options) {
    const choices = options.getString("choices");
    if (!/[A-Za-z0-9]+,[A-Za-z0-9]+/g.test(choices)) return ctx.reply("Confused on how to use this command? Separate your choices with commas. (Eg. `uwu choose Go out to eat,Stay at home and rot,Go study`)");
    const choiceArr = choices.split(",");
    if (choiceArr.length > 20) return ctx.reply("You can only add up to 20 choices. It can't be that cooked, can it?");
    const embed = this.client.embed(ctx.author)
      .setTitle("Choice")
      .setDescription(`I choose...\n**${random(choiceArr).trim()}**`)
      .setColor(0x9590EE)
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Choose;
