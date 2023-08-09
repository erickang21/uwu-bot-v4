const Command = require("../../structures/Command.js");

class Mimic extends Command {
  constructor(...args) {
    super(...args, {
      description: "send a message pretending to be someone else!",
      usage: "mimic <user> <text>",
      options: [
        {
          name: "user",
          description: "the user you're trying to impersonate",
          type: "user",
          required: true
        },
        {
          name: "text",
          description: "the text you want to say as them",
          type: "string",
          required: true,
        },
      ],
      botPermissions: ["ManageWebhooks"],
    });
  }

  async run(ctx, options) {
    const member = await ctx.guild.members.fetch(options.getUser("user").id);
    const text = options.getString("text");
    await ctx.message.delete();

    const webhook = await ctx.channel.createWebhook({
      name: member.nickname || member.user.displayName,
      avatar: member.avatarURL({ size: 64, extension: "png"}) || member.user.avatarURL({ size: 64, extension: "png"}),
      reason: `uwu bot: mimic command (ran by ${ctx.author.tag})`
    })
    await webhook.send(text);
    await webhook.delete();
  }
}

module.exports = Mimic;
