const Command = require("../../structures/Command.js");
const emojis = require("../../structures/Emojis");
const { random } = require("../../utils/utils");

class Work extends Command {
  constructor(...args) {
    super(...args, {
      description: "In this economy?! Get a simple math question done and earn credits for it!",
      cooldown: 900,
      avoidTimeout: true,
    });
  }

  async run(ctx) {
    const guildSettings = this.client.settings.guilds.get(ctx.guild.id);
    let updatedServerEconomy = guildSettings?.economy;
    if (!updatedServerEconomy) {
      updatedServerEconomy = {};
    }
    if (!updatedServerEconomy[ctx.author.id]) {
      updatedServerEconomy[ctx.author.id] = 0;
    }

    let first = Math.floor(Math.random() * 1000);
    let second = Math.floor(Math.random() * 1000);
    if (first < second) {
      let temp = first;
      first = second;
      second = temp;
    }
    let question, result;
    const choice = Math.floor(Math.random() * 2);
    if (choice === 1) {
      question = `${first} + ${second}`
      result = first + second;
    } else {
      question = `${first} - ${second}`
      result = first - second;
    }
    const filter = (msg) => msg.author.id === ctx.author.id;
    await ctx.channel.send(`Think you're smart? Prove it by solving the math question below!\n\n**${question}**`)
    let collected;
    try {
      collected = await ctx.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });
    } catch (err) {
      return ctx.reply("You took too long! You didn't receive any credit for this.");
    }
    let amount = 2500 + Math.floor(Math.random() * 500);
    const emoji = guildSettings?.economyIcon || ":banana:";
    const mathAnswer = new Array([...collected.values()])[0][0]?.content;
    if (mathAnswer.toString() === result.toString()) {
      updatedServerEconomy[ctx.author.id] += amount;
      ctx.reply(`So smart~ You earned **${amount}** ${emoji} for that!`);
    } else {
      ctx.reply("Nani?! What was that? You're wrong, and you'll have to wait a bit to try again...");
    }
    this.client.guildUpdate(ctx.guild.id, { economy: updatedServerEconomy });
  }
}

module.exports = Work;
