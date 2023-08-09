const Command = require("../../structures/Command.js");
const utils = require("../../utils/utils");

class Eightball extends Command {
  constructor(...args) {
    super(...args, {
      description: "ask the magic 8ball a question!",
      aliases: ["8ball"],
      usage: "8ball <question>",
      options: {
        name: "question",
        description: "the question to ask the magic 8ball",
        type: "string",
        required: true,
      },
    });
  }

  async run(ctx, options) {
    const responses = ['It is certain. :white_check_mark:', 'It is decidedly so. :white_check_mark:', 'Without a doubt. :white_check_mark:', 'Yes, definitely. :white_check_mark:', 'You may rely on it. :white_check_mark:', 'As I see it, yes. :white_check_mark:', 'Most likely. :white_check_mark:', ' Outlook good. :white_check_mark:', 'Yes. :white_check_mark:', 'Signs point to yes. :white_check_mark:', 'Reply hazy, try again. :large_orange_diamond: ', 'Ask again later. :large_orange_diamond: ', 'Better not tell you now. :large_orange_diamond: ', 'Cannot predict now. :large_orange_diamond: ', 'Concentrate and ask again. :large_orange_diamond: ', 'Do not count on it. :x:', 'My reply is no. :x:', 'My sources say no. :x:', 'Outlook not so good. :x:', 'Very doubtful. :x:']
    const question = options.getString("question");
    const embed = this.client.embed(ctx.author)
      .setTitle(question)
      .setDescription(utils.random(responses))
      .setColor(0x9590EE)
      .setAuthor("The Mighty 8-Ball", "https://vignette.wikia.nocookie.net/battlefordreamislandfanfiction/images/5/53/8-ball_my_friend.png/revision/latest?cb=20161109021012")
    return ctx.reply({ embeds: [embed] });
  }
}

module.exports = Eightball;
